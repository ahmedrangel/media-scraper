import { $fetch } from "ofetch";
import { parseURL } from "ufo";
import { redditHeaders } from "../utils/helpers";
import type { GenericAuthorObject } from "../types";
import { redditRegex } from "../utils/regex";

export default async (url: string): Promise<RedditMedia> => {
  const match = url.match(redditRegex);
  if (!match) throw new Error("Invalid Reddit URL");
  const { protocol, host, pathname } = parseURL(url);
  const jsonData = await $fetch(`${protocol}//${host}${pathname}/.json`, {
    headers: redditHeaders
  }).catch(() => null);
  const { data } = jsonData.find((item: any) => item?.data?.children?.[0]?.kind === "t3")?.data?.children?.[0];
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
        const dashAudio = xmlString?.match(/<AdaptationSet[^>]+contentType="audio"[^>]*>[\s\S]+?<BaseURL>(.*?)<\/BaseURL>/)?.[1];
        const fallback_audio = `${videoData?.url}/${dashAudio}`;
        const fallback_video = videoData?.media?.reddit_video?.fallback_url;
        const merge = await $fetch("https://redvid.io/download-link", {
          query: {
            token: {
              video_url: fallback_video,
              audio_url: fallback_audio,
              id: data?.id
            }
          }
        }).catch(() => null);
        finalURL = merge?.url ? `https://redvid.io${merge?.url}` : null;
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
    headers: redditHeaders
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
      avatar_url: authorData?.data?.snoovatar_img
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