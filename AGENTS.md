# AGENTS.md - Agent Coding Guidelines for This Repository

This is a Hugo-based blog. Agents should understand static site generation and Markdown content.

---

## 1. Build, Lint, and Test Commands

### Build Commands

```bash
# Build the site for production (outputs to ./public)
hugo

# Build with minification and garbage collection
hugo --gc --minify

# Development server with live reload
hugo server

# Development server on custom port
hugo server -D -p 1313
```

### Linting

```bash
# No JavaScript linting configured (static site)
# For markdown content, ensure frontmatter is valid YAML

# Validate Hugo configuration
hugo config

# Check for broken links (after build)
hugo --printI18nWarnings
```

### Testing

```bash
# Hugo has no built-in test framework
# This is a static site generator - no unit tests needed

# To test locally, run the dev server:
hugo server -D

# Then verify output in browser at http://localhost:1313
```

### CI/CD

GitHub Actions workflow in `.github/workflows/hugo.yaml`:
- Builds with Hugo 0.156.0 (extended)
- Deploys to GitHub Pages on push to main

**Note**: Custom layouts go in `layouts/` (overrides theme templates)

---

## 2. Code Style Guidelines

### General Principles

- **Modular**: Keep components small and focused
- **Functional**: Prefer pure functions, immutability
- **Maintainable**: Self-documenting, testable code

### File Organization

```
/                    # Hugo root
├── content/         # Blog posts and pages (Markdown)
│   ├── posts/       # Blog posts (each in own folder with index.md)
│   └── pages/      # Static pages (about.md, etc.)
├── assets/          # Static assets (images, custom JS/SCSS)
├── static/          # Files copied as-is to public/
├── themes/         # Hugo theme (hugo-blog-awesome submodule)
├── config.toml     # Hugo configuration
└── public/         # Build output (generated)
```

### Content Style (Markdown)

**Frontmatter format** (required for all content):
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

**Naming conventions**:
- Post folders: kebab-case (e.g., `my-new-post/`)
- Images: descriptive, lowercase with dashes
- Content files: `index.md` inside post folder

### JavaScript Guidelines

If adding custom JavaScript:

- Place in `assets/js/` (gets minified on production build)
- Reference in `config.toml` under `params.additionalScripts`
- Keep functions small and pure
- Use ES6+ syntax

```javascript
// Good: Pure function
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Avoid: Global state or side effects in scripts
let globalCounter = 0;
```

### CSS/SCSS Guidelines

- Use SCSS in `assets/scss/` for organization
- Follow BEM naming for custom styles
- Theme handles most styling via hugo-blog-awesome

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `my-post-title.md` |
| Functions | camelCase, verbPhrase | `getUserData`, `formatDate` |
| Variables | camelCase, descriptive | `userCount`, `isActive` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| CSS Classes | kebab-case | `.main-content` |

### Error Handling

```javascript
// Validate inputs at boundaries
function processContent(content) {
  if (!content || typeof content !== 'string') {
    return { success: false, error: 'Invalid content' };
  }
  return { success: true, data: content.trim() };
}
```

### Import Guidelines

Not applicable - this is a Hugo theme with minimal custom JavaScript.

### Type Guidelines

Not strictly enforced. For custom JS, use JSDoc for documentation:
```javascript
/**
 * @param {string} date - ISO date string
 * @returns {string} Formatted date
 */
```

---

## 3. Project-Specific Notes

### Theme: hugo-blog-awesome

- Refer to theme documentation for customizations
- Config in `config.toml` controls most features
- Custom scripts: `assets/js/custom.js` (create if needed)

### Content Workflow

1. Create folder in `content/posts/`
2. Add `index.md` with frontmatter
3. Add images to post folder
4. Run `hugo server -D` to preview
5. Set `draft: false` before publishing

### Images

- Place in post folder for local images
- Use relative paths in Markdown: `![Alt text](image.png)`
- Theme handles responsive images automatically

---

## 4. Important Files

| File | Purpose |
|------|---------|
| `config.toml` | Main Hugo configuration |
| `content/posts/*.md` | Blog posts |
| `content/pages/*.md` | Static pages |
| `.github/workflows/hugo.yaml` | CI/CD pipeline |

---

## 5. Common Tasks

### Add a new blog post
```bash
# Create the folder and file manually, then add frontmatter
mkdir content/posts/my-new-post
# Create index.md with proper frontmatter
```

### Modify theme
- Theme is a git submodule in `themes/hugo-blog-awesome`
- Override templates by copying to `layouts/` in root

### Add custom JavaScript
1. Create `assets/js/custom.js`
2. Add filename to `config.toml` → `params.additionalScripts`
