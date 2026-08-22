import facebookWisdom from "./knowledge/wisdom/facebook.md?raw";
import writingWisdom from "./knowledge/wisdom/writing.md?raw";

import facebookGuide from "./knowledge/social/facebook.md?raw";
import youtubeGuide from "./knowledge/social/youtube.md?raw";
import tiktokGuide from "./knowledge/social/tiktok.md?raw";
import seoGuide from "./knowledge/social/seo.md?raw";

import corollaCross from "./knowledge/cars/corollaCross.md?raw";
import fortuner from "./knowledge/cars/fortuner.md?raw";
import camry from "./knowledge/cars/camry.md?raw";
import vios from "./knowledge/cars/vios.md?raw";
import yaris from "./knowledge/cars/yaris.md?raw";
import veloz from "./knowledge/cars/veloz.md?raw";
import avanza from "./knowledge/cars/avanza.md?raw";
import innova from "./knowledge/cars/innova.md?raw";
import raize from "./knowledge/cars/raize.md?raw";
import landcruiser from "./knowledge/cars/landcruiser.md?raw";
import corollaAltis from "./knowledge/cars/corollaAltis.md?raw";

const PLATFORM = {
    facebook: facebookGuide,
    youtube: youtubeGuide,
    tiktok: tiktokGuide,
    seo: seoGuide,
};

const CARS = {
    corollacross: corollaCross,
    fortuner,
    camry,
    vios,
    yaris,
    veloz,
    avanza,
    innova,
    raize,
    landcruiser,
    corollaaltis: corollaAltis,
};

export function loadKnowledge(car, platform = "facebook") {

    const result = [];

    // Wisdom luôn được đọc
    result.push(facebookWisdom);
    result.push(writingWisdom);

    // Platform
    result.push(
        PLATFORM[platform.toLowerCase()] || facebookGuide
    );

    // Xe
    const key = car.model
        .toLowerCase()
        .replace(/\s/g, "");

    if (CARS[key]) {
        result.push(CARS[key]);
    }

    return result.join("\n\n");
}