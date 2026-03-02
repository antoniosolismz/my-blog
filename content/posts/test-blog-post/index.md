---
title: "Test Blog Post"
keywords: "test, hugo, blog"
date: 2026-03-01
description: "A test blog post to verify the build process works correctly"
draft: false
lastmod: 2026-03-01
---
# Test Blog Post

This is a test blog post to verify that the Hugo build process is working correctly.

## Why This Post Exists

This post was created to ensure that:
- The build process works
- Frontmatter is correctly parsed
- The theme renders content properly

## How to Verify

Run:
```bash
hugo server -D
```

Then visit http://localhost:1313 to see the published post.

## Cleanup

To unpublish, either:
1. Delete this folder: `content/posts/test-blog-post/`
2. Or set `draft: true` in the frontmatter

That's it! If you can read this, the blog is working.
