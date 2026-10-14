---
title: Every Test Was Green and My Printer Was Still Wrong
keywords: Reverse Engineering, Bluetooth, BLE, Web Bluetooth, Thermal Printer, QA, Testing, Protocol, PWA, Homelab
date: 2026-10-14
description: "I bought a small thermal printer whose companion app I did not trust, reverse engineered the Bluetooth protocol, and wrote my own. Every test passed three separate times before the printer agreed with me, which is the part worth writing about."
draft: false
lastmod: 2026-10-14
---
# Every Test Was Green and My Printer Was Still Wrong

I bought one of those little thermal printers from AliExpress, the kind that fits in a jacket pocket and prints on receipt paper, mostly because it cost less than dinner and I wanted something to take apart. It arrived, I charged it, and then I did what everyone does: I read the reviews of the app you are supposed to use with it, and they were bad. Not "the UI is ugly" bad. "It asks for everything and does nothing" bad.

So the printer sat on my desk for a day while I decided whether I wanted it badly enough to install an app I did not trust, and somewhere in there the actual project showed up. The printing itself is just Bluetooth. The printer does not know what an internet connection is. If I could work out what it expects over the wire, I could write my own app, keep it on my own server (la impresora no necesita internet para nada), and never find out what the original app wanted with my photos.

This post is about that, but it is mostly about the three times I was completely wrong while every single test I had written told me I was right, because that turned out to be the interesting part.

## THE PRINTER AND THE APP I DID NOT WANT

The unit is an LX-D02: 58 mm paper, 203 dpi, a print head 384 dots wide, seven heat levels, and no idea what day it is. It advertises itself over Bluetooth Low Energy as `LX-D02` and nothing else useful, which matters later.

The app is `com.lailaixiong.funnyprint`, version 2.8.1, built on React Native. I unpacked the APK rather than installing it. The JavaScript ships as a Hermes bytecode bundle, so the interesting logic is not readable source, but the strings are all still in there, and the strings are honest about what the app is doing. The shape of it: the app's image handling talks to `img.dolewa.com` and `img.lailaixiong.com.cn`, and there is an API host next to them. Nothing about that is necessarily malicious; sending a JPEG somewhere to be resized and converted to a bitmap is a normal way to build this. It is just also completely unnecessary, because the printer does not accept JPEGs. It accepts dots. Somebody has to decide which dots, and I could be that somebody, on my own machine, with the network switched off.

So the goal was specific and a little stubborn: **an app that can print, that has no accounts, no analytics, and no network permissions, and that I can prove is doing nothing else.** That last clause is the one that made the project what it is.

## WHAT THE PRINTER ACTUALLY SPEAKS

Reverse engineering a BLE device is easier than it sounds, because you are not guessing at a secret. You are reading someone else's homework. In this case the bytecode names its own commands in log strings, and there is a second implementation of this printer family out in the world (`cicloid/printable`) that has been tested against real hardware. Between the two, the protocol is not mysterious:

- The service is `0xFFE6`, with a write characteristic on `0xFFE1` (write without response) and notifications on `0xFFE2`. The app finds them by substring match rather than exact UUID, which is worth copying, because these printers are cheap and the next batch may ship slightly different ones.
- Control frames are 12 bytes and start with `0x5A`. Raster frames are 100 bytes and start with `0x55`. The receiver distinguishes them on the first byte, which is a refreshingly simple design.
- A raster frame carries 96 bytes of image data — two lines of 48 bytes, one bit per dot — with the rest as header. Everything is one bit: a dot is burned or it is not.
- The connection opens with a handshake that looks like authentication and is not. The host sends a challenge, the printer answers with something derived from its own MAC address, and the host checks it. There is no secret. It is a lock to keep other apps out, not a security boundary, and the moment I understood that I stopped worrying about it.

None of this is the story either, although I will admit that seeing a test page come out of the cheapest printer I own, driven by a page I wrote myself, was a genuinely good
feeling.

## THE CROSS-CHECK THAT CAUGHT TWO BUGS

Here is the first place I was wrong. The obvious assumption for a cheap BLE thermal printer is `0xFFE0`, because that is the JDY/HM-10 family that every tutorial on the internet uses. I wrote the whole first version against `0xFFE0` plus its characteristics, and it was consistent, plausible, and wrong. The printer never complained, because it never connected. Web Bluetooth just refused, which is a much quieter kind of failure.

The fix was to stop trusting myself and check my understanding against the independent implementation, which had been validated against real hardware. Doing that surfaced a second, worse bug that no amount of staring would have found.

The raster header contains a field I had read as a **byte offset** into the image. It is a **packet index**. Both interpretations work perfectly for small jobs, which is the trap: packet 1 has byte offset 1, packet 2 has offset 2, and for the first few hundred packets the two are indistinguishable. Then the job gets big and the numbers drift apart, and the printer does something creative with the data.

That bug is the reason I wrote the rest of this post, because of *how* it failed. It did not fail in the tests. It failed on paper.

## EVERY TEST WAS GREEN AND THE PRINTER WAS STILL WRONG

I had 372 checks at this point — the JavaScript core, the Python reference implementation of the same protocol, the encoders, the layout math. Green, all of it. Here is what the printer did anyway.

**Failure one: it would not connect.** The service UUID was missing from the list the browser is allowed to look at. This one is on the platform, not the printer: Web Bluetooth only lets you touch services you declared up front, and I had declared the wrong family. The error message was `GATT Error: Not supported`, which reads like the printer is refusing you. It was not. I was asking the wrong question.

**Failure two: it printed a sentence with the end cut off.** I printed the test page and read it, and the last line was `This printer makes a lovely rack`. The word `racket` had lost its `et` off the right edge of the paper, quietly, with no error. So I measured that sentence in a real browser at the real font size: **421 pixels of text on 372 pixels of printable width**. Nothing in my code measured anything. It drew lines at fixed positions and let the paper be the editor. The tests were green because every fixture I had written was short enough to fit — I had tested the wrapping logic I did not have.

**Failure three: half of a batch printed.** Four labels, one sheet. The preview looked right, the code looked right, and the paper had labels two, three and four sliding further off the bottom of the sheet, each by exactly one label height. Cut guides, meanwhile, were in the correct places, which is the clue that eventually solved it: one layer was adding the page offset twice. Both layers agreed, both were internally consistent, and the arithmetic was only wrong when combined.

And here is why I let it reach paper, three times: the tests asserted what I believed. They were thoroughly testing my model of the printer, and when my model was wrong, they agreed with me. `packet index` and `byte offset` produce identical bytes for the first few hundred packets. Fixed-position text and correctly-wrapped text produce identical output for short strings. A doubled offset produces a perfect label when the label is at the top of the page, and my single-label test only ever printed the first one.

So the fix was not more tests. It was three specific changes:

1. **Print it.** Every one of these was found by looking at paper, and none by looking at a log.
2. **When a test and the hardware disagree, the hardware is the specification.** The reference implementation is a document, not the truth.
3. **When a bug gets found, the new test has to fail against the old code.** I re-ran the batch regression against the previous version of the page to make sure it actually caught the bug, because a test that passes against the broken code is not a test, it is a decoration.

That last rule is the one I would keep if I could only keep one, and it is the reason the batch bug cannot come back quietly.

## WHAT I STILL DO NOT KNOW

I am not an expert on this hardware, and the honest version of this project includes the gaps.

There is a frame the printer sends that appears in neither the vendor app's dispatcher nor the reference implementation: **12 bytes, opcode `0x0C`**, once, next to a job that printed fine. I log it now with its full contents instead of claiming to understand it.

The printer also has its own idea of timing. On a 341-packet job it twice told me to hold, then told me I had lost a packet and to rewind to an earlier one. My pacing starts at 15 ms between packets and grows by half each time the printer asks me to slow down, capped at 60 ms. That works, but I am treating a symptom: I do not know what the printer's internal buffer is actually doing, only that it can be talked out of the problem.

And one lovely accident: the printer broadcasts its battery level every two seconds on its own, unprompted, even while it is telling me to hold. The vendor app never shows it. Mine has a battery indicator now, for the cost of reading a notification that was already arriving.

## WHY I AM WRITING THIS DOWN

I am a QA automation engineer, and the useful part of this project is not that I reverse engineered a printer's Bluetooth protocol. It is that I shipped a version that was measurably wrong while every check I had was green, and that the thing which caught it was not a better test suite but a piece of paper.

The code, the protocol document with an evidence anchor for every claim, the two hardware session logs, and all 372 checks are public: [github.com/antoniosolismz/Pocketprint](https://github.com/antoniosolismz/Pocketprint). The app itself runs at [print.antoniosolismz.com](https://print.antoniosolismz.com) if you want to poke at it — it needs Chrome or Edge, since Firefox has no Web Bluetooth, and it will happily run with your Wi-Fi off.

Two disclosures, because I would rather say them than have them inferred. I used an AI agent for a large part of the implementation and for the analysis of the vendor app; the judgement calls are mine, including all three of the failures above, which I only found by printing things and looking at them. And the tests were not written to make the project look good: the commit history includes the half-batch fix and the wrong-service bug, because a clean history would have been a worse artifact than an honest one.

If you take one thing from this, it is not about printers. It is that a green suite tells you your tests agree with your assumptions, and those are two different sentences that are very easy to read as one.
