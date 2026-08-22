import {
    loadPostingQueue,
    updateQueueJob,
    addQueueLog,
} from "./facebookPostingQueueService";

import {
    runFacebookPostingEngine,
} from "./facebookPostingEngine";

import {
    loadAccounts,
} from "./facebookAccountService";

import {
    getRateControllerConfig,
} from "./facebookRateControllerService";

/**
 * =======================================
 * FACEBOOK POSTING WORKER
 * =======================================
 *
 * Nhiệm vụ:
 *
 * - Đọc Facebook Posting Queue
 * - Kiểm tra Account
 * - Kiểm tra quyền Account -> Group
 * - Chuyển Job sang PROCESSING
 * - Gọi Facebook Posting Engine
 * - Ghi Log
 * - Cập nhật SUCCESS / FAILED
 * - Retry Job lỗi
 * - Xử lý Queue tuần tự
 * - Rate Controller điều phối tốc độ
 *
 * Posting Engine hiện tại:
 *
 * SIMULATION MODE
 *
 * Chưa đăng Facebook thật.
 */


/**
 * =======================================
 * CẤU HÌNH RETRY
 * =======================================
 *
 * Mỗi Job được phép retry tối đa 2 lần.
 *
 * Ví dụ:
 *
 * Lần đầu
 *   ↓
 * ❌ lỗi
 *   ↓
 * Retry 1/2
 *
 *   ↓
 * ❌ lỗi
 *   ↓
 * Retry 2/2
 *
 *   ↓
 * ❌ lỗi tiếp
 *   ↓
 * FAILED
 */

const MAX_RETRIES = 2;


/**
 * =======================================
 * TÌM FACEBOOK ACCOUNT
 * =======================================
 */

function findAccount(accountId) {

    const accounts =
        loadAccounts();

    return (
        accounts.find(
            (account) =>
                String(
                    account.id
                ) ===
                String(
                    accountId
                )
        ) || null
    );
}


/**
 * =======================================
 * KIỂM TRA ACCOUNT CÓ ĐƯỢC PHÉP GROUP
 * =======================================
 */

function isAccountAllowedForGroup(
    account,
    group
) {

    if (
        !account ||
        !group
    ) {

        return false;
    }


    /**
     * Account bắt buộc phải active.
     */

    if (
        account.status !==
        "active"
    ) {

        return false;
    }


    const groupId =
        String(
            group.id
        );


    /**
     * ===================================
     * MODE 1
     *
     * Account được phép tất cả Group
     * trừ những Group bị loại.
     * ===================================
     */

    if (
        account.allowAllGroups !==
        false
    ) {

        const excludedGroupIds =
            Array.isArray(
                account.excludedGroupIds
            )
                ? account.excludedGroupIds
                : [];


        return !excludedGroupIds.some(
            (id) =>
                String(id) ===
                groupId
        );
    }


    /**
     * ===================================
     * MODE 2
     *
     * Account chỉ được phép các Group
     * được chọn.
     * ===================================
     */

    const allowedGroupIds =
        Array.isArray(
            account.allowedGroupIds
        )
            ? account.allowedGroupIds
            : [];


    return allowedGroupIds.some(
        (id) =>
            String(id) ===
            groupId
    );
}


/**
 * =======================================
 * VALIDATE ACCOUNT + GROUP
 * =======================================
 */

function validateJobAccountAndGroup(
    job
) {

    if (
        !job?.accountId
    ) {

        throw new Error(
            "Job chưa có tài khoản Facebook."
        );
    }


    if (
        !job?.group?.id
    ) {

        throw new Error(
            "Job chưa có ID hội nhóm Facebook."
        );
    }


    const account =
        findAccount(
            job.accountId
        );


    /**
     * Account không tồn tại
     */

    if (!account) {

        throw new Error(
            `Không tìm thấy tài khoản Facebook ID ${job.accountId}.`
        );
    }


    /**
     * Account không active
     */

    if (
        account.status !==
        "active"
    ) {

        throw new Error(
            `Tài khoản "${account.name}" hiện không hoạt động.`
        );
    }


    /**
     * Account không có quyền Group
     */

    if (
        !isAccountAllowedForGroup(
            account,
            job.group
        )
    ) {

        throw new Error(
            `Tài khoản "${account.name}" không được phép đăng vào nhóm "${job.group.name || "Không rõ"}".`
        );
    }


    return account;
}


/**
 * =======================================
 * RETRY HELPERS
 * =======================================
 */

function getRetryCount(
    job
) {

    const value =
        Number(
            job?.retryCount
        );


    if (
        Number.isFinite(
            value
        ) &&
        value >= 0
    ) {

        return value;
    }


    return 0;
}


function canRetry(
    job
) {

    return (
        getRetryCount(job) <
        MAX_RETRIES
    );
}


function getNextRetryCount(
    job
) {

    return (
        getRetryCount(job) +
        1
    );
}


/**
 * =======================================
 * XỬ LÝ 1 FACEBOOK JOB
 * =======================================
 */

export async function processFacebookJob(
    jobId
) {

    console.log(
        "================================="
    );


    console.log(
        "🚀 BẮT ĐẦU FACEBOOK WORKER"
    );


    console.log(
        "Job ID:",
        jobId
    );


    /**
     * ===================================
     * 1. Đọc Queue
     * ===================================
     */

    const queue =
        loadPostingQueue();


    const job =
        queue.find(
            (item) =>
                item.id ===
                jobId
        );


    if (!job) {

        throw new Error(
            "Không tìm thấy bài đăng trong Queue."
        );
    }


    console.log(
        "📦 Job:",
        job
    );


    /**
     * ===================================
     * 2. Kiểm tra trạng thái
     * ===================================
     */

    if (
        job.status !==
        "waiting"
    ) {

        throw new Error(
            `Job hiện đang ở trạng thái "${job.status}".`
        );
    }


    addQueueLog(
        jobId,
        "🚀 Bắt đầu xử lý bài đăng"
    );


    /**
     * ===================================
     * 3. Kiểm tra ACCOUNT + GROUP
     * ===================================
     */

    let account;


    try {

        account =
            validateJobAccountAndGroup(
                job
            );


        addQueueLog(
            jobId,
            `👤 Account hợp lệ: ${account.name}`
        );


        addQueueLog(
            jobId,
            `👥 Account được phép đăng vào nhóm: ${job.group.name || "Không rõ"}`
        );

    } catch (error) {

        const message =
            error?.message ||
            "Kiểm tra Account/Group thất bại.";


        addQueueLog(
            jobId,
            `🛑 Không thể chạy Job: ${message}`
        );


        updateQueueJob(
            jobId,
            {

                status:
                    "failed",

                error:
                    message,

                result: {

                    mode:
                        "validation",

                    published:
                        false,

                    failedAt:
                        new Date().toISOString(),
                },
            }
        );


        throw error;
    }


    /**
     * ===================================
     * 4. PROCESSING
     * ===================================
     */

    updateQueueJob(
        jobId,
        {

            status:
                "processing",

            error:
                null,
        }
    );


    addQueueLog(
        jobId,
        "🔵 Chuyển trạng thái sang PROCESSING"
    );


    try {

        /**
         * ===============================
         * 5. Gọi Posting Engine
         * ===============================
         */

        console.log(
            "🚀 Gọi Facebook Posting Engine..."
        );


        addQueueLog(
            jobId,
            "🚀 Gọi Facebook Posting Engine"
        );


        const result =
            await runFacebookPostingEngine(
                job
            );


        console.log(
            "📦 Posting Engine Result:",
            result
        );


        /**
         * ===============================
         * 6. Ghi Log từ Engine
         * ===============================
         */

        if (
            Array.isArray(
                result?.logs
            )
        ) {

            for (
                const log of result.logs
            ) {

                if (
                    !log?.message
                ) {

                    continue;
                }


                addQueueLog(
                    jobId,
                    log.message
                );
            }
        }


        /**
         * ===============================
         * 7. Kiểm tra kết quả
         * ===============================
         */

        if (
            !result?.success
        ) {

            throw new Error(
                "Posting Engine không trả về kết quả thành công."
            );
        }


        /**
         * ===============================
         * 8. SUCCESS
         * ===============================
         */

        const finalResult =
            updateQueueJob(
                jobId,
                {

                    status:
                        "success",

                    error:
                        null,

                    retryCount:
                        getRetryCount(
                            job
                        ),

                    result: {

                        ...result,

                        mode:
                            result.mode ||
                            "simulation",

                        published:
                            result.published ===
                            true,

                        completedAt:
                            result.completedAt ||
                            new Date().toISOString(),
                    },
                }
            );


        addQueueLog(
            jobId,

            result.published === true
                ? "🟢 Đã đăng Facebook thật thành công"
                : "🟡 Hoàn tất mô phỏng — chưa đăng Facebook thật"
        );


        console.log(
            "🟢 FACEBOOK WORKER SUCCESS"
        );


        console.log(
            "Result:",
            finalResult
        );


        console.log(
            "================================="
        );


        return finalResult;

    } catch (error) {

        /**
         * ===============================
         * 9. XỬ LÝ ERROR
         * ===============================
         */

        const errorMessage =
            error?.message ||
            "Lỗi không xác định.";


        const currentRetry =
            getRetryCount(
                job
            );


        const retryAllowed =
            canRetry(
                job
            );


        console.error(
            "❌ FACEBOOK WORKER ERROR:",
            error
        );


        addQueueLog(
            jobId,

            `🔴 Worker thất bại: ${errorMessage}`
        );


        /**
         * ===============================
         * 10. RETRY
         * ===============================
         */

        if (
            retryAllowed
        ) {

            const nextRetry =
                getNextRetryCount(
                    job
                );


            updateQueueJob(
                jobId,
                {

                    /**
                     * Đưa Job trở lại
                     * WAITING.
                     */

                    status:
                        "waiting",

                    error:
                        errorMessage,

                    retryCount:
                        nextRetry,

                    result: {

                        mode:
                            "simulation",

                        published:
                            false,

                        lastFailedAt:
                            new Date().toISOString(),
                    },
                }
            );


            addQueueLog(
                jobId,

                `🔄 Job được đưa lại WAITING để thử lại (${nextRetry}/${MAX_RETRIES})`
            );


            console.warn(
                `🔄 Job ${jobId} sẽ retry ${nextRetry}/${MAX_RETRIES}`
            );


            throw error;
        }


        /**
         * ===============================
         * 11. HẾT RETRY
         * ===============================
         */

        updateQueueJob(
            jobId,
            {

                status:
                    "failed",

                error:
                    errorMessage,

                retryCount:
                    currentRetry,

                result: {

                    mode:
                        "simulation",

                    published:
                        false,

                    failedAt:
                        new Date().toISOString(),

                    retriesExhausted:
                        true,
                },
            }
        );


        addQueueLog(
            jobId,

            `⛔ Đã hết ${MAX_RETRIES} lần retry — Job chuyển FAILED`
        );


        console.error(
            "🔴 FACEBOOK WORKER FAILED"
        );


        console.error(
            "Error:",
            errorMessage
        );


        console.log(
            "================================="
        );


        throw error;
    }
}


/**
 * =======================================
 * XỬ LÝ TOÀN BỘ QUEUE
 * =======================================
 *
 * QUAN TRỌNG:
 *
 * Không dùng Promise.all().
 *
 * Job chạy tuần tự:
 *
 * Job 1
 * ↓
 * chờ Rate Controller
 * ↓
 * Job 2
 * ↓
 * chờ
 * ↓
 * Job 3
 *
 * Sau mỗi Batch sẽ nghỉ.
 */

export async function processFacebookQueue() {

    console.log(
        "🚀 BẮT ĐẦU XỬ LÝ TOÀN BỘ QUEUE"
    );


    /**
     * ===================================
     * 1. Đọc Queue
     * ===================================
     */

    const queue =
        loadPostingQueue();


    /**
     * Chỉ lấy Job đang WAITING
     */

    const waitingJobs =
        queue.filter(
            (job) =>
                job.status ===
                "waiting"
        );


    /**
     * ===================================
     * 2. Rate Controller
     * ===================================
     */

    const config =
        getRateControllerConfig();


    const batchSize =
        getBatchSize();


    console.log(
        `📦 Có ${waitingJobs.length} bài đang chờ`
    );


    console.log(
        "⚙️ Rate Controller:",
        config
    );


    console.log(
        `📦 Batch size: ${batchSize}`
    );


    const results = [];


    /**
     * ===================================
     * 3. XỬ LÝ TUẦN TỰ
     * ===================================
     */

    for (
        let index = 0;
        index < waitingJobs.length;
        index += 1
    ) {

        const job =
            waitingJobs[index];


        /**
         * ===============================
         * Chờ giữa các Job
         * ===============================
         *
         * Job đầu tiên chạy ngay.
         */

        
        /**
         * ===============================
         * Xử lý Job
         * ===============================
         */

        try {

            const result =
                await processFacebookJob(
                    job.id
                );


            results.push(
                result
            );

        } catch (error) {

            console.error(
                `❌ Job ${job.id} thất bại:`,
                error
            );


            /**
             * Đọc lại Job mới nhất.
             *
             * Nếu Job vừa được retry,
             * status lúc này sẽ là WAITING.
             */

            const latestJob =
                loadPostingQueue().find(
                    (item) =>
                        item.id ===
                        job.id
                );


            results.push(
                latestJob || {

                    id:
                        job.id,

                    status:
                        "failed",

                    error:
                        error?.message ||
                        "Lỗi không xác định.",
                }
            );
        }


              
    }


    /**
     * ===================================
     * 4. Hoàn tất
     * ===================================
     */

    console.log(
        "🟢 ĐÃ XỬ LÝ XONG QUEUE"
    );


    return results;
}


/**
 * =======================================
 * GET MAX RETRIES
 * =======================================
 *
 * Dùng sau này cho UI:
 *
 * Retry 0/2
 * Retry 1/2
 * Retry 2/2
 */

export function getMaxRetries() {

    return MAX_RETRIES;
}