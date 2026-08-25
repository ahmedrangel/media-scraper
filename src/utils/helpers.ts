export const userAgent: string = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36";
export const mobileUserAgent: string = "Mozilla/5.0 (Linux; Android 17; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36";

const sharedHeaders: Record<string, string> = {
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "User-Agent": userAgent,
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "same-origin"
};

export const facebookHeaders: Record<string, string> = {
  ...sharedHeaders
};

export const threadsHeaders: Record<string, string> = {
  ...sharedHeaders
};

export const instagramHeaders: Record<string, string> = {
  ...sharedHeaders
};

export const twitterHeaders: Record<string, string> = {
  "Cache-Control": "no-cache",
  "X-Twitter-Active-User": "yes",
  "X-Twitter-Client-Language": "en",
  ...sharedHeaders
};

export const redditHeaders: Record<string, string> = {
  ...sharedHeaders
};

export const twitchHeaders: Record<string, string> = {
  "Client-Id": "kimne78kx3ncx6brgo4mv6wki5h1ko",
  "Content-Type": "application/json"
};

export const tiktokHeaders: Record<string, string> = {
  ...sharedHeaders
};
