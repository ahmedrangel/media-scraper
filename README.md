# media-scraper
[![npm version][npm-version-src]][npm-version-href]

TypeScript-first multi-platform social media scraper without API keys.

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

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/media-scraper.svg?style=flat
[npm-version-href]: https://npmjs.com/package/media-scraper