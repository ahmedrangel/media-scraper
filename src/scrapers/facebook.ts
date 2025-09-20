import { $fetch } from "ofetch";
import { load } from "cheerio";
import { facebookHeaders } from "../utils/helpers";
import { facebookRegex } from "../utils/regex";

export default async (url: string): Promise<FacebookMedia> => {
  const match = url.match(facebookRegex);
  if (!match) throw new Error("Invalid Facebook URL");

  const post = await $fetch(url, { headers: facebookHeaders }).catch(() => null);
  if (!post) throw new Error("Failed to fetch the Facebook URL");
  const $ = load(post);
  const scripts = $("script[type='application/json']");
  const metaDescription = $("meta[name='description']")?.attr("content");

  const mustInclude = ["RelayPrefetchedStreamCache", "videoDeliveryLegacyFields"];
  const mustNotInclude = ["CometUFI"];

  let data;

  for (const script of scripts) {
    const content = $(script).html();
    if (content && mustInclude.every(term => content.includes(term) && !mustNotInclude.some(term => content.includes(term)))) {
      const json = JSON.parse(content);
      data = json?.require?.[0]?.[3]?.[0]?.__bbox?.require?.find((item: Record<string, any>) => item?.includes("RelayPrefetchedStreamCache"))?.[3]?.[1]?.__bbox?.result?.data;
    }
  }

  const video = data?.video;
  const caption = video?.creation_story?.message?.text || metaDescription;
  const attachment = video?.story?.attachments?.find((item: Record<string, any>) => item?.media?.id === video?.id) || video?.creation_story?.attachments?.[0];
  const media = attachment?.media?.width && attachment?.media?.height ? attachment?.media : video?.creation_story?.short_form_video_context?.playback_video;
  const { width, height } = media || {};
  const duration = media?.playable_duration_in_ms || (media?.length_in_second ? media.length_in_second * 1000 : undefined);
  const thumbnail_url = media?.thumbnailImage?.uri || media?.preferred_thumbnail?.image?.uri;
  const playback_video = media?.videoDeliveryLegacyFields;

  return {
    id: video.id,
    caption: caption?.trim(),
    permalink_url: media?.permalink_url || media?.url,
    thumbnail_url,
    width,
    height,
    created_at: media?.publish_time || video?.creation_story?.creation_time,
    video: {
      duration,
      sd_url: playback_video?.browser_native_sd_url,
      hd_url: playback_video?.browser_native_hd_url
    }
  };
};

interface FacebookMedia {
  id: string;
  caption?: string;
  permalink_url: string;
  thumbnail_url: string;
  width?: number;
  height?: number;
  created_at?: number;
  video: {
    duration?: number;
    sd_url?: string;
    hd_url?: string;
  };
}