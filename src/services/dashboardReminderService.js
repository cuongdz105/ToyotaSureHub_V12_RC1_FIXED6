import { loadCampaigns } from "./facebookCampaignService";
import { loadPostingQueue } from "./facebookPostingQueueService";

function getCampaignJobs(campaignId, queue) {
    return queue.filter(
        (job) =>
            String(job.campaignId || "") ===
            String(campaignId)
    );
}

function getCampaignProgress(campaign, queue) {
    const jobs = getCampaignJobs(
        campaign.id,
        queue
    );

    const total =
        jobs.length ||
        Number(campaign.totalJobs || 0);

    const success =
        jobs.filter(
            (job) =>
                job.status === "success"
        ).length;

    const failed =
        jobs.filter(
            (job) =>
                job.status === "failed"
        ).length;

    const completed =
        success + failed;

    return {
        total,
        success,
        failed,
        completed,
        remaining: Math.max(
            total - completed,
            0
        ),
    };
}

export function getTodayWorkItems() {
    const campaigns = loadCampaigns();
    const queue = loadPostingQueue();

    return campaigns
        .map((campaign) => {
            const progress =
                getCampaignProgress(
                    campaign,
                    queue
                );

            return {
                ...campaign,
                progress,
            };
        })
        .filter((campaign) => {
            // Campaign đã hoàn thành hoàn toàn
            if (
                campaign.status ===
                "completed"
            ) {
                return false;
            }

            // Nếu Queue đã xác nhận tất cả Job thành công
            if (
                campaign.progress.total > 0 &&
                campaign.progress.remaining === 0
            ) {
                return false;
            }

            // Campaign đang chờ / đang chạy
            return [
                "draft",
                "queued",
                "running",
                "paused",
            ].includes(
                campaign.status
            );
        })
        .sort((a, b) => {
            const aTime = new Date(
                a.createdAt || 0
            ).getTime();

            const bTime = new Date(
                b.createdAt || 0
            ).getTime();

            return aTime - bTime;
        });
}