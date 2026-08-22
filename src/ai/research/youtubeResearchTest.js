import {
    researchYouTubeQuery,
} from "./youtubeResearchService";

export async function runYouTubeResearchTest() {

    try {

        const result =
            await researchYouTubeQuery({

                query:
                    "Toyota Corolla Cross",

                maxResults:
                    5,

                order:
                    "relevance",

            });


        console.log(
            "================================"
        );

        console.log(
            "YOUTUBE RESEARCH TEST"
        );

        console.log(
            "================================"
        );


        console.table(

            result.map(
                item => ({

                    title:
                        item.title,

                    channel:
                        item.channelTitle,

                    views:
                        item.views,

                    likes:
                        item.likes,

                    comments:
                        item.comments,

                    subscribers:
                        item.subscribers,

                    duration:
                        item.durationSeconds,

                    published:
                        item.publishedAt,

                })
            )

        );


        return result;

    } catch (error) {

        console.error(
            "YouTube Research Test Error:",
            error
        );


        return [];

    }

}