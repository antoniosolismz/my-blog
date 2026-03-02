<!-- Context: project-intelligence/project | Priority: critical | Version: 1.0 | Updated: 2026-03-01 -->

# Project: Antonio's Technology Blog

> Personal Hugo-based blog for technology articles.

---

## Quick Reference

| Item | Value |
|------|-------|
| **Type** | Static site (Hugo) |
| **Theme** | hugo-blog-awesome |
| **Hugo Version** | 0.156.0 (extended) |
| **Deploy** | GitHub Pages |
| **URL** | https://blog.antoniosolismz.com |

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| SSG | Hugo | 0.156.0 (extended) |
| Theme | hugo-blog-awesome | 1.21.0 |
| Hosting | GitHub Pages | - |
| CI/CD | GitHub Actions | - |

---

## Build Commands

```bash
# Production build (outputs to ./public)
hugo --gc --minify

# Development server with live reload
hugo server -D

# Development server on custom port
hugo server -D -p 1313

# Validate configuration
hugo config
```

---

## Project Structure

```
/
├── content/              # Blog posts and pages (Markdown)
│   ├── posts/           # Blog posts (each in own folder with index.md)
│   └── pages/           # Static pages (about.md)
├── static/              # Files copied as-is to public/
├── assets/              # Static assets (images, custom JS/SCSS)
├── layouts/             # Custom layouts (overrides theme)
├── config.toml          # Hugo configuration
├── themes/              # Hugo themes (git submodule)
└── public/              # Build output (gitignored)
```

---

## Content Format

### Frontmatter (required for all content)

```yaml
---
title: "Page Title"
keywords: "comma, separated, keywords"
date: 2024-01-15
description: "Meta description for SEO"
draft: false
lastmod: 2024-01-15
---
```

### File Naming

- Post folders: kebab-case (e.g., `my-new-post/`)
- Content files: `index.md` inside post folder

---

## Common Tasks

### Add a new blog post
```bash
mkdir content/posts/my-new-post
# Create index.md with proper frontmatter
```

### Modify theme
- Theme is a git submodule in `themes/hugo-blog-awesome`
- Override templates by copying to `layouts/` in root

### Add custom JavaScript
1. Create `assets/js/custom.js`
2. Add filename to `config.toml` → `params.additionalScripts`

---

## CI/CD

GitHub Actions workflow: `.github/workflows/hugo.yaml`
- Trigger: Push to main branch
- Hugo version: 0.156.0
- Deploys to GitHub Pages

---

## Key Files

| File | Purpose |
|------|---------|
| `config.toml` | Main Hugo configuration |
| `content/posts/*.md` | Blog posts |
| `content/pages/*.md` | Static pages |
| `layouts/_default/rss.xml` | Custom RSS template |
| `AGENTS.md` | Agent coding guidelines |

---

## Recent Changes

- **2026-03-01**: Updated Hugo to 0.156.0, theme to v1.21.0
- **2026-03-01**: Added custom RSS template for Hugo 0.156 compatibility
- **2026-03-01**: Added AGENTS.md for agent guidelines
