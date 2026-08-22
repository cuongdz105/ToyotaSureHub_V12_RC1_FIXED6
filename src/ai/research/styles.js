// =======================================
// ToyotaSureHub V11
// Style Research - Styles Storage
// =======================================
//
// Nhiệm vụ:
// - Lưu Style DNA đã được AI nghiên cứu
// - Đọc danh sách Style
// - Lấy Style theo ID
// - Xóa Style
// - Cập nhật Style
//
// Chưa liên quan đến Facebook API.
// Dữ liệu lưu LocalStorage.
//
// =======================================


const STORAGE_KEY =
    "toyota_sure_hub_research_styles_v11";


// =======================================
// LOAD
// =======================================

function loadStyles() {

    try {

        const raw =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!raw) {

            return [];

        }


        const parsed =
            JSON.parse(raw);


        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {

        console.error(
            "Toyota Research: Không đọc được Style:",
            error
        );

        return [];

    }

}


// =======================================
// SAVE
// =======================================

function saveStyles(
    styles
) {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(styles)
        );

        return true;

    } catch (error) {

        console.error(
            "Toyota Research: Không lưu được Style:",
            error
        );

        return false;

    }

}


// =======================================
// TẠO ID
// =======================================

function createStyleId() {

    return (
        `style_${Date.now()}_` +
        Math.random()
            .toString(36)
            .slice(2, 8)
    );

}


// =======================================
// CHUẨN HÓA STYLE
// =======================================

function normalizeStyle(
    style = {}
) {

    return {

        id:
            style.id ||
            createStyleId(),


        name:
            style.name ||
            "Toyota Content Style",


        category:
            style.category ||
            "facebook",


        style:
            style.style ||
            {},


        sampleCount:
            Number(
                style.sampleCount
            ) || 0,


        // Điểm hiệu quả trung bình.
        // Giai đoạn đầu chưa bắt buộc
        // phải có dữ liệu.
        averageEngagement:
            Number(
                style.averageEngagement
            ) || 0,


        topScore:
            Number(
                style.topScore
            ) || 0,


        source:
            style.source ||
            "manual_research",


        createdAt:
            style.createdAt ||
            new Date().toISOString(),


        updatedAt:
            new Date().toISOString(),

    };

}


// =======================================
// LẤY TẤT CẢ STYLE
// =======================================

export function getStyles() {

    return loadStyles();

}


// =======================================
// LẤY STYLE THEO ID
// =======================================

export function getStyleById(
    id
) {

    if (!id) {

        return null;

    }


    return (
        loadStyles().find(
            (item) =>
                String(item.id) ===
                String(id)
        ) || null
    );

}


// =======================================
// LƯU STYLE MỚI
// =======================================

export function saveStyle(
    style
) {

    const styles =
        loadStyles();


    const normalized =
        normalizeStyle(
            style
        );


    styles.unshift(
        normalized
    );


    saveStyles(
        styles
    );


    return normalized;

}


// =======================================
// CẬP NHẬT STYLE
// =======================================

export function updateStyle(
    id,
    updates = {}
) {

    const styles =
        loadStyles();


    const index =
        styles.findIndex(
            (item) =>
                String(item.id) ===
                String(id)
        );


    if (index === -1) {

        return null;

    }


    const updated = {

        ...styles[index],

        ...updates,

        id:
            styles[index].id,

        createdAt:
            styles[index].createdAt,

        updatedAt:
            new Date().toISOString(),

    };


    styles[index] =
        normalizeStyle(
            updated
        );


    saveStyles(
        styles
    );


    return styles[index];

}


// =======================================
// XÓA STYLE
// =======================================

export function deleteStyle(
    id
) {

    const styles =
        loadStyles();


    const updated =
        styles.filter(
            (item) =>
                String(item.id) !==
                String(id)
        );


    saveStyles(
        updated
    );


    return updated;

}


// =======================================
// XÓA TOÀN BỘ STYLE
// =======================================

export function clearStyles() {

    localStorage.removeItem(
        STORAGE_KEY
    );

}


// =======================================
// ĐẾM STYLE
// =======================================

export function getStyleCount() {

    return loadStyles().length;

}


// =======================================
// STORAGE KEY
// =======================================

export const RESEARCH_STYLES_STORAGE_KEY =
    STORAGE_KEY;