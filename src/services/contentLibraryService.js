// ==========================================
// ToyotaSureHub V11
// Content Library Storage Service
//
// V1:
// - Không lưu ảnh Base64 vào localStorage
// - Ảnh được lưu bằng IndexedDB
// - Metadata bài mẫu lưu chung trong IndexedDB
//
// Sau này:
// - Có thể thay storage layer bằng Supabase
// - UI và các service phía trên không cần thay đổi nhiều
// ==========================================

const DB_NAME = "ToyotaSureHubContentLibrary";
const DB_VERSION = 1;

const STORE_NAME = "contentLibrary";


// ==========================================
// MỞ DATABASE
// ==========================================

function openDatabase() {
    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(
                DB_NAME,
                DB_VERSION
            );


        request.onupgradeneeded = (event) => {

            const db =
                event.target.result;


            if (
                !db.objectStoreNames.contains(
                    STORE_NAME
                )
            ) {

                const store =
                    db.createObjectStore(
                        STORE_NAME,
                        {
                            keyPath: "id",
                        }
                    );


                store.createIndex(
                    "createdAt",
                    "createdAt",
                    {
                        unique: false,
                    }
                );


                store.createIndex(
                    "style",
                    "style",
                    {
                        unique: false,
                    }
                );


                store.createIndex(
                    "source",
                    "source",
                    {
                        unique: false,
                    }
                );

            }

        };


        request.onsuccess = () => {

            resolve(
                request.result
            );

        };


        request.onerror = () => {

            reject(
                request.error ||
                new Error(
                    "Không mở được Content Library Database."
                )
            );

        };

    });
}


// ==========================================
// TẠO ID
// ==========================================

function createId() {

    return (
        "sample_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .slice(2, 9)
    );

}


// ==========================================
// TRANSACTION HELPER
// ==========================================

async function withStore(
    mode,
    callback
) {

    const db =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    STORE_NAME,
                    mode
                );


            const store =
                transaction.objectStore(
                    STORE_NAME
                );


            let result;


            try {

                result =
                    callback(store);

            } catch (error) {

                reject(error);

                return;

            }


            transaction.oncomplete =
                () => {

                    resolve(result);

                };


            transaction.onerror =
                () => {

                    reject(
                        transaction.error ||
                        new Error(
                            "Content Library transaction failed."
                        )
                    );

                };


            transaction.onabort =
                () => {

                    reject(
                        transaction.error ||
                        new Error(
                            "Content Library transaction aborted."
                        )
                    );

                };

        }
    );

}


// ==========================================
// LẤY TẤT CẢ BÀI MẪU
// ==========================================

export async function getContentLibrary() {

    const db =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    STORE_NAME,
                    "readonly"
                );


            const store =
                transaction.objectStore(
                    STORE_NAME
                );


            const request =
                store.getAll();


            request.onsuccess = () => {

                const items =
                    Array.isArray(
                        request.result
                    )
                        ? request.result
                        : [];


                items.sort(
                    (a, b) =>
                        new Date(
                            b.createdAt || 0
                        ) -
                        new Date(
                            a.createdAt || 0
                        )
                );


                resolve(items);

            };


            request.onerror = () => {

                reject(
                    request.error ||
                    new Error(
                        "Không đọc được Content Library."
                    )
                );

            };

        }
    );

}


// ==========================================
// LẤY 1 BÀI MẪU
// ==========================================

export async function getContentSample(
    id
) {

    if (!id) {
        return null;
    }


    const db =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    STORE_NAME,
                    "readonly"
                );


            const store =
                transaction.objectStore(
                    STORE_NAME
                );


            const request =
                store.get(id);


            request.onsuccess = () => {

                resolve(
                    request.result ||
                    null
                );

            };


            request.onerror = () => {

                reject(
                    request.error ||
                    new Error(
                        "Không đọc được bài mẫu."
                    )
                );

            };

        }
    );

}


// ==========================================
// LƯU BÀI MẪU
// ==========================================
//
// sample:
// {
//   title,
//   content,
//   tags,
//   source,
//   note,
//   engagement,
//   style,
//   screenshot,
//   images,
//   aiAnalysis
// }
//
// screenshot / images:
// - Blob
// - File
// - hoặc mảng Blob/File
//
// ==========================================

export async function saveContentSample(
    sample = {}
) {

    const now =
        new Date().toISOString();


    const id =
        sample.id ||
        createId();


    const existing =
        sample.id
            ? await getContentSample(
                sample.id
            )
            : null;


    const record = {

        ...(existing || {}),

        ...sample,

        id,

        createdAt:
            existing?.createdAt ||
            sample.createdAt ||
            now,

        updatedAt:
            now,

    };


    // ======================================
    // CHUẨN HÓA ẢNH
    // ======================================

    if (
        sample.screenshot
    ) {

        record.screenshot =
            sample.screenshot;

    }


    if (
        Array.isArray(
            sample.images
        )
    ) {

        record.images =
            sample.images;

    }


    await withStore(
        "readwrite",
        (store) => {

            store.put(record);

        }
    );


    return record;

}


// ==========================================
// CẬP NHẬT BÀI MẪU
// ==========================================

export async function updateContentSample(
    id,
    updates = {}
) {

    if (!id) {

        throw new Error(
            "Thiếu ID bài mẫu."
        );

    }


    const existing =
        await getContentSample(id);


    if (!existing) {

        throw new Error(
            "Không tìm thấy bài mẫu."
        );

    }


    const updated = {

        ...existing,

        ...updates,

        id,

        createdAt:
            existing.createdAt,

        updatedAt:
            new Date().toISOString(),

    };


    await withStore(
        "readwrite",
        (store) => {

            store.put(updated);

        }
    );


    return updated;

}


// ==========================================
// XÓA BÀI MẪU
// ==========================================

export async function deleteContentSample(
    id
) {

    if (!id) {
        return false;
    }


    await withStore(
        "readwrite",
        (store) => {

            store.delete(id);

        }
    );


    return true;

}


// ==========================================
// XÓA TOÀN BỘ THƯ VIỆN
// ==========================================
//
// Dùng khi cần reset.
// Không gọi trong UI bình thường.
//

export async function clearContentLibrary() {

    await withStore(
        "readwrite",
        (store) => {

            store.clear();

        }
    );


    return true;

}


// ==========================================
// TÌM BÀI THEO TAG / STYLE / SOURCE
// ==========================================

export async function searchContentLibrary(
    keyword = ""
) {

    const items =
        await getContentLibrary();


    const query =
        String(keyword)
            .trim()
            .toLowerCase();


    if (!query) {

        return items;

    }


    return items.filter(
        (item) => {

            const text = [

                item.title,

                item.content,

                item.source,

                item.note,

                item.style,

                ...(Array.isArray(
                    item.tags
                )
                    ? item.tags
                    : []),

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            return text.includes(
                query
            );

        }
    );

}


// ==========================================
// LẤY CÁC BÀI CÓ TƯƠNG TÁC CAO
// ==========================================

export async function getHighEngagementSamples(
    limit = 10
) {

    const items =
        await getContentLibrary();


    const sorted =
        [...items].sort(
            (a, b) => {

                const aScore =
                    Number(
                        a.engagementScore ||
                        0
                    );


                const bScore =
                    Number(
                        b.engagementScore ||
                        0
                    );


                return (
                    bScore -
                    aScore
                );

            }
        );


    return sorted.slice(
        0,
        limit
    );

}


// ==========================================
// KIỂM TRA STORAGE
// ==========================================
//
// Chỉ dùng để debug.
//

export async function getContentLibraryStats() {

    const items =
        await getContentLibrary();


    let imageCount = 0;


    items.forEach(
        (item) => {

            if (
                item.screenshot
            ) {

                imageCount += 1;

            }


            if (
                Array.isArray(
                    item.images
                )
            ) {

                imageCount +=
                    item.images.length;

            }

        }
    );


    return {

        totalSamples:
            items.length,

        imageCount,

    };

}