import getReddit from "media-scraper/reddit";

const data = await getReddit("https://www.reddit.com/r/Catswithjobs/s/MpEkiaSH1g");

console.info(data);