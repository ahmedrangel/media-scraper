import { $fetch } from "ofetch";
import { withQuery } from "ufo";
import { twitchRegex } from "../utils/regex";
import type { GenericAuthorObject } from "../types";

export default async (url: string): Promise<TwitchMedia> => {
  const match = url.match(twitchRegex);
  if (!match) throw new Error("Invalid Twitch URL");

  const regexId = /\/([a-zA-Z0-9_-]+)(?:\.[a-zA-Z0-9]+)?(?:\?|$|\/\?|\/$)/;
  const matchId = url.match(regexId);
  if (!matchId) throw new Error("Invalid Twitch URL format");

  const clipId = matchId[1];

  const response = await $fetch("https://gql.twitch.tv/gql", {
    method: "POST",
    headers: {
      "Client-Id": "kimne78kx3ncx6brgo4mv6wki5h1ko",
      "Content-Type": "application/json"
    },
    body: [
      {
        operationName: "ShareClipRenderStatus",
        variables: { slug: clipId },
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash: "f130048a462a0ac86bb54d653c968c514e9ab9ca94db52368c1179e97b0f16eb"
          }
        }
      }
    ]
  }).catch(() => null);

  if (!response) throw new Error("Failed to fetch the Twitch URL");

  const data = response?.[0];
  const clip = data?.data?.clip;

  const sig = clip?.playbackAccessToken?.signature;
  const token = clip?.playbackAccessToken?.value;

  return {
    id: clip?.id,
    slug: clip?.slug,
    title: clip?.title?.trim(),
    caption: clip?.title?.trim(),
    view_count: clip?.viewCount,
    permalink_url: clip?.url,
    thumbnail_url: clip?.thumbnailURL,
    duration: (clip?.durationSeconds ? clip?.durationSeconds * 1000 : undefined),
    created_at: new Date(clip?.createdAt).getTime() / 1000,
    author: {
      id: clip?.curator?.id,
      name: clip?.curator?.displayName,
      username: clip?.curator?.login,
      avatar_url: clip?.curator?.profileImageURL,
      url: clip?.curator?.login ? `https://www.twitch.tv/${clip?.curator?.login}/` : undefined
    },
    broadcaster: {
      id: clip?.broadcaster?.id,
      name: clip?.broadcaster?.displayName,
      username: clip?.broadcaster?.login,
      avatar_url: clip?.broadcaster?.profileImageURL,
      url: clip?.broadcaster?.login ? `https://www.twitch.tv/${clip?.broadcaster?.login}/` : undefined
    },
    video_versions: clip?.videoQualities?.map((vid: any) => {
      const qualityRegexMatch = vid?.sourceURL?.match(/-(\d+)\.mp4/);
      const quality = qualityRegexMatch ? Number(qualityRegexMatch[1]) : undefined;
      return {
        url: withQuery(vid?.sourceURL, { sig, token }),
        quality
      };
    })
  };
};

interface TwitchMedia {
  id: string;
  slug: string;
  title?: string;
  caption?: string;
  view_count: number;
  permalink_url: string;
  thumbnail_url: string;
  duration?: number;
  created_at: number;
  author: GenericAuthorObject;
  broadcaster: GenericAuthorObject;
  video_versions: {
    url: string;
    quality?: number;
  }[];
}