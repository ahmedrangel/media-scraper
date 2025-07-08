import { $fetch } from "ofetch";
import { ClientTransaction } from "@lami/x-client-transaction-id";
import { parseHTML } from "linkedom";
import { load } from "cheerio";
import { twitterHeaders } from "../utils/helpers";
import { twitterRegex } from "../utils/regex";

export default async (url: string): Promise<XMedia> => {
  const match = url.match(twitterRegex);
  if (!match) throw new Error("Invalid X (Twitter) URL");

  const html = await $fetch("https://x.com", { headers: twitterHeaders, responseType: "text" }).catch(() => null);
  if (!html) throw new Error("Failed to fetch the X (Twitter) URL");
  const $ = load(html);
  const script_nonce = $("script[nonce]");
  const cookieRegex = /document\.cookie="([^"]+)";/g;
  const cookies = [];
  let cookieMatch;
  for (const script of script_nonce) {
    const content = $(script).html();
    if (content && content.includes("document.cookie")) {
      while ((cookieMatch = cookieRegex.exec(content)) !== null) {
        const [key, value] = cookieMatch[1].split(";")[0].trim()?.split("=");
        cookies.push({
          key: decodeURIComponent(key.trim()),
          value: decodeURIComponent(value.trim())
        });
      }
    }
  }
  const cookie = cookies.map(c => `${c.key}=${c.value}`).join("; ");
  const guestToken = cookies.find(c => c.key === "gt")?.value || "";
  const dom = parseHTML(html);
  const document = dom.window.document;
  const transaction = new ClientTransaction(document);
  await transaction.initialize();
  const graphqlPath = "/graphql/SAvsJgT-uo2NRaJBVX9-Hg/TweetResultByRestId";
  const transactionId = await transaction.generateTransactionId("GET", graphqlPath);
  const regexId = /status\/(\d+)(?:\/video\/(\d+))?/;
  const matchId = url.match(regexId);
  if (!matchId) throw new Error("Invalid X (Twitter) URL format");
  const id = matchId ? matchId[1] : null;
  if (!id) throw new Error("Tweet ID not found in the URL");
  const variables = { tweetId: id, withCommunity: false, includePromotedContent: false, withVoice: false };
  const features = { creator_subscriptions_tweet_preview_api_enabled: true, premium_content_api_read_enabled: false, communities_web_enable_tweet_community_results_fetch: true, c9s_tweet_anatomy_moderator_badge_enabled: true, responsive_web_grok_analyze_button_fetch_trends_enabled: false, responsive_web_grok_analyze_post_followups_enabled: false, responsive_web_jetfuel_frame: true, responsive_web_grok_share_attachment_enabled: true, articles_preview_enabled: true, responsive_web_edit_tweet_api_enabled: true, graphql_is_translatable_rweb_tweet_is_translatable_enabled: true, view_counts_everywhere_api_enabled: true, longform_notetweets_consumption_enabled: true, responsive_web_twitter_article_tweet_consumption_enabled: true, tweet_awards_web_tipping_enabled: false, responsive_web_grok_show_grok_translated_post: false, responsive_web_grok_analysis_button_from_backend: false, creator_subscriptions_quote_tweet_preview_enabled: false, freedom_of_speech_not_reach_fetch_enabled: true, standardized_nudges_misinfo: true, tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true, longform_notetweets_rich_text_read_enabled: true, longform_notetweets_inline_media_enabled: true, payments_enabled: false, profile_label_improvements_pcf_label_in_post_enabled: true, rweb_tipjar_consumption_enabled: true, verified_phone_label_enabled: false, responsive_web_grok_image_annotation_enabled: true, responsive_web_graphql_skip_user_profile_image_extensions_enabled: false, responsive_web_graphql_timeline_navigation_enabled: true, responsive_web_enhance_cards_enabled: false };
  const fieldToggles = { withArticleRichContentState: true, withArticlePlainText: false, withGrokAnalyze: false, withDisallowedReplyControls: false };
  const post = await $fetch(`https://api.x.com${graphqlPath}`, {
    query: { variables, features, fieldToggles },
    headers: {
      ...twitterHeaders,
      "Cookie": cookie,
      "Authorization": "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
      "X-Guest-Token": guestToken,
      "X-Client-Transaction-Id": transactionId
    }
  }).catch(() => null);
  if (!post) throw new Error("Failed to fetch the X (Twitter) URL");
  const data = post?.data?.tweetResult?.result;
  const quoted = data?.quoted_status_result?.result;

  const buildResponse = (data: any) => {
    const legacy = data?.legacy || data?.tweet?.legacy;
    const author = data?.core?.user_results?.result;
    return {
      id: data?.rest_id,
      caption: legacy?.full_text?.trim(),
      permalink_url: `https://x.com/${author?.core?.screen_name}/status/${data?.rest_id}`,
      author: {
        id: author?.rest_id,
        name: author?.core?.name,
        username: author?.core?.screen_name,
        avatar_url: author?.avatar?.image_url
      },
      reply_count: legacy?.reply_count,
      retweet_count: legacy?.retweet_count,
      favorite_count: legacy?.favorite_count,
      quote_count: legacy?.quote_count,
      media: legacy?.entities?.media?.map((item: any) => ({
        id: item?.id_str,
        type: item?.type,
        thumbnail_url: item?.media_url_https,
        width: item?.original_info?.width,
        height: item?.original_info?.height,
        url: item?.expanded_url,
        short_url: item?.url,
        ...item?.video_info?.duration_millis && { duration: item?.video_info?.duration_millis },
        ...item?.video_info?.variants && {
          video_versions: item?.video_info?.variants.map((vid: any) => {
            const sizeRegexMatch = vid?.url?.match(/\/(\d+)+x(\d+)\//);
            const width = sizeRegexMatch ? Number(sizeRegexMatch[1]) : undefined;
            const height = sizeRegexMatch ? Number(sizeRegexMatch[2]) : undefined;
            return {
              ...vid,
              ...width && { width },
              ...height && { height }
            };
          })
        }
      }))
    };
  };
  return {
    ...buildResponse(data),
    quoted: buildResponse(quoted)
  };
};

interface XMedia extends XMediaTweet {
  quoted?: XMediaTweet;
}

interface XMediaTweet {
  id: string;
  caption?: string;
  permalink_url: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar_url: string;
  };
  reply_count?: number;
  retweet_count?: number;
  favorite_count?: number;
  quote_count?: number;
  media?: {
    id: string;
    type: "photo" | "video" | "animated_gif";
    thumbnail_url: string;
    width?: number;
    height?: number;
    url?: string;
    short_url?: string;
    duration?: number;
    video_versions?: {
      url: string;
      bitrate?: number;
      content_type?: string;
      width?: number;
      height?: number;
    }[];
  }[];
}