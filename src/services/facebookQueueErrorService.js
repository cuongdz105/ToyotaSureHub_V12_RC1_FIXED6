// =======================================
// ToyotaSureHub
// Facebook Queue Error Service
// Version 1.0
// =======================================
//
// Nhiệm vụ:
//
// 1. Phân loại lỗi của Queue Job
// 2. Xác định lỗi cố định / lỗi có thể Retry
// 3. Xác định hành động sửa phù hợp
// 4. Chuẩn bị context để UI mở đúng nơi cần sửa
//
// LƯU Ý:
//
// Service này KHÔNG tự sửa dữ liệu.
// Nó chỉ phân tích lỗi và trả về hướng xử lý.
//
// =======================================


// =======================================
// ERROR TYPES
// =======================================

export const QUEUE_ERROR_TYPES = {

    PERMISSION:
        "permission",

    ACCOUNT:
        "account",

    IMAGE:
        "image",

    CONTENT:
        "content",

    GROUP:
        "group",

    // Tài khoản chưa vào nhóm (trang còn nút "Tham gia nhóm")
    NOT_MEMBER:
        "not_member",

    // Tiện ích không tìm thấy nút/ô trên giao diện Facebook
    UI:
        "ui",

    NETWORK:
        "network",

    TIMEOUT:
        "timeout",

    API:
        "api",

    UNKNOWN:
        "unknown",
};


// =======================================
// RETRYABLE ERROR TYPES
// =======================================

const RETRYABLE_TYPES = [

    QUEUE_ERROR_TYPES.NETWORK,

    QUEUE_ERROR_TYPES.TIMEOUT,

    QUEUE_ERROR_TYPES.API,

];


// =======================================
// NORMALIZE ERROR
// =======================================

function normalizeError(
    error
) {

    return String(
        error || ""
    )
        .trim()
        .toLowerCase();
}


// =======================================
// CLASSIFY ERROR
// =======================================

export function classifyQueueError(
    error
) {

    const message =
        normalizeError(
            error
        );


    if (!message) {

        return QUEUE_ERROR_TYPES.UNKNOWN;
    }


    // -----------------------------------
    // CHƯA LÀ THÀNH VIÊN NHÓM
    // (phải xét TRƯỚC "tài khoản", vì câu báo lỗi có chữ "tài khoản")
    // -----------------------------------

    if (
        message.includes("chưa là thành viên") ||
        message.includes("tham gia nhóm") ||
        message.includes("not a member")
    ) {

        return QUEUE_ERROR_TYPES.NOT_MEMBER;
    }


    // -----------------------------------
    // GIAO DIỆN FACEBOOK (không thấy ô soạn bài, nút...)
    // (xét TRƯỚC "nội dung", vì câu báo có "Viết nội dung...")
    // -----------------------------------

    if (
        message.includes("ô soạn bài") ||
        message.includes("khung soạn bài") ||
        message.includes("không tìm thấy nút")
    ) {

        return QUEUE_ERROR_TYPES.UI;
    }


    // -----------------------------------
    // PERMISSION
    // -----------------------------------

    if (

        message.includes(
            "không có quyền"
        ) ||

        message.includes(
            "không được phép"
        ) ||

        message.includes(
            "permission"
        ) ||

        message.includes(
            "not allowed"
        )

    ) {

        return QUEUE_ERROR_TYPES.PERMISSION;
    }


    // -----------------------------------
    // ACCOUNT
    // -----------------------------------

    if (

        message.includes(
            "tài khoản facebook"
        ) ||

        message.includes(
            "tài khoản"
        ) ||

        message.includes(
            "account"
        ) ||

        message.includes(
            "inactive"
        ) ||

        message.includes(
            "không hoạt động"
        )

    ) {

        return QUEUE_ERROR_TYPES.ACCOUNT;
    }


    // -----------------------------------
    // IMAGE
    // -----------------------------------

    if (

        message.includes(
            "không có ảnh"
        ) ||

        message.includes(
            "chưa có ảnh"
        ) ||

        message.includes(
            "ảnh"
        ) ||

        message.includes(
            "image"
        )

    ) {

        return QUEUE_ERROR_TYPES.IMAGE;
    }


    // -----------------------------------
    // CONTENT
    // -----------------------------------

    if (

        message.includes(
            "nội dung"
        ) ||

        message.includes(
            "content"
        ) ||

        message.includes(
            "bài đăng đang trống"
        )

    ) {

        return QUEUE_ERROR_TYPES.CONTENT;
    }


    // -----------------------------------
    // GROUP
    // -----------------------------------

    if (

        message.includes(
            "hội nhóm"
        ) ||

        message.includes(
            "nhóm facebook"
        ) ||

        message.includes(
            "nhóm"
        ) ||

        message.includes(
            "group"
        )

    ) {

        return QUEUE_ERROR_TYPES.GROUP;
    }


    // -----------------------------------
    // NETWORK
    // -----------------------------------

    if (

        message.includes(
            "network"
        ) ||

        message.includes(
            "networkerror"
        ) ||

        message.includes(
            "failed to fetch"
        ) ||

        message.includes(
            "kết nối"
        ) ||

        message.includes(
            "mạng"
        )

    ) {

        return QUEUE_ERROR_TYPES.NETWORK;
    }


    // -----------------------------------
    // TIMEOUT
    // -----------------------------------

    if (

        message.includes(
            "timeout"
        ) ||

        message.includes(
            "timed out"
        ) ||

        message.includes(
            "quá thời gian"
        )

    ) {

        return QUEUE_ERROR_TYPES.TIMEOUT;
    }


    // -----------------------------------
    // API
    // -----------------------------------

    if (

        message.includes(
            "api"
        ) ||

        message.includes(
            "server"
        ) ||

        message.includes(
            "facebook"
        ) &&
        (
            message.includes(
                "error"
            ) ||
            message.includes(
                "lỗi"
            )
        )

    ) {

        return QUEUE_ERROR_TYPES.API;
    }


    // -----------------------------------
    // UNKNOWN
    // -----------------------------------

    return QUEUE_ERROR_TYPES.UNKNOWN;
}


// =======================================
// CHECK RETRYABLE
// =======================================

export function isRetryableQueueError(
    error
) {

    const type =
        classifyQueueError(
            error
        );

    return RETRYABLE_TYPES.includes(
        type
    );
}


// =======================================
// BUILD FIX ACTION
// =======================================

export function getQueueFixAction(
    job
) {

    if (!job) {

        return {

            type:
                QUEUE_ERROR_TYPES.UNKNOWN,

            label:
                "🔍 Xem chi tiết",

            route:
                "/facebook/queue",

            canRetry:
                false,
        };
    }


    const errorCode =
        typeof job.error === "object" && job.error
            ? job.error.code
            : job.errorCode || job.payload?.error?.code;

    const type =
        errorCode === "not_member"
            ? QUEUE_ERROR_TYPES.NOT_MEMBER
            : errorCode === "ui"
                ? QUEUE_ERROR_TYPES.UI
                : classifyQueueError(
                    typeof job.error === "object" && job.error
                        ? job.error.reason || job.errorReason || ""
                        : job.error
                );


    // ===================================
    // CHƯA LÀ THÀNH VIÊN NHÓM
    // ===================================

    if (
        type ===
        QUEUE_ERROR_TYPES.NOT_MEMBER
    ) {

        const accountName =
            job.account?.name || "tài khoản đăng";

        return {

            type,

            label:
                "🔧 Sửa link nhóm",

            description:
                `Bấm "Mở nhóm để tham gia" rồi xin vào nhóm bằng Chrome của ${accountName}. ` +
                "Nếu nhóm mở ra không phải nhóm ông đã vào (trùng tên), bấm \"Sửa link nhóm\". " +
                "Xong bấm \"Thử lại\".",

            route:
                "/facebook/groups",

            params: {

                groupId:
                    job.group?.id ||
                    null,

            },

            joinGroup:
                true,

            canRetry:
                false,

        };
    }


    // ===================================
    // GIAO DIỆN FACEBOOK
    // ===================================

    if (
        type ===
        QUEUE_ERROR_TYPES.UI
    ) {

        return {

            type,

            label:
                "🔄 Thử lại",

            description:
                "Tiện ích không tìm thấy nút/ô cần bấm trên Facebook (Facebook đổi giao diện hoặc trang tải chậm). " +
                "Thử lại; nếu vẫn lỗi, mở Nhật ký xử lý chụp gửi con.",

            route:
                null,

            params: {},

            canRetry:
                true,

        };
    }


    // ===================================
    // PERMISSION
    // ===================================

    if (
        type ===
        QUEUE_ERROR_TYPES.PERMISSION
    ) {

        return {

            type,

            label:
                "🔧 Sửa quyền nhóm",

            description:
                "Kiểm tra quyền của tài khoản đối với nhóm này.",

            route:
                "/facebook/accounts",

            params: {

                accountId:
                    job.accountId ||
                    null,

                groupId:
                    job.group?.id ||
                    null,

                action:
                    "permissions",
            },

            canRetry:
                false,

        };
    }


    // ===================================
    // ACCOUNT
    // ===================================

    if (
        type ===
        QUEUE_ERROR_TYPES.ACCOUNT
    ) {

        return {

            type,

            label:
                "🔧 Sửa tài khoản",

            description:
                "Kiểm tra trạng thái tài khoản Facebook.",

            route:
                "/facebook/accounts",

            params: {

                accountId:
                    job.accountId ||
                    null,

                action:
                    "account",
            },

            canRetry:
                false,

        };
    }


    // ===================================
    // IMAGE
    // ===================================

    if (
        type ===
        QUEUE_ERROR_TYPES.IMAGE
    ) {

        return {

            type,

            label:
                "🔧 Sửa ảnh xe",

            description:
                "Mở đúng chiếc xe để bổ sung hoặc kiểm tra ảnh.",

            route:
                `/edit/${job.carId}`,

            params: {},

            canRetry:
                false,

        };
    }


    // ===================================
    // CONTENT
    // ===================================

    if (
        type ===
        QUEUE_ERROR_TYPES.CONTENT
    ) {

        return {

            type,

            label:
                "🔧 Sửa nội dung",

            description:
                "Mở lại bài đăng để chỉnh nội dung Facebook.",

            route:
                "/facebook/post",

            params: {

                carId:
                    job.carId ||
                    null,

                groupId:
                    job.group?.id ||
                    null,

            },

            canRetry:
                false,

        };
    }


    // ===================================
    // GROUP
    // ===================================

    if (
        type ===
        QUEUE_ERROR_TYPES.GROUP
    ) {

        return {

            type,

            label:
                "🔧 Sửa nhóm",

            description:
                "Kiểm tra thông tin và trạng thái nhóm.",

            route:
                "/facebook/groups",

            params: {

                groupId:
                    job.group?.id ||
                    null,

            },

            canRetry:
                false,

        };
    }


    // ===================================
    // NETWORK
    // ===================================

    if (
        type ===
        QUEUE_ERROR_TYPES.NETWORK
    ) {

        return {

            type,

            label:
                "🔄 Thử lại",

            description:
                "Lỗi kết nối tạm thời. Có thể Retry.",

            route:
                null,

            params: {},

            canRetry:
                true,

        };
    }


    // ===================================
    // TIMEOUT
    // ===================================

    if (
        type ===
        QUEUE_ERROR_TYPES.TIMEOUT
    ) {

        return {

            type,

            label:
                "🔄 Thử lại",

            description:
                "Request quá thời gian chờ. Có thể Retry.",

            route:
                null,

            params: {},

            canRetry:
                true,

        };
    }


    // ===================================
    // API
    // ===================================

    if (
        type ===
        QUEUE_ERROR_TYPES.API
    ) {

        return {

            type,

            label:
                "🔄 Thử lại",

            description:
                "Facebook/API có thể đang lỗi tạm thời.",

            route:
                null,

            params: {},

            canRetry:
                true,

        };
    }


    // ===================================
    // UNKNOWN
    // ===================================

    return {

        type:
            QUEUE_ERROR_TYPES.UNKNOWN,

        label:
            "🔍 Xem chi tiết",

        description:
            "Chưa xác định được nguyên nhân cụ thể.",

        route:
            null,

        params: {},

        canRetry:
            false,

    };
}