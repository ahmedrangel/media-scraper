export const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.7151.122 Safari/537.36";

const secFetchHeaders = {
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "same-origin"
};

export const facebookHeaders = {
  "User-Agent": userAgent,
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  ...secFetchHeaders
};

export const threadsHeaders = {
  "User-Agent": userAgent,
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  ...secFetchHeaders
};

export const instagramHeaders = {
  "User-Agent": userAgent,
  "X-IG-App-ID": "936619743392459",
  "X-FB-LSD": "AVqbxe3J_YA",
  "X-ASBD-ID": "129477",
  ...secFetchHeaders
};

export const twitterHeaders = {
  "Cache-Control": "no-cache",
  "user-agent": userAgent,
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "X-Twitter-Active-User": "yes",
  "X-Twitter-Client-Language": "en",
  ...secFetchHeaders
};
