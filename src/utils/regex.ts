export const facebookRegex = /^https?:\/\/(?:www\.|web\.|m\.)?facebook\.com\/(watch(\?v=|\/\?v=)[0-9]+(?!\/)|reel\/[0-9]+|[a-zA-Z0-9.\-_]+\/(videos|posts)\/[0-9]+|[0-9]+\/(videos|posts)\/[0-9]+|[a-zA-Z0-9]+\/(videos|posts)\/[0-9]+|share\/(v|r)\/[a-zA-Z0-9]+\/?)([^/?#&]+).*$|^https:\/\/fb\.watch\/[a-zA-Z0-9]+$/g;
export const instagramRegex = /^https?:\/\/(?:www\.)?instagram\.com\/(?:[^/]+\/)?(?:p|reel|reels|tv|stories|share)\/([^/?#&]+).*/g;
export const twitterRegex = /^https:\/\/(?:x|twitter)\.com(?:\/(?:i\/web|[^/]+)\/status\/(\d+)(?:.*)?)?$/g;
export const twitchRegex = /^https?:\/\/(?:www\.)?twitch\.tv\/(?:clips\/([^/?#&]+)|[^/]+\/clip\/([^/?#&]+))|^https?:\/\/clips\.twitch\.tv\/([^/?#&]+)$/g;
export const tiktokRegex = /^https?:\/\/(?:www\.|m\.|vm\.|vt\.)?tiktok\.com\/(?:@[^/]+\/(?:video)\/\d+|v\/\d+|t\/[\w]+|[\w]+)\/?/g;
export const redditRegex = /https?:\/\/(www\.)?reddit\.com\/r\/[\w\d_]+(?:\/comments\/[\w\d]+\/[\w\d_]+)?(?:\/s\/[\w\d]+)?|https?:\/\/v\.redd\.it\/[\w\d]+/g;