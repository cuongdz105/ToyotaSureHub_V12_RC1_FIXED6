/**
 * FACEBOOK POSTING ENGINE
 *
 * Hiện tại:
 * - SIMULATION MODE
 * - Chưa đăng Facebook thật
 * - Chỉ mô phỏng toàn bộ quy trình
 *
 * Sau này:
 * - Thay phần simulation bằng Facebook API
 * - Queue Worker không cần viết lại
 */

import {
    loadAccounts,
} from "./facebookAccountService";


export const FACEBOOK_POSTING_MODE =
    "simulation";


import { getCarById } from "./carService";

// ==========================================
// FIND ACCOUNT
// ==========================================

function findAccount(accountId) {

    const accounts =
        loadAccounts();


    return (
        accounts.find(
            (account) =>
                String(account.id) ===
                String(accountId)
        ) || null
    );
}


// ==========================================
// KIỂM TRA ACCOUNT CÓ QUYỀN GROUP
// ==========================================

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


    // --------------------------------------
    // ACCOUNT PHẢI ACTIVE
    // --------------------------------------

    if (
        account.status !==
        "active"
    ) {
        return false;
    }


    const groupId =
        String(group.id);


    // --------------------------------------
    // MODE 1:
    // CHO PHÉP TẤT CẢ NHÓM
    // --------------------------------------

    if (
        account.allowAllGroups === true
    ) {

        const excludedGroupIds =
            Array.isArray(
                account.excludedGroupIds
            )
                ? account.excludedGroupIds
                : [];


        const isExcluded =
            excludedGroupIds.some(
                (id) =>
                    String(id) ===
                    groupId
            );


        return !isExcluded;
    }


    // --------------------------------------
    // MODE 2:
    // CHỈ NHÓM ĐƯỢC CHỌN
    // --------------------------------------

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


// ==========================================
// KIỂM TRA QUYỀN ĐĂNG
// ==========================================

function validateAccountPermission(
    account,
    group
) {

    if (!account) {

        throw new Error(
            "Không tìm thấy tài khoản Facebook."
        );

    }


    if (!group) {

        throw new Error(
            "Chưa có hội nhóm Facebook."
        );

    }


    // --------------------------------------
    // ACCOUNT ACTIVE
    // --------------------------------------

    if (
        account.status !==
        "active"
    ) {

        throw new Error(
            `Tài khoản Facebook "${account.name}" hiện không hoạt động.`
        );
    }


    // --------------------------------------
    // ACCOUNT → GROUP
    // --------------------------------------

    const allowed =
        isAccountAllowedForGroup(
            account,
            group
        );


    if (!allowed) {

        throw new Error(
            `Tài khoản "${account.name}" không được phép đăng vào nhóm "${group.name}".`
        );
    }


    return true;
}


// ==========================================
// GET CAR IMAGES
// ==========================================

function getCarImages(car) {

    if (
        !car ||
        !Array.isArray(
            car.images
        )
    ) {
        return [];
    }


    return car.images.filter(
        (image) => {

            // ------------------------------
            // STRING
            // ------------------------------

            if (
                typeof image ===
                "string"
            ) {

                return (
                    image.trim() !== ""
                );
            }


            // ------------------------------
            // OBJECT PREVIEW
            // ------------------------------

            if (
                image &&
                typeof image ===
                    "object" &&
                image.preview
            ) {

                return true;
            }


            return false;
        }
    );
}


// ==========================================
// BUILD POSTING IMAGES FROM VARIATION
// ==========================================
//
// Không thay đổi car.images gốc.
// Chỉ tạo một mảng ảnh riêng cho Job.
//
// Nếu Job có variation.imageIndexes:
// → lấy đúng ảnh theo thứ tự đã được Campaign
//   tạo trước đó.
//
// Nếu không có variation:
// → giữ nguyên thứ tự ảnh gốc.
//
// ==========================================

function buildPostingImages(
    images,
    variation
) {

    if (
        !Array.isArray(images) ||
        images.length === 0
    ) {

        return {
            images: [],
            indexes: [],
            usedVariation: false,
        };
    }


    const indexes =
        Array.isArray(
            variation?.imageIndexes
        )
            ? variation.imageIndexes
                .map(
                    (index) =>
                        Number(index)
                )
                .filter(
                    (index) =>
                        Number.isInteger(
                            index
                        ) &&
                        index >= 0 &&
                        index < images.length
                )
            : [];


    // --------------------------------------
    // Không có Variation
    // --------------------------------------

    if (
        indexes.length === 0
    ) {

        return {

            images: [
                ...images
            ],

            indexes:
                images.map(
                    (_, index) =>
                        index
                ),

            usedVariation:
                false,
        };
    }


    // --------------------------------------
    // Có Variation
    //
    // Giữ đúng thứ tự Campaign đã tạo.
    // --------------------------------------

    const postingImages =
        indexes.map(
            (index) =>
                images[index]
        );


    return {

        images:
            postingImages,

        indexes:
            indexes,

        usedVariation:
            true,
    };
}

// ==========================================
// VALIDATE POST DATA
// ==========================================

function validatePostData(job) {

    if (!job) {

        throw new Error(
            "Không có Posting Job."
        );
    }


    if (!job.group) {

        throw new Error(
            "Chưa có hội nhóm Facebook."
        );
    }


    if (!job.content?.trim()) {

        throw new Error(
            "Nội dung Facebook đang trống."
        );
    }


    if (
        !job.imageCount ||
        job.imageCount <= 0
    ) {

        throw new Error(
            "Bài đăng chưa có ảnh."
        );
    }


    if (!job.accountId) {

        throw new Error(
            "Chưa có tài khoản Facebook."
        );
    }


    if (!job.carId) {

        throw new Error(
            "Chưa có ID xe."
        );
    }
}


// ==========================================
// FACEBOOK POSTING ENGINE
// ==========================================

export async function runFacebookPostingEngine(
    job
) {

    // --------------------------------------
    // 0. VALIDATE JOB
    // --------------------------------------

    validatePostData(
        job
    );


    const logs = [];


    logs.push(
        createLog(
            "🚀 Bắt đầu Facebook Posting Engine",
            "start"
        )
    );


    logs.push(
        createLog(
            `📌 Chế độ: ${FACEBOOK_POSTING_MODE.toUpperCase()}`,
            "info"
        )
    );


    // ======================================
    // 1. TÌM XE
    // ======================================

    const car =
        findCar(
            job.carId
        );


    if (!car) {

        throw new Error(
            `Không tìm thấy xe với ID: ${job.carId}`
        );
    }


    logs.push(
        createLog(
            `🚗 Đã tìm thấy xe: ${
                car.brand || ""
            } ${
                car.model || ""
            }`,
            "success"
        )
    );


    // ======================================
    // 2. TÌM ACCOUNT MỚI NHẤT
    // ======================================

    const account =
        findAccount(
            job.accountId
        );


    if (!account) {

        throw new Error(
            `Không tìm thấy tài khoản Facebook với ID: ${job.accountId}`
        );
    }


    logs.push(
        createLog(
            `👤 Đã tìm thấy tài khoản: ${account.name}`,
            "success"
        )
    );


    // ======================================
    // 3. KIỂM TRA QUYỀN ACCOUNT → GROUP
    // ======================================

    logs.push(
        createLog(
            "🔐 Đang kiểm tra quyền tài khoản với hội nhóm...",
            "processing"
        )
    );


    validateAccountPermission(
        account,
        job.group
    );


    logs.push(
        createLog(
            `🔐 Tài khoản "${account.name}" được phép đăng vào "${job.group.name}"`,
            "success"
        )
    );


        // ======================================
    // 4. KIỂM TRA ẢNH THẬT
    // ======================================

    const images =
        getCarImages(
            car
        );

    if (
        images.length === 0
    ) {

        throw new Error(
            "Xe không có ảnh."
        );
    }


    // ======================================
    // 4B. BUILD VARIATION IMAGES
    // ======================================

    const postingImageResult =
        buildPostingImages(
            images,
            job.variation
        );

    const postingImages =
        postingImageResult.images;

    const postingImageIndexes =
        postingImageResult.indexes;

    const usedImageVariation =
        postingImageResult.usedVariation;


    logs.push(
        createLog(
            `📷 Đã kiểm tra ${images.length} ảnh`,
            "success"
        )
    );


    if (
        usedImageVariation
    ) {

        logs.push(
            createLog(
                `🎨 Variation ảnh: ${postingImageIndexes
                    .map(
                        (index) =>
                            index + 1
                    )
                    .join(" → ")}`,
                "info"
            )
        );

    } else {

        logs.push(
            createLog(
                "🎨 Không có Variation ảnh — dùng thứ tự ảnh gốc",
                "info"
            )
        );
    }

    // ======================================
    // 5. KIỂM TRA NỘI DUNG
    // ======================================

    logs.push(
        createLog(
            "📝 Nội dung Facebook hợp lệ",
            "success"
        )
    );


      // ======================================
    // 6. KIỂM TRA IMAGE COUNT
    // ======================================

    if (
        Number(job.imageCount) !==
        postingImages.length
    ) {

        logs.push(
            createLog(
                `⚠️ Queue ghi ${job.imageCount} ảnh, Variation thực tế dùng ${postingImages.length} ảnh`,
                "warning"
            )
        );
    }


    // ======================================
    // 7. CHUẨN BỊ ẢNH
    // ======================================

    logs.push(
        createLog(
            "📷 Đang chuẩn bị ảnh",
            "processing"
        )
    );


    await delay(500);


        logs.push(
        createLog(
            `📷 Đã chuẩn bị xong ${postingImages.length} ảnh`,
            "success"
        )
    );


    // ======================================
    // 8. CHUẨN BỊ NỘI DUNG
    // ======================================

    logs.push(
        createLog(
            "📝 Đang chuẩn bị nội dung Facebook",
            "processing"
        )
    );


    await delay(500);


    logs.push(
        createLog(
            "📝 Nội dung Facebook đã sẵn sàng",
            "success"
        )
    );


    // ======================================
    // 9. CHUẨN BỊ GROUP
    // ======================================

    logs.push(
        createLog(
            `👥 Chuẩn bị đăng vào nhóm: ${
                job.group.name ||
                "Không rõ"
            }`,
            "processing"
        )
    );


    await delay(500);


    // ======================================
    // 10. KIỂM TRA QUYỀN LẦN CUỐI
    // ======================================

    /*
     * Account có thể bị thay đổi quyền
     * trong lúc Queue đang chờ.
     *
     * Vì vậy Engine đọc lại Account
     * trước khi thực hiện Posting.
     */

    const latestAccount =
        findAccount(
            job.accountId
        );


    if (!latestAccount) {

        throw new Error(
            "Tài khoản Facebook không còn tồn tại."
        );
    }


    validateAccountPermission(
        latestAccount,
        job.group
    );


    logs.push(
        createLog(
            "🔒 Kiểm tra quyền lần cuối: OK",
            "success"
        )
    );


    // ======================================
    // 11. SIMULATION
    // ======================================

    if (
        FACEBOOK_POSTING_MODE ===
        "simulation"
    ) {

        logs.push(
            createLog(
                "⚠️ Đang ở chế độ mô phỏng — chưa gửi dữ liệu tới Facebook",
                "warning"
            )
        );


        await delay(700);


        logs.push(
            createLog(
                "🚀 Posting Engine đã hoàn tất bước mô phỏng",
                "success"
            )
        );


        logs.push(
            createLog(
                "🟢 Bài đăng mô phỏng thành công",
                "success"
            )
        );


        return {

            success:
                true,


            mode:
                "simulation",


            // false = chưa đăng Facebook thật

            published:
                false,


            jobId:
                job.id,


            carId:
                job.carId,


            car: {

                brand:
                    car.brand || "",

                model:
                    car.model || "",

                version:
                    car.version || "",

                year:
                    car.year || "",

                color:
                    car.color || "",

            },


            group: {

                id:
                    job.group?.id ||
                    null,

                name:
                    job.group?.name ||
                    "",

                url:
                    job.group?.url ||
                    "",

            },


            account: {

                id:
                    latestAccount.id ||
                    null,

                name:
                    latestAccount.name ||
                    "",

                status:
                    latestAccount.status ||
                    "",

            },


            imageCount:
    postingImages.length,

imageIndexes:
    postingImageIndexes,

usedImageVariation:
    usedImageVariation,


            logs,


            completedAt:
                now(),

        };
    }


    // ======================================
    // MODE CHƯA ĐƯỢC CẤU HÌNH
    // ======================================

    throw new Error(
        "Facebook Posting Engine chưa được cấu hình."
    );
}


// ==========================================
// DELAY
// ==========================================

function delay(ms) {

    return new Promise(
        (resolve) =>
            setTimeout(
                resolve,
                ms
            )
    );
}