import {
  generateFacebookPost,
  generateYoutubeScript,
  generateYoutubePost,
  generateTikTokScript,
  generateTikTokPost,
  generateSEO,
  generateThumbnail,
} from "./aiService";

export async function generateAll(car) {
  const facebook = await generateFacebookPost(car);

  const tiktok = await generateTikTokScript(car);

  const youtube = await generateYoutubeScript(car);

  const seo = await generateSEO(car);

  const thumbnail = await generateThumbnail(car);

  return {
    facebook,
    tiktok,
    youtube,
    seo,
    thumbnail,
  };
}