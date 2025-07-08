# media-scraper
TypeScript-first multi-platform social media scraper without API keys.

## Usage

### Import
`import getMedia from "media-scraper/<platform>"`

```js
import getInstagram from "media-scraper/instagram"

const data = await getInstagram("https://www.instagram.com/reel/CtjoC2BNsB2")
```

## Supported platforms
- Facebook
- Instagram
- Reddit
- Threads
- TikTok
- Twitch
- X (Twitter)