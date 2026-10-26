---
title: A Cryptominer Lived in My Homelab for 40 Days and a Broken NAS Is What Found It
keywords: Incident Response, Homelab, Security, Docker, Plausible, CVE, XMRig, Wazuh, Proxmox, Postmortem
date: 2026-10-26
description: "A 199% CPU process I noticed while chasing an unrelated NAS failure turned out to be a Monero miner that had been living inside one of my containers for forty days, let in by an unauthenticated RCE in a self-hosted app I had published to the internet five months earlier."
draft: false
lastmod: 2026-10-26
---
# A Cryptominer Lived in My Homelab for 40 Days and a Broken NAS Is What Found It

I did not find this by monitoring anything. I found it because a NAS stopped answering and I went looking for why the host had a load average of 15.

That is the part I keep coming back to. The homelab has a SIEM. It has a weekly digest that emails me a summary of every alert in the fleet. It has uptime checks and a health script that runs every thirty minutes and shouts at me when a container is down. None of that noticed a process burning two CPU cores for forty days. What noticed was an unrelated outage that made me run `top` for a completely different reason, and then a number that did not belong.

This is the write-up of what happened, how I worked out what it was, why the monitoring did not catch it, and what I would do differently.

## THE OUTAGE THAT WAS NOT THE STORY

The symptom was that the Proxmox host would not finish booting. Web UI never came up. When I got in over SSH, load was around 15 and eleven processes were parked in uninterruptible sleep, which in Linux means they are waiting on something that will never answer. All eleven were waiting on an NFS mount.

That mount is where this homelab keeps its backups, and the NFS server is a VM on the same host. So the dependency is circular: the host waits for the NAS, the NAS is a guest on the host, and when the NAS does not come up the host waits forever for a filesystem that cannot exist yet. One of the drives attached to the NAS was also throwing hardware errors through its USB bridge — `Unit Not Ready`, sense key `Hardware Error` — which is what had knocked the NAS over in the first place, and which may or may not be the drive itself. I still owe that mystery an answer.

I fixed the immediate problem: took the suspect drive out of the VM configuration, switched the NFS storage to soft timeouts so a dead NAS can never wedge the host again, and made the host's USB mount reference a UUID with `nofail` instead of a device name that moves around. Load came down from 15 to about 3.

And then, while watching `top` to confirm it stayed down, I saw a process using 199% of a CPU.

## THE PROCESS THAT SHOULD NOT HAVE BEEN THERE

The name was `linuxsys`. It had been running for **30 days**. Its working directory was `/var/tmp`. Its executable was `/var/tmp/linuxsys` and the kernel was reporting it as `(deleted)`.

That last detail is the tell. Legitimate software does not unlink its own binary while running. The file is gone from the filesystem, but the kernel keeps the inode alive for as long as a process holds it, because on Unix a deleted file is not deleted until nothing has it open. Which also means the binary was still there to be taken: `cat /proc/<pid>/exe > linuxsys.bin` pulls a working copy out of a process whose file no longer exists. That is the single most useful forensics trick in this whole story, and it costs one line.

Two more facts came out of the first minute:

- The cgroup was `/lxc/127/…/docker-<id>.scope`, so it belonged to a Docker container on one of my LXC guests. That container was a self-hosted Plausible analytics instance.
- The parent process was `beam.smp` — the Erlang VM that Plausible runs on. Not a shell, not `sshd`, not a cron job. Whatever started this thing did it **inside the application process**.

I did not know it was a miner yet. I knew three things: unknown binary, deleted on disk, running as a child of a web app.

## FIGURING OUT WHAT IT WAS

The binary was 10 MB, stripped, static, and named to look like a system daemon. `strings` did not need to be clever about it:

```
XMRIG_VERSION
XMRIG_KIND
cryptonight-monerov7
stratum+tcp://
```

XMRig. A Monero miner. The SHA-256 was `4d17d32e…ab5b`, and the process had one established connection to a pool on port 80, which is why it never looked like anything unusual from the outside — mining traffic on port 80 is indistinguishable from a browser being a browser unless you are looking.

Cost of all this, in case you are wondering what a complacent homelab is worth to someone: about two cores and 2.5 GB of RAM, continuously, for forty days.

## THE INTRUDER WROTE MY TIMELINE FOR ME

Here is the part that made the investigation easy, and that I did not expect at all.

Docker keeps the stdout and stderr of a container forever. Code that executes **inside the application** inherits that stream. So every command the attacker ran — and every error it produced — was sitting in `docker logs`, timestamped, waiting for me.

I dumped the log and filtered out the app's own chatter. What was left was their session:

```
wget: can't open 'linuxsys': Permission denied
chmod: linuxsys: No such file or directory
sh: ./linuxsys: not found
ps: unrecognized option: sort=-%cpu
BusyBox v1.37.0 ... multi-call binary.
```

Read that again, because it tells the entire story of a sloppy, automated, persistent attack. They tried to download the miner into a directory they could not write to. They tried to `chmod` a file that therefore did not exist. They tried to run it. Then they tried to check whether it was running with `ps aux --sort=-%cpu`, which fails on BusyBox — so **the attacker never once managed to see their own miner's CPU usage**. It was running at 199% of a core and their verification tool answered with a usage message.

Counting the noise gave me the shape of it:

- **660** attempts that died with `curl: not found` — the container image has no curl, only busybox `wget`, and they kept forgetting.
- **685** attempts at `ps aux --sort=-%cpu`, all rejected.
- First attempt in the log: **2026-09-17 at 04:03 UTC**.
- The drop that worked: **2026-09-26 at 01:34 UTC** — which matched, to the minute, the start time of the process I had just found.

Nine days of failing to write a file, then a success, then forty days of checking on it with a broken command. Daily, without a gap, right up to twenty minutes before I killed it.

## HOW IT GOT IN

The version in the container was Plausible CE **3.2.0**, and that version was vulnerable to **CVE-2026-8467**, a 9.5-severity unauthenticated remote code execution via HEEx template injection in the `phoenix_storybook` playground — the `/storybook` endpoint that Plausible's image ships. It affects every CE release from 3.0.0 through 3.2.0 and was fixed in 3.2.1.

The timing is not subtle. The advisory was published on 2026-05-20. The build I was running was created on 2026-05-01 and had been exposed on a public hostname through a Cloudflare tunnel since **2026-05-01 04:33 UTC** — two minutes after the container was created. When I checked the tunnel configuration during the investigation, the ingress rule pointed that hostname straight at the container's published port with TLS verification off.

So the answer to "how did it get in" is embarrassingly mundane: I published a five-month-old unpatched web app to the internet, and an automated scanner found the endpoint, and the endpoint ran code.

Three details corroborate it beyond the version match. The payload's parent was the app's own runtime, which is what an application-layer injection produces. The timing of the successful drop lines up to the minute with the process. And there was no shell history, no SSH session, no stolen key anywhere — because none of those were needed.

## WHY WAZUH DID NOT CATCH IT

This is the part I have been chewing on, and the honest answer is that it is a blind spot by design, not a tuning problem.

The Wazuh agent on that guest collects `journald`, syslog, and a few periodic commands. It has file integrity monitoring configured on `/etc`, `/usr/bin`, `/usr/sbin`, `/bin`, `/sbin` and `/boot`. And it has **no `docker-listener` configured at all** — zero occurrences in `ossec.conf` — so nothing that happened inside a container was ever an event the agent could see.

Follow that through to each thing the miner did:

- **The binary landed in `/var/tmp` inside a container's overlay filesystem.** File integrity monitoring was watching `/etc` and `/usr/bin` on the guest, not `/var/lib/docker/overlay2`. No event.
- **The process was spawned inside the app.** Process auditing on the guest does not see inside a container's PID namespace; there was no `execve` rule to fire either way.
- **It used 199% CPU for forty days.** Wazuh does not alert on CPU. It alerts on known-bad patterns in logs and on file changes, and "a process is using two cores" is not a pattern in a log unless something is writing it down.
- **Its traffic went to a pool on port 80.** Egress was not monitored, and port 80 is not an anomaly.
- **The container's own stdout — the thing that turned out to contain the attacker's entire command history — was never forwarded to a log source Wazuh reads.** Docker writes it to a JSON file on the guest. Nobody was tailing it.

And then the noise tax. The only level-10 alerts in my fleet on a normal week came from a network discovery scanner of mine probing service wordlists every night, which produced 404s on every host that logs them. I had a digest that had spent weeks explaining that those alerts were mine and not an intrusion. That is exactly the habit that makes you skim a security report: the sensor was working, and what it was saying was boring.

So: the agent was configured for a guest that runs services, and the workload had moved into containers. The monitoring did not follow the workload, and nothing about that failure is dramatic. It is just a configuration that quietly stopped covering what was actually running.

What would have caught it, in rough order of effort:

1. **The Docker listener.** Wazuh's `docker-listener` module turns container start/stop/die events into alerts. It would not have caught the payload itself, but a container spawning an unexpected child would have been visible.
2. **A per-container CPU check in the health script.** Ten lines of `docker stats`, an alert above a threshold, and this ends on day one instead of day forty. This is the one I am actually annoyed about, because I already had a health check that runs every thirty minutes and it was watching the wrong thing — liveness, not behaviour.
3. **Process auditing that covers the container.** `auditd` rules on `execve` in the guest, or an eBPF sensor, catch "a new binary nobody installed started running" regardless of which namespace it started in.
4. **Egress visibility.** A miner talking to a pool on port 80 is only invisible if you never look at outbound destinations.

## WHAT CONTAINMENT ACTUALLY LOOKED LIKE

The ordering matters more than the commands, so here it is in the order I did it.

**Evidence first, before anything died.** Copy the binary out of `/proc`. Record the hash, the parent, the cgroup, the connection. Write it down somewhere that survives the session.

**Then the restart policy.** The container was `restart: always`. If I had stopped it first, Docker would have brought it straight back and I would have spent an hour believing my kill had failed. `docker update --restart=no` on the whole stack, *then* stop.

**Then the payload.** It went down with its parent, but I verified rather than assumed — and verified three different ways, because one is not enough: no process with that argv, no process whose executable lives in `/var/tmp`, no established connection to the pool.

**Then the network, at both layers.** The host's `OUTPUT` chain does not cover a container's network namespace, and the container's rules do not cover the host, so the same block goes in three places: host `OUTPUT` and `FORWARD`, and `OUTPUT`, `FORWARD` and `INPUT` inside the guest. Then prove it from inside — a connection attempt that should now fail, and does.

**Then a scheduled follow-up.** Containment is not the end of an incident, it is the end of the urgent part. I put a one-shot check on a timer that re-verifies forty-five minutes later: process gone, no connection, containers still stopped, firewall rules still in place. Written into the job itself, because a cron job starts with no memory of the conversation that created it — including the instruction not to start the container again.

One thing I did *not* do: "clean" anything. No `rm`, no deleting the container, no deleting volumes. If it is evidence, you copy it, you do not move it. The container is still there, stopped, with its volumes intact, and the binary is in a folder on the host with a hash next to it.

## THE THINGS THAT STILL BOTHER ME

I could not find a persistence mechanism, and I looked. `docker diff` on the container is empty. The entrypoint is the original from the image. There is no cron of theirs, no modified startup file, nothing in `/var/tmp`. The payload existed only as a running process whose file had been unlinked.

That is not reassuring, it is clarifying: there was nothing to clean, because the infection *was* the endpoint. Every day the attacker came back and re-exploited it. Which means the fix was never "remove the miner" — the fix was the version, and the exposure, and I had neither on a schedule.

I also cannot prove which request delivered the code injection, because the app did not log HTTP requests and I had no proxy in front of it. I can show the vulnerable version, the public route, the parent process, and the attacker's own commands. That is enough to be certain and not enough to be a smoking gun, and I would rather write that down than round it up.

Two things I noticed while I was in there and have not finished: the same tunnel publishes twenty-two ingress rules, and one of them was pointing my Portainer admin UI at the internet. That is not a miner, that is an invitation. And the drive that started all of this still reports hardware errors through its bridge on every attempt, which means I still do not know whether the problem is the drive, the enclosure, or the USB link — and I would rather say that than pretend the NAS mystery is closed.

## WHAT I CHANGED BEFORE WRITING THIS

- The vulnerable container is stopped and stays stopped. If that service comes back, it comes back at a version that is not 3.2.0, behind an access policy, not on a public hostname.
- Every secret that lived in that guest is being treated as leaked. There was unauthenticated code execution on it for forty days; the honest assumption is that anything stored there was readable. Passwords are being rotated, starting with the databases.
- The NFS storage now fails fast instead of hanging the host, and the host's fstab no longer depends on a device name that moves when USB drives are plugged and unplugged. Different bug, same lesson: single points of failure that fail *slowly* are worse than ones that fail loudly.
- The health check gets a behaviour check, not just a liveness check. "The container is up" would have been true for all forty days.

## THE PART WORTH KEEPING

I am a QA automation engineer, so I will say it the way I would say it about a test suite: I had monitoring that was green and a system that was compromised, and those are two different sentences that are very easy to read as one. My checks asserted that services were *running*. The miner was running too. Nothing in my monitoring disagreed with the miner.

The thing that found it was an unrelated failure that forced me to look at a machine in a way my monitoring never does — at the process table, by eye, because something else was broken. That is not a security strategy, it is luck with a nice story attached, and the only useful part is that I can now turn the luck into a check.

If there is a single line here, it is this: **publish a service to the internet and you have started a patch clock, whether or not you wrote it on the calendar.** Mine started on the first of May and I did not look at it until the twenty-sixth of October, and the only reason I looked at all is that a disk made the server stop booting.

Two disclosures, because I would rather say them than have them inferred. I used an AI agent to do most of the legwork on this — the cgroup attribution, extracting the binary from `/proc`, dumping and grepping the container logs, checking the tunnel configuration against the Cloudflare API — and I verified every claim that ended up in this post, including the ones that turned out to be wrong at first (I briefly convinced myself the payload had survived container restarts, and the timestamps say it had not). And the details are sanitized on purpose: private addresses replaced, the public hostname left out, the pool address left out. The vulnerable versions and the CVE are public, and the binary hash is `4d17d32ed6efe92ea61d16602f9c6cd5261cdd3820adec427ee68d4088b6ab5b` in case anyone wants to match it against their own fleet.
