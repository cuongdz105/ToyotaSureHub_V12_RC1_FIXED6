import {

    generateFacebookPost,

    generateYoutube,

    generateTikTok,

    generateSEO,

    generateThumbnail

} from "../services/aiService";

export const AI_REGISTRY = {

    facebook:{

        title:"📱 Facebook",

        action:generateFacebookPost

    },

    youtube:{

        title:"🎥 YouTube",

        action:generateYoutube

    },

    tiktok:{

        title:"🎬 TikTok",

        action:generateTikTok

    },

    seo:{

        title:"📰 SEO",

        action:generateSEO

    },

    thumbnail:{

        title:"🖼 Thumbnail",

        action:generateThumbnail

    }

};