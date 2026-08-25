# media-scraper
[![npm version][npm-version-src]][npm-version-href]

A TypeScript-first, multi-platform social media scraping library with no API keys, authentication, browser automation, or cookies required.

## Install dependency
```bash
# Using npm
npm install media-scraper

# Using pnpm
pnpm add media-scraper
```

## Usage

### Import
`import scrape from "media-scraper/<platform>"`

```js
import scrape from "media-scraper/instagram"

const data = await scrape("https://www.instagram.com/reel/CtjoC2BNsB2")
```

## Supported platforms
- Facebook
- Instagram
- Reddit
- Threads
- TikTok
- Twitch
- X (Twitter)

## Scraping strategy
- [Facebook](/src/scrapers/facebook.ts): HTML parsing
- [Instagram](/src/scrapers/instagram.ts): HTML parsing
- [Reddit](/src/scrapers/reddit.ts): HTML parsing + JS challenge solver
- [Threads](/src/scrapers/threads.ts): HTML parsing
- [TikTok](/src/scrapers/tiktok.ts): Mobile API + TikWM fallback
- [Twitch](/src/scrapers/twitch.ts): GraphQL
- [X (Twitter)](/src/scrapers/x.ts): GraphQL + X-Client-Transaction-Id header generator

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/media-scraper.svg?style=flat
[npm-version-href]: https://npmjs.com/package/media-scraper