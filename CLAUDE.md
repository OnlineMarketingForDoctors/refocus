# Project rules

## This site must never be indexed by search engines

Every change must keep the site no-indexed:

- Every HTML page must include `<meta name="robots" content="noindex, nofollow">` in its `<head>`. If a framework generates the `<head>`, set this in the root layout so it applies to every page.
- Keep the `X-Robots-Tag: noindex, nofollow` header in `vercel.json` covering all paths (`/(.*)`). If the site moves to another host, add the same header in that host's config before going live.
- Do not add a `robots.txt` that disallows crawling. A crawler that is blocked from a page never sees its noindex tag, so the URL can still show up in search results.
- Do not add a sitemap, and do not submit the site to search consoles.
