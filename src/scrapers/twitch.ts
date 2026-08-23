import { $fetch } from "ofetch";
import { withQuery } from "ufo";
import { gqlQuery } from "gql-payload";
import { twitchRegex } from "../utils/regex";
import type { GenericAuthorObject } from "../types";
import { twitchHeaders } from "../utils/helpers";

export default async (url: string): Promise<TwitchMedia> => {
  const match = url.match(twitchRegex);
  if (!match) throw new Error("Invalid Twitch URL");

  const regexId = /\/([a-zA-Z0-9_-]+)(?:\.[a-zA-Z0-9]+)?(?:\?|$|\/\?|\/$)/;
  const matchId = url.match(regexId);
  if (!matchId) throw new Error("Invalid Twitch URL format");

  const clipId = matchId[1];

  const response = await $fetch("https://gql.twitch.tv/gql", {
    method: "POST",
    headers: twitchHeaders,
    body: gqlQuery({
      operation: "clip",
      variables: {
        slug: { value: clipId, type: "ID!" }
      },
      fields: [
        "id",
        "slug",
        "title",
        "viewCount",
        "url",
        "thumbnailURL",
        "durationSeconds",
        "createdAt",
        {
          operation: "curator",
          variables: {},
          fields: [
            "id",
            "displayName",
            "login",
            {
              operation: "profileImageURL",
              variables: { width: { value: 300, type: "Int!" } },
              fields: []
            }
          ]
        },
        {
          operation: "broadcaster",
          variables: {},
          fields: [
            "id",
            "displayName",
            "login",
            {
              operation: "profileImageURL",
              variables: { width: { value: 300, type: "Int!" } },
              fields: []
            }
          ]
        },
        {
          operation: "playbackAccessToken",
          variables: { params: { value: { platform: "twitch", playerType: "web" }, type: "PlaybackAccessTokenParams!" } },
          fields: ["signature", "value"]
        },
        { videoQualities: ["sourceURL", "quality"] }
      ]
    })
  }).catch(() => null);

  if (!response) throw new Error("Failed to fetch the Twitch URL");

  const clip = response?.data?.clip;
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
      return {
        url: withQuery(vid?.sourceURL, { sig, token }),
        quality: parseInt(vid.quality)
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