import { $fetch } from "ofetch";
import { parseURL, withQuery } from "ufo";
import { load } from "cheerio";
import { redditHeaders } from "../utils/helpers";
import type { GenericAuthorObject } from "../types";
import { redditRegex } from "../utils/regex";

export default async (url: string): Promise<RedditMedia> => {
  const match = url.match(redditRegex);
  if (!match) throw new Error("Invalid Reddit URL");
  const { protocol, host, pathname } = parseURL(url);
  let redditURL = `${protocol}//${host}${pathname}`;

  const firstCall = await $fetch.raw(redditURL, { headers: redditHeaders }).catch(() => null);
  if (!firstCall) throw new Error("Failed to fetch the Reddit URL");

  let html = "";

  if (firstCall.redirected) {
    const { protocol, host, pathname } = parseURL(firstCall.url);
    redditURL = `${protocol}//${host}${pathname}`;
    html = await $fetch(redditURL, { headers: redditHeaders }).catch(() => null);
  }

  const $ = load(html);
  const form = $("form").first();
  const params = new URLSearchParams();
  form.find("input[type=\"hidden\"]").each((_, input) => {
    const name = $(input).attr("name");
    const value = $(input).attr("value") ?? "";
    if (name) params.append(name, value);
  });

  let scriptContent = "";
  $("script").each((_, el) => {
    const html = $(el).html() || $(el).text() || "";
    if (/async\s*e\s*=>\s*e\s*\+\s*e/.test(html)) {
      scriptContent = html;
    }
  });

  const jsSolution = scriptContent.match(/await\s*\(\s*async\s*e\s*=>\s*e\s*\+\s*e\s*\)\(\s*["']([^"']+)["']\s*\)/);
  if (jsSolution) params.set("solution", jsSolution[1] + jsSolution[1]);
  params.set("js_challenge", "1");

  const submitResponse = await $fetch.raw(redditURL + "?" + params.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...redditHeaders
    }
  }).catch(() => null);

  const cookies = submitResponse?.headers?.get("set-cookie") || "";

  const jsonData = await $fetch(`${redditURL}/.json`, {
    headers: {
      Cookie: cookies,
      ...redditHeaders
    }
  }).catch(() => null);

  const { data } = jsonData?.find((item: any) => item?.data?.children?.[0]?.kind === "t3")?.data?.children?.[0];
  const crosspostData = data?.crosspost_parent_list?.[0];
  const buildVideoObject = async (videoData: any) => {
    if (videoData?.is_video || videoData?.url?.includes(".gif")) {
      let finalURL;
      if (videoData?.url?.includes(".gif")) {
        finalURL = videoData?.media?.reddit_video?.fallback_url;
      }
      else {
        const dash = videoData?.media?.reddit_video?.dash_url;
        const xmlString = await $fetch(dash, { responseType: "text" }).catch(() => null);
        if (!xmlString) return null;
        const xml = load(xmlString, { xmlMode: true });
        const dashAudio = xml("Representation").toArray().reduce((prev, curr) => {
          const bandwidth = parseInt(xml(curr).attr("bandwidth") || "0", 10);
          const mimeType = xml(curr).attr("mimeType") || "";
          if (mimeType !== "audio/mp4") return prev;
          return bandwidth > prev.bandwidth ? { bandwidth, url: xml(curr).find("BaseURL").text() } : prev;
        }, { bandwidth: 0, url: "" }).url;
        const fallback_audio = `${videoData?.url}/${dashAudio}`;
        const fallback_video = videoData?.media?.reddit_video?.fallback_url;
        // Use rapidsave.com to merge audio and video into a single URL
        finalURL = withQuery("https://sd.rapidsave.com/download.php", {
          permalink: `https://reddit.com${videoData?.permalink}`,
          video_url: fallback_video,
          audio_url: fallback_audio
        });
      }
      if (!finalURL) return null;
      return {
        width: videoData?.media?.reddit_video?.width,
        height: videoData?.media?.reddit_video?.height,
        duration: videoData?.media?.reddit_video?.duration ? videoData?.media.reddit_video.duration * 1000 : undefined,
        url: finalURL,
        type: videoData?.url?.includes(".gif") ? "gif" : videoData?.is_video ? "video" : undefined
      };
    }
  };
  const videoData = crosspostData || data;
  const buildedData = await buildVideoObject(videoData);
  const authorData = await $fetch(`${protocol}//${host}/user/${videoData?.author}/about.json`, {
    headers: {
      Cookie: cookies,
      ...redditHeaders
    }
  }).catch(() => null);

  return {
    id: data?.id,
    caption: data?.title?.trim(),
    permalink_url: `${protocol}//${host}${data?.permalink}`,
    thumbnail_url: data?.thumbnail?.replace(/&amp;/g, "&"),
    short_url: data?.url,
    author: {
      id: data?.author_fullname?.replace("t2_", ""),
      name: data?.author,
      username: data?.author,
      avatar_url: authorData?.data?.snoovatar_img,
      url: data?.author ? `https://www.reddit.com/user/${data?.author}/` : undefined
    },
    up_count: data?.ups,
    comment_count: data?.num_comments,
    created_at: data?.created_utc,
    ...buildedData && {
      video: buildedData as RedditMedia["video"]
    },
    ...videoData?.gallery_data?.items && {
      gallery: videoData?.gallery_data?.items?.map((item: any) => {
        const metaData = videoData?.media_metadata?.[item?.media_id];
        return {
          url: metaData?.s?.u.replace(/&amp;/g, "&"),
          width: metaData?.s?.x,
          height: metaData?.s?.y
        };
      })
    }
  };
};

interface RedditMedia {
  id: string;
  caption?: string;
  permalink_url: string;
  thumbnail_url: string;
  short_url?: string;
  author: GenericAuthorObject;
  up_count?: number;
  comment_count?: number;
  created_at?: number;
  video?: {
    width?: number;
    height?: number;
    duration?: number;
    url?: string;
    type?: "video" | "gif";
  };
  gallery?: {
    url: string;
    width: number;
    height: number;
  }[];
}