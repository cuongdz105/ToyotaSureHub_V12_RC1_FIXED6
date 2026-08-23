import {
  generateFacebookPost,
  generateYoutube,
  generateTikTok,
  generateSEO,
  generateThumbnail,
} from "./aiService";

export async function generateAll(car) {
  const facebook = await generateFacebookPost(car);

  const tiktok = await generateTikTok(car);

  const youtube = await generateYoutube(car);

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