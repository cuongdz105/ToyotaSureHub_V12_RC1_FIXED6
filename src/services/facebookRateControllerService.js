// =======================================
// Facebook Rate Controller
// =======================================
//
// Điều phối tốc độ xử lý Facebook Posting Queue.
// - Chạy tuần tự, không chạy đồng thời nhiều Job.
// - Có khoảng nghỉ giữa các Job.
// - Có khoảng nghỉ giữa các Batch.
//
// Đây là lớp điều phối workflow.
// Khi kết nối Facebook thật, tốc độ phải được
// cấu hình phù hợp với giới hạn và chính sách.
//

const STORAGE_KEY =
    "facebook_rate_controller";

const DEFAULT_CONFIG = {
    enabled: true,

    // Simulation để test nhanh
    simulationDelaySeconds: 3,

    // Sau này dùng khi chạy Facebook thật
    productionDelaySeconds: 60,

    // Sau mỗi batch sẽ nghỉ
    batchSize: 5,
    batchBreakSeconds: 120,
};


// =======================================
// LOAD CONFIG
// =======================================

export function loadRateControllerConfig() {

    const data =
        localStorage.getItem(
            STORAGE_KEY
        );

    if (!data) {

        return {
            ...DEFAULT_CONFIG,
        };
    }

    try {

        const saved =
            JSON.parse(data);

        return {
            ...DEFAULT_CONFIG,
            ...(saved || {}),
        };

    } catch (error) {

        console.error(
            "Không đọc được Rate Controller config:",
            error
        );

        return {
            ...DEFAULT_CONFIG,
        };
    }
}


// =======================================
// SAVE CONFIG
// =======================================

export function saveRateControllerConfig(
    config = {}
) {

    const nextConfig = {

        ...DEFAULT_CONFIG,

        ...(config || {}),
    };

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
            nextConfig
        )
    );

    return nextConfig;
}


// =======================================
// GET CONFIG
// =======================================

export function getRateControllerConfig() {

    return loadRateControllerConfig();
}


// =======================================
// BATCH SIZE
// =======================================

export function getBatchSize() {

    const config =
        loadRateControllerConfig();

    return Math.max(
        1,
        Number(
            config.batchSize
        ) || 1
    );
}


// =======================================
// DELAY
// =======================================

export function getDelaySeconds({
    simulation = true,
} = {}) {

    const config =
        loadRateControllerConfig();

    return Math.max(
        0,
        Number(
            simulation
                ? config.simulationDelaySeconds
                : config.productionDelaySeconds
        ) || 0
    );
}


// =======================================
// BATCH BREAK
// =======================================

export function getBatchBreakSeconds() {

    const config =
        loadRateControllerConfig();

    return Math.max(
        0,
        Number(
            config.batchBreakSeconds
        ) || 0
    );
}


// =======================================
// WAIT
// =======================================

export function wait(ms) {

    const duration =
        Math.max(
            0,
            Number(ms) || 0
        );

    if (duration === 0) {

        return Promise.resolve();
    }

    return new Promise(
        (resolve) => {

            setTimeout(
                resolve,
                duration
            );

        }
    );
}


// =======================================
// WAIT BETWEEN JOBS
// =======================================

export async function waitBetweenJobs({
    simulation = true,
} = {}) {

    const config =
        loadRateControllerConfig();

    if (!config.enabled) {

        return;
    }

    const seconds =
        getDelaySeconds({
            simulation,
        });

    if (seconds <= 0) {

        return;
    }

    await wait(
        seconds * 1000
    );
}


// =======================================
// WAIT BETWEEN BATCHES
// =======================================

export async function waitBetweenBatches() {

    const config =
        loadRateControllerConfig();

    if (!config.enabled) {

        return;
    }

    const seconds =
        getBatchBreakSeconds();

    if (seconds <= 0) {

        return;
    }

    await wait(
        seconds * 1000
    );
}


// =======================================
// DEFAULT CONFIG
// =======================================

export function getDefaultRateControllerConfig() {

    return {
        ...DEFAULT_CONFIG,
    };
}