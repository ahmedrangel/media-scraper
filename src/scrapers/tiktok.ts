import { $fetch } from "ofetch";
import { tiktokRegex } from "../utils/regex";
import { mobileUserAgent, tiktokHeaders } from "../utils/helpers";
import type { GenericAuthorObject } from "../types";

export default async (url: string): Promise<TikTokMedia> => {
  const match = url.match(tiktokRegex);
  if (!match) throw new Error("Invalid TikTok URL");

  const tiktokFetch = await $fetch.raw(url, {
    headers: { ...tiktokHeaders }
  }).catch(() => null);

  const tt_id = tiktokFetch?.url?.match(/\/video\/(\d+)/)?.[1];

  const webappContext = await $fetch("https://www.tiktok.com/node-webapp/api/common-app-context", {
    query: { lang: "en" },
    headers: {
      ...tiktokHeaders
    }
  }).catch(() => null);

  const device_id = webappContext?.wid;

  let item;

  if (device_id && tt_id) {
    const known_iid = ["7318518857994389254"];
    const post = await $fetch("https://api22-normal-c-alisg.tiktokv.com/aweme/v1/feed/", {
      query: {
        region: "US",
        carrier_region: "US",
        aweme_id: tt_id,
        iid: known_iid[Math.floor(Math.random() * known_iid.length)],
        device_id,
        channel: "googleplay",
        app_name: "musical_ly",
        version_code: 350103,
        device_platform: "android",
        device_type: "ASUS_Z01QD",
        os_version: 14
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": mobileUserAgent
      }
    }).catch(() => null);
    item = post?.aweme_list?.find((item: any) => item?.aweme_id === tt_id);
  }

  let tikwm;

  if (!item) {
    tikwm = await $fetch("https://www.tikwm.com/api/", {
      query: { url }
    }).catch(() => null);
    tikwm = tikwm?.data;
    if (!tikwm) throw new Error("Failed to fetch TikTok data");
  }

  return {
    id: item?.aweme_id || tikwm?.id,
    caption: item?.desc?.trim() || tikwm?.title?.trim(),
    permalink_url: `https://www.tiktok.com/@${item?.author?.unique_id || tikwm?.author?.unique_id}/video/${item?.aweme_id || tikwm?.id}`,
    thumbnail_url: item?.video?.cover?.url_list.filter((url: string) => url.includes(".jpeg"))?.[0] || item?.video?.origin_cover?.url_list?.[0] || tikwm?.origin_cover,
    author: {
      id: item?.author?.uid || tikwm?.author?.id,
      name: item?.author?.nickname || tikwm?.author?.nickname,
      username: item?.author?.unique_id || tikwm?.author?.unique_id,
      avatar_url: item?.author?.avatar_medium?.url_list.filter((url: string) => url.includes(".jpeg"))?.[0] || item?.author?.avatar_thumb?.url_list?.[0] || tikwm?.author?.avatar,
      url: item?.author?.unique_id || tikwm?.author?.unique_id ? `https://www.tiktok.com/@${item?.author?.unique_id || tikwm?.author?.unique_id}/` : undefined
    },
    like_count: item?.statistics?.digg_count || tikwm?.digg_count,
    download_count: item?.statistics?.download_count || tikwm?.download_count,
    play_count: item?.statistics?.play_count || tikwm?.play_count,
    share_count: item?.statistics?.share_count || tikwm?.share_count,
    created_at: item?.create_time || tikwm?.create_time,
    video: {
      width: item?.video?.play_addr?.width,
      height: item?.video?.play_addr?.height,
      duration: item?.video?.duration || (tikwm?.duration ? tikwm?.duration * 1000 : undefined),
      url: item?.video.play_addr?.url_list?.[0] || tikwm?.play,
      watermark_url: item?.video?.download_addr?.url_list?.[0] || tikwm?.wmplay
    },
    music: {
      id: item?.music?.id || tikwm?.music_info?.id,
      title: item?.music?.title || tikwm?.music_info?.title,
      author: item?.music?.author || tikwm?.music_info?.author,
      album: item?.music?.album || tikwm?.music_info?.album,
      cover_url: item?.music?.cover_large?.url_list.filter((url: string) => url.includes(".jpeg"))?.[0] || item?.music?.cover_thumb?.url_list?.[0] || tikwm?.music_info?.cover,
      play_url: item?.music?.play_url?.url_list?.[0] || tikwm?.music,
      duration: item?.music?.duration || tikwm?.music_info?.duration
    }
  };
};

interface TikTokMedia {
  id: string;
  caption?: string;
  permalink_url: string;
  thumbnail_url: string;
  author: GenericAuthorObject;
  like_count?: number;
  download_count?: number;
  play_count?: number;
  share_count?: number;
  created_at?: number;
  video?: {
    width?: number;
    height?: number;
    duration?: number;
    url?: string;
    watermark_url?: string;
  };
  music?: {
    id: string;
    title: string;
    author: string;
    album?: string;
    cover_url?: string;
    play_url?: string;
    duration?: number;
  };
}
