import {
    generateFacebookPost,
    generateYoutube,
    generateTikTok,
    generateSEO,
    generateThumbnail,
} from "./aiService";

export async function runFacebook(car) {
    return generateFacebookPost(car);
}

export async function runYoutube(car) {
    return generateYoutube(car);
}

export async function runTikTok(car) {
    return generateTikTok(car);
}

export async function runSEO(car) {
    return generateSEO(car);
}

export async function runThumbnail(car) {
    return generateThumbnail(car);
}