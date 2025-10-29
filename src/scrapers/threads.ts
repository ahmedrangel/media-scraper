import { $fetch } from "ofetch";
import { load } from "cheerio";
import { threadsHeaders } from "../utils/helpers";
import type { GenericAuthorObject } from "../types";

export default async (url: string): Promise<ThreadsMedia> => {
  const regex = /\/@([^/]+)\/post\/([^/?]+)/;
  const match = url.match(regex);
  const username = match?.[1];
  const post_id = match?.[2];

  if (!username || !post_id) throw new Error("Invalid Threads URL");

  const mediaURL = `https://www.threads.com/@${username}/post/${post_id}/media`;
  const post = await $fetch(mediaURL, { headers: threadsHeaders }).catch(() => null);
  if (!post) throw new Error("Failed to fetch the Threads URL");

  const $ = load(post);
  const scripts = $("script[type='application/json']");
  const mustInclude = ["RelayPrefetchedStreamCache", "\"video_versions\""];
  const mustNotInclude = ["relatedPosts"];

  let pk = "";
  let tId = "";
  let data;

  for (const script of scripts) {
    const content = $(script).html();
    if (content && mustInclude.every(term => content.includes(term)) && mustNotInclude.every(term => !content.includes(term))) {
      const parsed = JSON.parse(content)?.require?.[0]?.[3]?.[0]?.__bbox?.require?.[0]?.[3]?.[1]?.__bbox?.result?.data?.data;
      if (pk && tId) {
        data = parsed?.edges?.find((edge: any) => edge.node?.id === pk)?.node.thread_items.find((item: any) => item?.post?.id === tId)?.post;
        break;
      }
      pk = parsed?.pk;
      tId = parsed?.id;
    }
  }

  return {
    id: data.id,
    pk: data.pk,
    code: data.code,
    caption: data?.caption?.text?.trim(),
    permalink_url: `https://www.threads.com/@${data?.user?.username}/post/${data.code}/`,
    author: {
      id: data?.user?.id,
      name: data?.user?.full_name,
      username: data?.user?.username,
      avatar_url: data?.user?.profile_pic_url,
      url: data?.user?.username ? `https://www.threads.com/@${data?.user?.username}/` : undefined
    },
    likes_count: data?.like_count,
    created_at: data?.taken_at,
    image_versions: data?.image_versions2?.candidates?.map((img: any) => ({
      width: img?.width,
      height: img?.height,
      url: img?.url
    })),
    video_versions: data?.video_versions,
    carousel_media: data?.carousel_media?.map((item: any) => ({
      id: item?.id,
      pk: item?.pk,
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

interface ThreadsMedia {
  id: string;
  pk: string;
  code: string;
  caption?: string;
  permalink_url: string;
  author: GenericAuthorObject;
  likes_count?: number;
  created_at?: number;
  image_versions?: ThreadsImageVersion[];
  video_versions?: ThreadsVideoVersion[];
  carousel_media?: {
    id: string;
    image_versions?: ThreadsImageVersion[];
    video_versions?: ThreadsVideoVersion[];
  }[];
}

interface ThreadsImageVersion {
  width: number;
  height: number;
  url: string;
}

interface ThreadsVideoVersion {
  type: number;
  url: string;
}