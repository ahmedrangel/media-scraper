import { $fetch } from "ofetch";
import { instagramHeaders } from "../utils/helpers";
import { instagramRegex } from "../utils/regex";
import type { GenericAuthorObject } from "../types";

export default async (url: string): Promise<InstagramMedia> => {
  const match = url.match(instagramRegex);
  if (!match) throw new Error("Invalid Instagram URL");

  if (url.includes("/share")) {
    url = (await $fetch.raw(url, { method: "HEAD", headers: instagramHeaders }).catch(() => null))?.url || url;
  }

  const regexId = /instagram.com\/(?:[A-Za-z0-9_.]+\/)?(p|reels|reel|share)\/([A-Za-z0-9-_]+)/;
  const matchId = url.match(regexId);

  if (!matchId) throw new Error("Invalid Instagram URL format");

  const postId = matchId[2];
  const post = await $fetch("https://www.instagram.com/api/graphql", {
    method: "POST",
    query: {
      doc_id: "10015901848480474",
      lsd: "AVqbxe3J_YA",
      variables: { shortcode: postId }
    },
    headers: instagramHeaders,
    responseType: "json"
  }).catch(() => null);

  if (!post) throw new Error("Failed to fetch the Instagram URL");

  const data = post?.data?.xdt_shortcode_media;

  return {
    id: data?.id,
    code: data?.shortcode,
    caption: data?.edge_media_to_caption?.edges?.[0]?.node?.text?.trim(),
    permalink_url: `https://www.instagram.com/p/${data?.shortcode}/`,
    thumnail_url: data?.display_url || data?.thumbnail_src,
    author: {
      id: data?.owner?.id,
      name: data?.owner?.full_name,
      username: data?.owner?.username,
      avatar_url: data?.owner?.profile_pic_url,
      url: data?.owner?.username ? `https://www.instagram.com/${data?.owner?.username}/` : undefined
    },
    width: data?.dimensions?.width,
    height: data?.dimensions?.height,
    likes_count: data?.edge_media_preview_like?.count,
    type: data?.__typename === "XDTGraphSidecar" ? "carousel" : data?.__typename === "XDTGraphVideo" ? "video" : "image",
    created_at: data?.taken_at_timestamp,
    ...data?.video_url && {
      video: {
        duration: (data?.video_duration ? data?.video_duration * 1000 : undefined),
        url: data?.video_url
      }
    },
    carousel_media: data?.edge_sidecar_to_children?.edges?.map((item: any) => ({
      id: item?.node?.id,
      code: item?.node?.shortcode,
      thumbnail_url: item?.node?.display_url || item?.node?.thumbnail_src,
      width: item?.node?.dimensions?.width,
      height: item?.node?.dimensions?.height,
      type: item?.node?.__typename === "XDTGraphVideo" ? "video" : "image",
      ...item?.node?.video_url && {
        video: {
          duration: (item?.node?.video_duration ? item?.node?.video_duration * 1000 : undefined),
          url: item?.node?.video_url
        }
      }
    }))
  };
};

interface InstagramMedia {
  id: string;
  code?: string;
  caption?: string;
  permalink_url: string;
  thumnail_url: string;
  author: GenericAuthorObject;
  width?: number;
  height?: number;
  likes_count?: number;
  type?: "image" | "video" | "carousel";
  created_at?: number;
  video?: InstagramVideo;
  carousel_media?: {
    id: string;
    code?: string;
    thumbnail_url: string;
    width?: number;
    height?: number;
    type?: "image" | "video";
    video?: InstagramVideo;
  }[];
}

interface InstagramVideo {
  duration?: number;
  url?: string;
}