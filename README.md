# media-scraper
TypeScript-first multi-platform social media scraper without API keys.

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
