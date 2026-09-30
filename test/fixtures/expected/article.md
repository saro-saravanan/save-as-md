---
title: "Why lazy images break printing"
source: "https://blog.example.com/posts/lazy-images"
site: "Example Blog"
author: "Ada Lovelace"
published: "2026-09-01T08:00:00Z"
saved: "2026-01-01T00:00:00.000Z"
---

# Why lazy images break printing

Most modern sites load images only when you scroll near them. That keeps pages fast, but it means anything that captures the page before you scroll sees empty placeholders instead of pictures.

Print-to-PDF is one of those captures. The browser lays the page out for paper, and any image that never entered the viewport stays a grey box or disappears entirely.

![Placeholder next to the real image](https://blog.example.com/img/placeholder-vs-real.png)

A placeholder next to the real image.

The fix is to read the real address from attributes like `data-src` or `srcset` before saving. Browsers keep those around even when the image has not loaded yet.

> If a tool saves the placeholder, you only find out months later, when the original page is gone.

```js
img.src = img.dataset.src;
```

With that one change, a saved copy contains every picture, and the file still makes sense long after the site has moved on or shut down.

Read more on the [archive page](https://blog.example.com/archive?page=2).
