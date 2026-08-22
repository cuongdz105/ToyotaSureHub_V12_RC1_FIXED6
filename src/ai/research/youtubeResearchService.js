// ================================================
// ToyotaSureHub V11
// YouTube Research Service
// Version 1.0
//
// Nhiệm vụ:
// - Kết nối YouTube Data API v3
// - Tìm video ngắn theo từ khóa
// - Lấy thông tin video
// - Lấy statistics của video
// - Lấy subscriber của channel
//
// Chưa phân tích AI.
// Chưa chấm điểm.
// Chưa lưu Library.
//
// Đây là tầng COLLECTOR.
// ================================================


// ================================================
// CONFIG
// ================================================

const YOUTUBE_API_BASE =
    "https://www.googleapis.com/youtube/v3";

const YOUTUBE_API_KEY =
    import.meta.env.VITE_YOUTUBE_API_KEY;


// ================================================
// KIỂM TRA API KEY
// ================================================

function ensureApiKey() {

    if (!YOUTUBE_API_KEY) {

        throw new Error(
            "Thiếu VITE_YOUTUBE_API_KEY trong .env.local"
        );

    }

}


// ================================================
// HELPER: GỌI YOUTUBE API
// ================================================

async function youtubeRequest(
    endpoint,
    params = {}
) {

    ensureApiKey();


    const searchParams =
        new URLSearchParams({

            ...params,

            key:
                YOUTUBE_API_KEY,

        });


    const url =
        `${YOUTUBE_API_BASE}/${endpoint}?${searchParams.toString()}`;


    const response =
        await fetch(url);


    let data = null;


    try {

        data =
            await response.json();

    } catch {

        throw new Error(
            "YouTube API trả về dữ liệu không hợp lệ."
        );

    }


    if (!response.ok) {

        const message =
            data?.error?.message ||
            `YouTube API lỗi HTTP ${response.status}`;


        throw new Error(message);

    }


    return data;

}


// ================================================
// TÌM VIDEO
// ================================================
//
// Ví dụ:
//
// searchYouTubeVideos({
//     query: "Toyota Corolla Cross",
//     maxResults: 10
// })
//
// ================================================

export async function searchYouTubeVideos({

    query,

    maxResults = 10,

    publishedAfter = null,

    publishedBefore = null,

    order = "relevance",

    regionCode = "VN",

    relevanceLanguage = "vi",

} = {}) {


    if (!query) {

        throw new Error(
            "searchYouTubeVideos cần có query."
        );

    }


    const params = {

        part:
            "snippet",

        q:
            query,

        type:
            "video",

        videoDuration:
            "short",

        maxResults:
            Math.min(
                Math.max(maxResults, 1),
                50
            ),

        order,

        regionCode,

        relevanceLanguage,

    };


    if (publishedAfter) {

        params.publishedAfter =
            new Date(
                publishedAfter
            ).toISOString();

    }


    if (publishedBefore) {

        params.publishedBefore =
            new Date(
                publishedBefore
            ).toISOString();

    }


    const data =
        await youtubeRequest(
            "search",
            params
        );


    return {

        items:
            data.items || [],

        nextPageToken:
            data.nextPageToken || null,

        totalResults:
            data.pageInfo?.totalResults || 0,

    };

}


// ================================================
// LẤY THÔNG TIN CHI TIẾT VIDEO
// ================================================
//
// Lấy:
//
// - title
// - description
// - channelId
// - publishedAt
// - duration
// - views
// - likes
// - comments
//
// ================================================

export async function getYouTubeVideos(
    videoIds = []
) {

    if (
        !Array.isArray(videoIds) ||
        videoIds.length === 0
    ) {

        return [];

    }


    const cleanIds =
        videoIds
            .filter(Boolean)
            .slice(0, 50);


    const data =
        await youtubeRequest(
            "videos",
            {

                part:
                    "snippet,contentDetails,statistics",

                id:
                    cleanIds.join(","),

            }
        );


    return data.items || [];

}


// ================================================
// LẤY THÔNG TIN CHANNEL
// ================================================
//
// Lấy:
//
// - channel title
// - subscriberCount
// - videoCount
// - viewCount
//
// ================================================

export async function getYouTubeChannels(
    channelIds = []
) {

    if (
        !Array.isArray(channelIds) ||
        channelIds.length === 0
    ) {

        return [];

    }


    const cleanIds =
        [
            ...new Set(
                channelIds
                    .filter(Boolean)
            )
        ]
        .slice(0, 50);


    if (cleanIds.length === 0) {

        return [];

    }


    const data =
        await youtubeRequest(
            "channels",
            {

                part:
                    "snippet,statistics",

                id:
                    cleanIds.join(","),

            }
        );


    return data.items || [];

}


// ================================================
// ISO 8601 DURATION → GIÂY
// ================================================
//
// Ví dụ:
//
// PT45S
// → 45
//
// PT1M20S
// → 80
//
// PT2H5M10S
// → 7510
//
// ================================================

export function parseYouTubeDuration(
    duration
) {

    if (!duration) {

        return 0;

    }


    const match =
        duration.match(
            /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
        );


    if (!match) {

        return 0;

    }


    const hours =
        Number(
            match[1] || 0
        );


    const minutes =
        Number(
            match[2] || 0
        );


    const seconds =
        Number(
            match[3] || 0
        );


    return (
        hours * 3600 +
        minutes * 60 +
        seconds
    );

}


// ================================================
// CHUẨN HÓA VIDEO
// ================================================
//
// Đây là format trung gian mà các module sau
// sẽ dùng.
//
// Không chấm điểm ở đây.
// ================================================

export function normalizeYouTubeVideo(
    video,
    channel = null
) {

    const durationSeconds =
        parseYouTubeDuration(
            video?.contentDetails?.duration
        );


    const statistics =
        video?.statistics || {};


    const snippet =
        video?.snippet || {};


    return {

        source:
            "youtube",

        sourceType:
            "youtube-short-candidate",


        videoId:
            video?.id || "",


        url:
            video?.id
                ? `https://www.youtube.com/watch?v=${video.id}`
                : "",


        title:
            snippet.title || "",


        description:
            snippet.description || "",


        channelId:
            snippet.channelId ||
            channel?.id ||
            "",


        channelTitle:
            snippet.channelTitle ||
            channel?.snippet?.title ||
            "",


        publishedAt:
            snippet.publishedAt || null,


        collectedAt:
            new Date().toISOString(),


        durationSeconds,


        views:
            Number(
                statistics.viewCount || 0
            ),


        likes:
            Number(
                statistics.likeCount || 0
            ),


        comments:
            Number(
                statistics.commentCount || 0
            ),


        subscribers:
            Number(
                channel?.statistics?.subscriberCount || 0
            ),


        channelViews:
            Number(
                channel?.statistics?.viewCount || 0
            ),


        channelVideoCount:
            Number(
                channel?.statistics?.videoCount || 0
            ),


        thumbnail:
            snippet.thumbnails?.high?.url ||
            snippet.thumbnails?.medium?.url ||
            snippet.thumbnails?.default?.url ||
            "",

    };

}


// ================================================
// RESEARCH MỘT QUERY
// ================================================
//
// Đây là hàm tiện lợi:
//
// query
// ↓
// search
// ↓
// lấy video details
// ↓
// lấy channel details
// ↓
// normalize
//
// Kết quả trả về là dữ liệu sạch.
//
// ================================================

export async function researchYouTubeQuery({

    query,

    maxResults = 10,

    publishedAfter = null,

    publishedBefore = null,

    order = "relevance",

    regionCode = "VN",

    relevanceLanguage = "vi",

} = {}) {


    const searchResult =
        await searchYouTubeVideos({

            query,

            maxResults,

            publishedAfter,

            publishedBefore,

            order,

            regionCode,

            relevanceLanguage,

        });


    const videoIds =
        searchResult.items
            .map(
                item =>
                    item?.id?.videoId
            )
            .filter(Boolean);


    if (videoIds.length === 0) {

        return [];

    }


    const videos =
        await getYouTubeVideos(
            videoIds
        );


    const channelIds =
        [
            ...new Set(
                videos
                    .map(
                        video =>
                            video?.snippet?.channelId
                    )
                    .filter(Boolean)
            )
        ];


    const channels =
        await getYouTubeChannels(
            channelIds
        );


    const channelMap =
        new Map();


    channels.forEach(
        channel => {

            channelMap.set(
                channel.id,
                channel
            );

        }
    );


    const normalized =
        videos.map(
            video => {

                const channel =
                    channelMap.get(
                        video?.snippet?.channelId
                    );


                return normalizeYouTubeVideo(
                    video,
                    channel
                );

            }
        );


    return normalized;

}


// ================================================
// TEST CONNECTION
// ================================================
//
// Dùng để kiểm tra:
//
// - API key đúng
// - YouTube API hoạt động
// - Project đã Enable API
//
// Ví dụ:
//
// const result =
//     await testYouTubeConnection();
//
// console.log(result);
//
// ================================================

export async function testYouTubeConnection() {

    try {

        const result =
            await searchYouTubeVideos({

                query:
                    "Toyota",

                maxResults:
                    3,

                order:
                    "date",

            });


        return {

            success:
                true,

            count:
                result.items.length,

            message:
                "Kết nối YouTube Data API thành công.",

            data:
                result.items,

        };

    } catch (error) {

        console.error(
            "YouTube API connection error:",
            error
        );


        return {

            success:
                false,

            count:
                0,

            message:
                error?.message ||
                "Không kết nối được YouTube Data API.",

            data:
                [],

        };

    }

}


// ================================================
// DEFAULT EXPORT
// ================================================

export default {

    searchYouTubeVideos,

    getYouTubeVideos,

    getYouTubeChannels,

    parseYouTubeDuration,

    normalizeYouTubeVideo,

    researchYouTubeQuery,

    testYouTubeConnection,

};