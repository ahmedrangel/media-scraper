import { $fetch } from "ofetch";
import { load } from "cheerio";
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
  const mediaURL = `https://www.instagram.com/p/${postId}/`;
  const post = await $fetch(mediaURL, { headers: instagramHeaders }).catch(() => null);
  if (!post) throw new Error("Failed to fetch the Instagram URL");
  const $ = load(post);
  const scripts = $("script[type='application/json']");
  const mustInclude = ["RelayPrefetchedStreamCache", "\"code\""];

  let data;

  for (const script of scripts) {
    const content = $(script).html();
    if (content && mustInclude.every(term => content.includes(term))) {
      const parsed = JSON.parse(content)?.require?.[0]?.[3]?.[0]?.__bbox?.require?.find(([key]: string) => mustInclude.includes(key))?.[3]?.[1]?.__bbox?.result?.data?.xig_polaris_media?.if_not_gated_logged_out;
      data = parsed;
    }
  }

  if (!data) throw new Error("Failed to extract media data from Instagram");

  return {
    id: data?.pk,
    code: data?.code,
    caption: data?.caption?.text?.trim(),
    permalink_url: `https://www.instagram.com/p/${data?.code}/`,
    thumbnail_url: data?.display_uri,
    author: {
      id: data?.user?.pk,
      name: data?.user?.full_name,
      username: data?.user?.username,
      avatar_url: data?.user?.profile_pic_url,
      url: data?.user?.username ? `https://www.instagram.com/${data?.user?.username}/` : undefined
    },
    width: data?.original_width,
    height: data?.original_height,
    likes_count: data?.like_count,
    type: data?.__typename === "XIGPolarisCarouselMedia" ? "carousel" : data?.__typename === "XIGPolarisVideoMedia" ? "video" : "image",
    created_at: data?.taken_at,
    image_versions: data?.image_versions2?.candidates?.map((img: any) => ({
      width: img?.width,
      height: img?.height,
      url: img?.url
    })),
    video_versions: data?.video_versions,
    carousel_media: data?.carousel_media?.map((item: any) => ({
      id: item?.pk,
      type: item?.__typename === "XIGPolarisVideoMedia" ? "video" : "image",
      image_versions: item?.image_versions2?.candidates?.map((img: any) => ({
        width: img?.width,
        height: img?.height,
        url: img?.url
      })),
      video_versions: item?.video_versions?.map((vid: any) => ({
        type: vid?.type,
        url: vid?.url
      }))
    }))
  };
};

interface InstagramMedia {
  id: string;
  code?: string;
  caption?: string;
  permalink_url: string;
  thumbnail_url: string;
  author: GenericAuthorObject;
  width?: number;
  height?: number;
  likes_count?: number;
  type?: "image" | "video" | "carousel";
  created_at?: number;
  image_versions?: InstagramImageVersion[];
  video_versions?: InstagramVideoVersion[];
  carousel_media?: {
    id: string;
    type?: "image" | "video";
    image_versions?: InstagramImageVersion[];
    video_versions?: InstagramVideoVersion[];
  }[];
}

interface InstagramImageVersion {
  width?: number;
  height?: number;
  url: string;
}

interface InstagramVideoVersion {
  type: number;
  url: string;
}