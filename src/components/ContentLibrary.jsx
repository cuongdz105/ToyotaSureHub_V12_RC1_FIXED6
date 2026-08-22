// =======================================
// ToyotaSureHub V11
// Content Library
// =======================================
//
// Giai đoạn 1:
// - Lưu bài mẫu
// - Paste ảnh bằng Ctrl + V
// - Upload ảnh
// - Lưu nội dung bài viết riêng
// - Gắn nhãn
// - Lưu tương tác
// - Nhận diện trạng thái quảng cáo
// - Sửa / Xóa
//
// TEXT:
// → Nội dung ông paste là nguồn text chính.
//
// SCREENSHOT:
// → Dùng để nghiên cứu visual / layout.
//
// AD STATUS:
// → paid / organic / unknown
//
// Research Engine sẽ nối ở bước tiếp theo.
// =======================================

import { useEffect, useState } from "react";

import {
    getContentLibrary,
    saveContentSample,
    updateContentSample,
    deleteContentSample,
} from "../services/contentLibraryService";

import YouTubeResearchPanel from "./YouTubeResearchPanel";


// =======================================
// DEFAULT TAGS
// =======================================

const DEFAULT_TAGS = [
    "Gần gũi",
    "Sang trọng",
    "Gia đình",
    "Hài hước",
    "Tò mò",
    "Giá tốt",
    "Xe đẹp",
];


// =======================================
// AD STATUS CONFIG
// =======================================

const AD_STATUS_CONFIG = {

    paid: {
        label: "🔴 Có dấu hiệu quảng cáo",
        background: "#fff1f1",
        color: "#b91c1c",
        border: "#fecaca",
    },

    organic: {
        label: "🟢 Organic",
        background: "#f0fdf4",
        color: "#15803d",
        border: "#bbf7d0",
    },

    unknown: {
        label: "🟡 Chưa xác định",
        background: "#fffbeb",
        color: "#a16207",
        border: "#fde68a",
    },

};


// =======================================
// NÉN ẢNH
// =======================================

async function compressImage(
    dataUrl,
    maxWidth = 1600,
    quality = 0.75
) {

    return new Promise(
        (resolve) => {

            const image =
                new Image();


            image.onload = () => {

                let width =
                    image.naturalWidth;

                let height =
                    image.naturalHeight;


                if (
                    width >
                    maxWidth
                ) {

                    height =
                        Math.round(
                            height *
                            (
                                maxWidth /
                                width
                            )
                        );

                    width =
                        maxWidth;

                }


                const canvas =
                    document.createElement(
                        "canvas"
                    );


                canvas.width =
                    width;

                canvas.height =
                    height;


                const ctx =
                    canvas.getContext(
                        "2d"
                    );


                ctx.drawImage(
                    image,
                    0,
                    0,
                    width,
                    height
                );


                resolve(
                    canvas.toDataURL(
                        "image/jpeg",
                        quality
                    )
                );

            };


            image.onerror = () => {

                resolve(
                    dataUrl
                );

            };


            image.src =
                dataUrl;

        }
    );

}


// =======================================
// FILE → DATA URL
// =======================================

function readImageAsDataURL(
    file
) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload = () =>
                resolve(
                    reader.result
                );


            reader.onerror =
                reject;


            reader.readAsDataURL(
                file
            );

        }
    );

}


// =======================================
// DATA URL → BLOB
// =======================================

function dataUrlToBlob(dataUrl) {

    const parts =
        String(dataUrl).split(",");

    if (parts.length < 2) {
        return null;
    }

    const mimeMatch =
        parts[0].match(
            /data:(.*?);base64/
        );

    const mime =
        mimeMatch?.[1] ||
        "image/jpeg";

    const binary =
        atob(parts[1]);

    const bytes =
        new Uint8Array(
            binary.length
        );

    for (
        let i = 0;
        i < binary.length;
        i++
    ) {

        bytes[i] =
            binary.charCodeAt(i);

    }

    return new Blob(
        [bytes],
        { type: mime }
    );

}


// =======================================
// IMAGE PREVIEW
// =======================================

function getImageSrc(image) {

    if (!image) {
        return "";
    }

    if (typeof image === "string") {
        return image;
    }

    if (image instanceof Blob) {
        return URL.createObjectURL(image);
    }

    return "";
}


// =======================================
// COMPONENT
// =======================================

function ContentLibrary() {

    const [
        library,
        setLibrary,
    ] = useState([]);


    const [
        showForm,
        setShowForm,
    ] = useState(false);


    const [
        editingId,
        setEditingId,
    ] = useState(null);


    const [
        content,
        setContent,
    ] = useState("");


    const [
        screenshots,
        setScreenshots,
    ] = useState([]);


    const [
        tags,
        setTags,
    ] = useState([]);


    const [
        customTag,
        setCustomTag,
    ] = useState("");


    const [
        source,
        setSource,
    ] = useState("");


    const [
        note,
        setNote,
    ] = useState("");


    const [
        likes,
        setLikes,
    ] = useState("");


    const [
        comments,
        setComments,
    ] = useState("");


    const [
        shares,
        setShares,
    ] = useState("");


    const [
        search,
        setSearch,
    ] = useState("");


    const [
        pastingImage,
        setPastingImage,
    ] = useState(false);

    const [
        showYouTubeResearch,
        setShowYouTubeResearch,
    ] = useState(false);


    // ===================================
    // LOAD
    // ===================================

    async function refreshLibrary() {

        try {

            const items =
                await getContentLibrary();

            setLibrary(items);

        } catch (error) {

            console.error(
                "Content Library Load Error:",
                error
            );

            setLibrary([]);

            alert(
                "❌ Không đọc được thư viện bài mẫu."
            );

        }

    }


    useEffect(() => {

        refreshLibrary();

    }, []);


    // ===================================
    // RESET
    // ===================================

    function resetForm() {

        setEditingId(null);

        setContent("");

        setScreenshots([]);

        setTags([]);

        setCustomTag("");

        setSource("");

        setNote("");

        setLikes("");

        setComments("");

        setShares("");

        setPastingImage(false);

    }


    // ===================================
    // OPEN ADD
    // ===================================

    function handleOpenAdd() {

        resetForm();

        setShowForm(true);

    }


    // ===================================
    // CANCEL
    // ===================================

    function handleCancel() {

        resetForm();

        setShowForm(false);

    }


    // ===================================
    // TAG
    // ===================================

    function toggleTag(
        tag
    ) {

        setTags(
            (prev) =>
                prev.includes(tag)

                    ? prev.filter(
                        (item) =>
                            item !== tag
                    )

                    : [
                        ...prev,
                        tag,
                    ]
        );

    }


    function addCustomTag() {

        const tag =
            customTag.trim();


        if (!tag) {
            return;
        }


        setTags(
            (prev) =>
                prev.includes(tag)
                    ? prev
                    : [
                        ...prev,
                        tag,
                    ]
        );


        setCustomTag("");

    }


    // ===================================
    // ADD IMAGE
    // ===================================

    async function addImageDataUrl(
        dataUrl
    ) {

        if (!dataUrl) {
            return;
        }


        try {

            setPastingImage(true);


            const compressed =
                await compressImage(
                    dataUrl
                );


            const blob =
                dataUrlToBlob(
                    compressed
                );

            if (!blob) {
                throw new Error(
                    "Không chuyển được ảnh sang Blob."
                );
            }

            setScreenshots(
                (prev) => [
                    ...prev,
                    blob,
                ]
            );

        } catch (error) {

            console.error(
                "Content Library Image Error:",
                error
            );

            alert(
                "❌ Không xử lý được ảnh."
            );

        } finally {

            setPastingImage(false);

        }

    }


    // ===================================
    // CTRL + V IMAGE
    // ===================================

    async function handlePaste(
        event
    ) {

        const clipboardItems =
            Array.from(
                event.clipboardData
                    ?.items || []
            );


        const imageItems =
            clipboardItems.filter(
                (item) =>
                    item.type.startsWith(
                        "image/"
                    )
            );


        if (
            imageItems.length === 0
        ) {

            return;

        }


        event.preventDefault();


        for (
            const item
            of imageItems
        ) {

            const file =
                item.getAsFile();


            if (!file) {
                continue;
            }


            const dataUrl =
                await readImageAsDataURL(
                    file
                );


            await addImageDataUrl(
                dataUrl
            );

        }

    }


    // ===================================
    // FILE UPLOAD
    // ===================================

    async function handleImageChange(
        event
    ) {

        const files =
            Array.from(
                event.target.files || []
            );


        if (
            files.length === 0
        ) {

            return;

        }


        try {

            setPastingImage(true);


            const converted =
                await Promise.all(

                    files.map(
                        async (
                            file
                        ) => {

                            const dataUrl =
                                await readImageAsDataURL(
                                    file
                                );


                            const compressed =
                                await compressImage(
                                    dataUrl
                                );

                            const blob =
                                dataUrlToBlob(
                                    compressed
                                );

                            if (!blob) {
                                throw new Error(
                                    "Không chuyển được ảnh sang Blob."
                                );
                            }

                            return blob;

                        }
                    )

                );


            setScreenshots(
                (prev) => [
                    ...prev,
                    ...converted,
                ]
            );

        } catch (error) {

            console.error(
                "Không đọc được ảnh:",
                error
            );

            alert(
                "❌ Không đọc được ảnh."
            );

        } finally {

            setPastingImage(false);

        }


        event.target.value =
            "";

    }


    // ===================================
    // REMOVE IMAGE
    // ===================================

    function removeScreenshot(
        index
    ) {

        setScreenshots(
            (prev) =>
                prev.filter(
                    (_, i) =>
                        i !== index
                )
        );

    }


    // ===================================
    // SAVE
    // ===================================

    async function handleSave() {

        if (
            !content.trim()
        ) {

            alert(
                "Ông cần dán nội dung bài viết trước."
            );

            return;

        }


        try {

            const data = {

                content:
                    content.trim(),

                screenshots,

                tags,

                source:
                    source.trim(),

                note:
                    note.trim(),

                engagement: {

                    likes:
                        likes.trim(),

                    comments:
                        comments.trim(),

                    shares:
                        shares.trim(),

                },

            };


            if (editingId) {

                await updateContentSample(
                    editingId,
                    data
                );

                alert(
                    "✅ Đã cập nhật bài mẫu."
                );

            } else {

                await saveContentSample(
                    data
                );

                alert(
                    "✅ Đã lưu bài mẫu vào thư viện."
                );

            }


            refreshLibrary();

            handleCancel();

        } catch (error) {

            console.error(
                "Content Library Save Error:",
                error
            );

            alert(
                "❌ Không lưu được bài mẫu."
            );

        }

    }


    // ===================================
    // EDIT
    // ===================================

    function handleEdit(
        item
    ) {

        setEditingId(
            item.id
        );


        setContent(
            item.content || ""
        );


        setScreenshots(
            Array.isArray(
                item.screenshots
            )
                ? item.screenshots
                : []
        );


        setTags(
            Array.isArray(
                item.tags
            )
                ? item.tags
                : []
        );


        setSource(
            item.source || ""
        );


        setNote(
            item.note || ""
        );


        setLikes(
            item.engagement?.likes ||
                ""
        );


        setComments(
            item.engagement?.comments ||
                ""
        );


        setShares(
            item.engagement?.shares ||
                ""
        );


        setShowForm(true);

    }


    // ===================================
    // DELETE
    // ===================================

    async function handleDelete(
        id
    ) {

        const confirmed =
            window.confirm(
                "Ông có chắc muốn xóa bài mẫu này không?"
            );


        if (!confirmed) {
            return;
        }


        try {

            deleteContentSample(
                id
            );


            refreshLibrary();

        } catch (error) {

            console.error(
                "Content Library Delete Error:",
                error
            );

            alert(
                "❌ Không xóa được bài mẫu."
            );

        }

    }


    // ===================================
    // SEARCH
    // ===================================

    const filteredLibrary =
        library.filter(
            (item) => {

                if (
                    !search.trim()
                ) {

                    return true;

                }


                const query =
                    search
                        .trim()
                        .toLowerCase();


                const text =
                    String(
                        item.content || ""
                    ).toLowerCase();


                const itemTags =
                    Array.isArray(
                        item.tags
                    )
                        ? item.tags
                            .join(" ")
                            .toLowerCase()
                        : "";


                const sourceText =
                    String(
                        item.source || ""
                    ).toLowerCase();


                const adStatus =
                    String(
                        item.adStatus || ""
                    ).toLowerCase();


                return (
                    text.includes(query) ||
                    itemTags.includes(query) ||
                    sourceText.includes(query) ||
                    adStatus.includes(query)
                );

            }
        );


    // ===================================
    // AD STATUS HELPER
    // ===================================

    function getAdStatusConfig(
        status
    ) {

        return (
            AD_STATUS_CONFIG[
                status
            ] ||
            AD_STATUS_CONFIG.unknown
        );

    }


    // ===================================
    // UI
    // ===================================

    return (

        <div
            style={{
                padding: "24px",
                maxWidth: "1400px",
                margin: "0 auto",
            }}
        >

            {/* =================================
                HEADER
            ================================= */}

            <div
                style={{
                    display: "flex",
                    justifyContent:
                        "space-between",
                    alignItems: "center",
                    gap: "16px",
                    marginBottom: "24px",
                }}
            >

                <div>

                    <h1
                        style={{
                            margin: 0,
                        }}
                    >
                        📚 Thư viện bài mẫu
                    </h1>


                    <p
                        style={{
                            margin:
                                "6px 0 0",
                            color: "#666",
                        }}
                    >
                        Lưu những bài viết hay để
                        Toyota AI nghiên cứu và học
                        phong cách nội dung.
                    </p>

                </div>


                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                    }}
                >

                    <button
                        type="button"
                        onClick={() =>
                            setShowYouTubeResearch(
                                (prev) => !prev
                            )
                        }
                        style={{
                            border: "1px solid #111827",
                            borderRadius: "9px",
                            padding: "11px 16px",
                            background:
                                showYouTubeResearch
                                    ? "#111827"
                                    : "#fff",
                            color:
                                showYouTubeResearch
                                    ? "#fff"
                                    : "#111827",
                            fontWeight: 700,
                            cursor: "pointer",
                        }}
                    >
                        🔎 YouTube Research
                    </button>


                <button
                    type="button"
                    onClick={
                        handleOpenAdd
                    }
                    style={{
                        border: "none",
                        borderRadius: "9px",
                        padding:
                            "11px 16px",
                        background:
                            "#d71920",
                        color: "#fff",
                        fontWeight: 700,
                        cursor: "pointer",
                    }}
                >
                    ＋ Thêm bài
                </button>

                </div>

            </div>


            {showYouTubeResearch && (
                <section
                    style={{
                        marginBottom: "28px",
                    }}
                >
                    <YouTubeResearchPanel />
                </section>
            )}


            {/* =================================
                FORM
            ================================= */}

            {showForm && (

                <section
                    style={{
                        background: "#fff",
                        border:
                            "1px solid #e5e5e5",
                        borderRadius: "14px",
                        padding: "22px",
                        marginBottom: "28px",
                        boxShadow:
                            "0 4px 18px rgba(0,0,0,.06)",
                    }}
                >

                    <div
                        style={{
                            display: "flex",
                            justifyContent:
                                "space-between",
                            alignItems: "center",
                            marginBottom: "20px",
                        }}
                    >

                        <h2
                            style={{
                                margin: 0,
                            }}
                        >
                            {editingId
                                ? "✏️ Sửa bài mẫu"
                                : "➕ Thêm bài mẫu mới"}
                        </h2>


                        <button
                            type="button"
                            onClick={
                                handleCancel
                            }
                            style={{
                                border:
                                    "1px solid #ddd",
                                background:
                                    "#fff",
                                borderRadius:
                                    "8px",
                                padding:
                                    "7px 11px",
                                cursor:
                                    "pointer",
                            }}
                        >
                            ✕ Đóng
                        </button>

                    </div>


                    {/* =================================
                        SCREENSHOT
                    ================================= */}

                    <div
                        tabIndex={0}
                        onPaste={
                            handlePaste
                        }
                        style={{
                            marginBottom:
                                "22px",
                            outline:
                                "none",
                        }}
                    >

                        <label
                            style={{
                                display:
                                    "block",
                                fontWeight:
                                    700,
                                marginBottom:
                                    "8px",
                            }}
                        >
                            📷 Ảnh chụp màn hình
                        </label>


                        <div
                            style={{
                                border:
                                    "2px dashed #d1d5db",
                                borderRadius:
                                    "12px",
                                padding:
                                    "24px",
                                background:
                                    "#fafafa",
                                textAlign:
                                    "center",
                                cursor:
                                    "text",
                            }}
                        >

                            <div
                                style={{
                                    fontSize:
                                        "30px",
                                    marginBottom:
                                        "8px",
                                }}
                            >
                                📋
                            </div>


                            <div
                                style={{
                                    fontWeight:
                                        700,
                                    marginBottom:
                                        "5px",
                                }}
                            >
                                Ctrl + V để dán
                                ảnh chụp màn hình
                            </div>


                            <div
                                style={{
                                    color:
                                        "#777",
                                    fontSize:
                                        "13px",
                                    marginBottom:
                                        "14px",
                                }}
                            >
                                Có thể dính thêm
                                nội dung xung quanh.
                                AI sẽ ưu tiên nội dung
                                ông dán riêng bên dưới.
                            </div>


                            <label
                                style={{
                                    display:
                                        "inline-block",
                                    border:
                                        "1px solid #ddd",
                                    background:
                                        "#fff",
                                    borderRadius:
                                        "8px",
                                    padding:
                                        "9px 13px",
                                    cursor:
                                        "pointer",
                                    fontWeight:
                                        600,
                                }}
                            >
                                📁 Hoặc chọn ảnh từ máy

                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={
                                        handleImageChange
                                    }
                                    style={{
                                        display:
                                            "none",
                                    }}
                                />

                            </label>


                            {pastingImage && (

                                <div
                                    style={{
                                        marginTop:
                                            "12px",
                                        color:
                                            "#666",
                                        fontSize:
                                            "13px",
                                    }}
                                >
                                    ⏳ Đang xử lý ảnh...
                                </div>

                            )}

                        </div>


                        {/* IMAGE PREVIEW */}

                        {screenshots.length >
                            0 && (

                            <div
                                style={{
                                    display:
                                        "grid",
                                    gridTemplateColumns:
                                        "repeat(auto-fill,minmax(160px,1fr))",
                                    gap:
                                        "10px",
                                    marginTop:
                                        "12px",
                                }}
                            >

                                {screenshots.map(
                                    (
                                        image,
                                        index
                                    ) => (

                                        <div
                                            key={
                                                `${index}-${image.slice(
                                                    0,
                                                    20
                                                )}`
                                            }
                                            style={{
                                                position:
                                                    "relative",
                                            }}
                                        >

                                            <img
                                                src={
                                                    getImageSrc(
                                                        image
                                                    )
                                                }
                                                alt=""
                                                style={{
                                                    width:
                                                        "100%",
                                                    height:
                                                        "160px",
                                                    objectFit:
                                                        "cover",
                                                    borderRadius:
                                                        "9px",
                                                    border:
                                                        "1px solid #ddd",
                                                }}
                                            />


                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeScreenshot(
                                                        index
                                                    )
                                                }
                                                style={{
                                                    position:
                                                        "absolute",
                                                    top:
                                                        "5px",
                                                    right:
                                                        "5px",
                                                    border:
                                                        "none",
                                                    borderRadius:
                                                        "50%",
                                                    width:
                                                        "28px",
                                                    height:
                                                        "28px",
                                                    background:
                                                        "#d71920",
                                                    color:
                                                        "#fff",
                                                    cursor:
                                                        "pointer",
                                                    fontWeight:
                                                        "bold",
                                                }}
                                            >
                                                ×
                                            </button>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </div>


                    {/* =================================
                        TEXT
                    ================================= */}

                    <div
                        style={{
                            marginBottom:
                                "20px",
                        }}
                    >

                        <label
                            style={{
                                display:
                                    "block",
                                fontWeight:
                                    700,
                                marginBottom:
                                    "8px",
                            }}
                        >
                            📝 Nội dung chính của bài
                        </label>


                        <div
                            style={{
                                color:
                                    "#777",
                                fontSize:
                                    "13px",
                                marginBottom:
                                    "8px",
                            }}
                        >
                            Dán đúng nội dung bài
                            ông muốn AI nghiên cứu.
                            Đây là nguồn text chính.
                        </div>


                        <textarea
                            value={
                                content
                            }
                            onChange={(e) =>
                                setContent(
                                    e.target.value
                                )
                            }
                            rows={10}
                            placeholder="Dán nội dung bài Facebook vào đây..."
                            style={{
                                width:
                                    "100%",
                                boxSizing:
                                    "border-box",
                                padding:
                                    "12px",
                                border:
                                    "1px solid #ddd",
                                borderRadius:
                                    "9px",
                                resize:
                                    "vertical",
                                fontSize:
                                    "14px",
                                lineHeight:
                                    "1.6",
                            }}
                        />

                    </div>


                    {/* =================================
                        TAGS
                    ================================= */}

                    <div
                        style={{
                            marginBottom:
                                "20px",
                        }}
                    >

                        <label
                            style={{
                                display:
                                    "block",
                                fontWeight:
                                    700,
                                marginBottom:
                                    "8px",
                            }}
                        >
                            🏷️ Nhãn
                        </label>


                        <div
                            style={{
                                display:
                                    "flex",
                                flexWrap:
                                    "wrap",
                                gap:
                                    "7px",
                            }}
                        >

                            {DEFAULT_TAGS.map(
                                (tag) => (

                                    <button
                                        key={
                                            tag
                                        }
                                        type="button"
                                        onClick={() =>
                                            toggleTag(
                                                tag
                                            )
                                        }
                                        style={{
                                            border:
                                                tags.includes(
                                                    tag
                                                )
                                                    ? "1px solid #d71920"
                                                    : "1px solid #ddd",
                                            background:
                                                tags.includes(
                                                    tag
                                                )
                                                    ? "#fff1f1"
                                                    : "#fff",
                                            color:
                                                tags.includes(
                                                    tag
                                                )
                                                    ? "#d71920"
                                                    : "#333",
                                            borderRadius:
                                                "999px",
                                            padding:
                                                "6px 10px",
                                            cursor:
                                                "pointer",
                                        }}
                                    >
                                        {tag}
                                    </button>

                                )
                            )}

                        </div>


                        <div
                            style={{
                                display:
                                    "flex",
                                gap:
                                    "8px",
                                marginTop:
                                    "10px",
                            }}
                        >

                            <input
                                value={
                                    customTag
                                }
                                onChange={(e) =>
                                    setCustomTag(
                                        e.target.value
                                    )
                                }
                                onKeyDown={(e) => {

                                    if (
                                        e.key ===
                                        "Enter"
                                    ) {

                                        e.preventDefault();

                                        addCustomTag();

                                    }

                                }}
                                placeholder="Thêm nhãn riêng..."
                                style={{
                                    flex: 1,
                                    maxWidth:
                                        "300px",
                                    padding:
                                        "9px 11px",
                                    border:
                                        "1px solid #ddd",
                                    borderRadius:
                                        "8px",
                                }}
                            />


                            <button
                                type="button"
                                onClick={
                                    addCustomTag
                                }
                                style={{
                                    border:
                                        "1px solid #ddd",
                                    background:
                                        "#fff",
                                    borderRadius:
                                        "8px",
                                    padding:
                                        "8px 12px",
                                    cursor:
                                        "pointer",
                                }}
                            >
                                ＋ Thêm nhãn
                            </button>

                        </div>


                        {tags.length >
                            0 && (

                            <div
                                style={{
                                    marginTop:
                                        "10px",
                                    color:
                                        "#666",
                                    fontSize:
                                        "13px",
                                }}
                            >
                                Đã chọn:{" "}
                                {tags.join(
                                    " · "
                                )}
                            </div>

                        )}

                    </div>


                    {/* =================================
                        ENGAGEMENT
                    ================================= */}

                    <div
                        style={{
                            marginBottom:
                                "20px",
                        }}
                    >

                        <label
                            style={{
                                display:
                                    "block",
                                fontWeight:
                                    700,
                                marginBottom:
                                    "8px",
                            }}
                        >
                            📊 Tương tác
                            <span
                                style={{
                                    fontWeight:
                                        400,
                                    color:
                                        "#888",
                                    marginLeft:
                                        "6px",
                                }}
                            >
                                (không bắt buộc)
                            </span>
                        </label>


                        <div
                            style={{
                                display:
                                    "grid",
                                gridTemplateColumns:
                                    "repeat(3,minmax(120px,1fr))",
                                gap:
                                    "10px",
                            }}
                        >

                            <input
                                type="text"
                                value={
                                    likes
                                }
                                onChange={(e) =>
                                    setLikes(
                                        e.target.value
                                    )
                                }
                                placeholder="👍 Like"
                                style={{
                                    padding:
                                        "10px",
                                    border:
                                        "1px solid #ddd",
                                    borderRadius:
                                        "8px",
                                }}
                            />


                            <input
                                type="text"
                                value={
                                    comments
                                }
                                onChange={(e) =>
                                    setComments(
                                        e.target.value
                                    )
                                }
                                placeholder="💬 Comment"
                                style={{
                                    padding:
                                        "10px",
                                    border:
                                        "1px solid #ddd",
                                    borderRadius:
                                        "8px",
                                }}
                            />


                            <input
                                type="text"
                                value={
                                    shares
                                }
                                onChange={(e) =>
                                    setShares(
                                        e.target.value
                                    )
                                }
                                placeholder="↗️ Share"
                                style={{
                                    padding:
                                        "10px",
                                    border:
                                        "1px solid #ddd",
                                    borderRadius:
                                        "8px",
                                }}
                            />

                        </div>

                    </div>


                    {/* =================================
                        SOURCE + NOTE
                    ================================= */}

                    <div
                        style={{
                            display:
                                "grid",
                            gridTemplateColumns:
                                "1fr 1fr",
                            gap:
                                "12px",
                            marginBottom:
                                "20px",
                        }}
                    >

                        <div>

                            <label
                                style={{
                                    display:
                                        "block",
                                    fontWeight:
                                        700,
                                    marginBottom:
                                        "7px",
                                }}
                            >
                                🌐 Nguồn / Nhóm
                            </label>


                            <input
                                type="text"
                                value={
                                    source
                                }
                                onChange={(e) =>
                                    setSource(
                                        e.target.value
                                    )
                                }
                                placeholder="Ví dụ: Hội Toyota Việt Nam"
                                style={{
                                    width:
                                        "100%",
                                    boxSizing:
                                        "border-box",
                                    padding:
                                        "10px",
                                    border:
                                        "1px solid #ddd",
                                    borderRadius:
                                        "8px",
                                }}
                            />

                        </div>


                        <div>

                            <label
                                style={{
                                    display:
                                        "block",
                                    fontWeight:
                                        700,
                                    marginBottom:
                                        "7px",
                                }}
                            >
                                🗒️ Ghi chú
                            </label>


                            <input
                                type="text"
                                value={
                                    note
                                }
                                onChange={(e) =>
                                    setNote(
                                        e.target.value
                                    )
                                }
                                placeholder="Ví dụ: Hook mở đầu rất cuốn"
                                style={{
                                    width:
                                        "100%",
                                    boxSizing:
                                        "border-box",
                                    padding:
                                        "10px",
                                    border:
                                        "1px solid #ddd",
                                    borderRadius:
                                        "8px",
                                }}
                            />

                        </div>

                    </div>


                    {/* =================================
                        SAVE ACTION
                    ================================= */}

                    <div
                        style={{
                            display:
                                "flex",
                            justifyContent:
                                "flex-end",
                            gap:
                                "10px",
                        }}
                    >

                        <button
                            type="button"
                            onClick={
                                handleCancel
                            }
                            style={{
                                border:
                                    "1px solid #ddd",
                                background:
                                    "#fff",
                                borderRadius:
                                    "9px",
                                padding:
                                    "11px 16px",
                                cursor:
                                    "pointer",
                            }}
                        >
                            Hủy
                        </button>


                        <button
                            type="button"
                            onClick={
                                handleSave
                            }
                            disabled={
                                pastingImage
                            }
                            style={{
                                border:
                                    "none",
                                borderRadius:
                                    "9px",
                                padding:
                                    "11px 18px",
                                background:
                                    pastingImage
                                        ? "#aaa"
                                        : "#16a34a",
                                color:
                                    "#fff",
                                fontWeight:
                                    700,
                                cursor:
                                    pastingImage
                                        ? "not-allowed"
                                        : "pointer",
                            }}
                        >
                            💾{" "}
                            {editingId
                                ? "Lưu thay đổi"
                                : "Lưu bài mẫu"}
                        </button>

                    </div>

                </section>

            )}


            {/* =================================
                LIBRARY
            ================================= */}

            <section
                style={{
                    background:
                        "#fff",
                    border:
                        "1px solid #eee",
                    borderRadius:
                        "14px",
                    padding:
                        "20px",
                }}
            >

                <div
                    style={{
                        display:
                            "flex",
                        justifyContent:
                            "space-between",
                        alignItems:
                            "center",
                        gap:
                            "15px",
                        marginBottom:
                            "18px",
                    }}
                >

                    <h2
                        style={{
                            margin: 0,
                        }}
                    >
                        📚 Đã lưu (
                        {
                            filteredLibrary.length
                        }
                        )
                    </h2>


                    <input
                        type="text"
                        value={
                            search
                        }
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                        placeholder="🔎 Tìm bài mẫu..."
                        style={{
                            width:
                                "280px",
                            padding:
                                "9px 12px",
                            border:
                                "1px solid #ddd",
                            borderRadius:
                                "8px",
                        }}
                    />

                </div>


                {filteredLibrary.length ===
                    0 ? (

                    <div
                        style={{
                            padding:
                                "40px 20px",
                            textAlign:
                                "center",
                            color:
                                "#777",
                            border:
                                "1px dashed #ddd",
                            borderRadius:
                                "10px",
                        }}
                    >
                        📭 Chưa có bài mẫu nào.

                        <div
                            style={{
                                marginTop:
                                    "8px",
                            }}
                        >
                            Hãy lưu những bài
                            Facebook hay ông bắt
                            gặp vào đây.
                        </div>

                    </div>

                ) : (

                    <div
                        style={{
                            display:
                                "grid",
                            gridTemplateColumns:
                                "repeat(auto-fill,minmax(280px,1fr))",
                            gap:
                                "16px",
                        }}
                    >

                        {filteredLibrary.map(
                            (item) => {

                                const adConfig =
                                    getAdStatusConfig(
                                        item.adStatus
                                    );


                                return (

                                    <article
                                        key={
                                            item.id
                                        }
                                        style={{
                                            border:
                                                "1px solid #e5e5e5",
                                            borderRadius:
                                                "12px",
                                            overflow:
                                                "hidden",
                                            background:
                                                "#fff",
                                        }}
                                    >

                                        {/* IMAGE */}

                                        {item.screenshots?.length >
                                            0 ? (

                                            <img
                                                src={
                                                    getImageSrc(
                                                        item.screenshots[0]
                                                    )
                                                }
                                                alt=""
                                                style={{
                                                    width:
                                                        "100%",
                                                    height:
                                                        "190px",
                                                    objectFit:
                                                        "cover",
                                                }}
                                            />

                                        ) : (

                                            <div
                                                style={{
                                                    height:
                                                        "190px",
                                                    background:
                                                        "#f5f5f5",
                                                    display:
                                                        "flex",
                                                    alignItems:
                                                        "center",
                                                    justifyContent:
                                                        "center",
                                                    color:
                                                        "#999",
                                                }}
                                            >
                                                📷 Chưa có
                                                ảnh
                                            </div>

                                        )}


                                        <div
                                            style={{
                                                padding:
                                                    "14px",
                                            }}
                                        >

                                            {/* AD STATUS */}

                                            <div
                                                style={{
                                                    display:
                                                        "inline-flex",
                                                    alignItems:
                                                        "center",
                                                    gap:
                                                        "6px",
                                                    padding:
                                                        "5px 9px",
                                                    borderRadius:
                                                        "999px",
                                                    background:
                                                        adConfig.background,
                                                    color:
                                                        adConfig.color,
                                                    border:
                                                        `1px solid ${adConfig.border}`,
                                                    fontSize:
                                                        "12px",
                                                    fontWeight:
                                                        700,
                                                    marginBottom:
                                                        "9px",
                                                }}
                                            >
                                                {
                                                    adConfig.label
                                                }
                                            </div>


                                            {/* CONFIDENCE */}

                                            {typeof item.adConfidence ===
                                                "number" && (

                                                <div
                                                    style={{
                                                        fontSize:
                                                            "12px",
                                                        color:
                                                            "#777",
                                                        marginBottom:
                                                            "9px",
                                                    }}
                                                >
                                                    Độ tin cậy:
                                                    {" "}
                                                    {Math.round(
                                                        item.adConfidence *
                                                        100
                                                    )}
                                                    %
                                                </div>

                                            )}


                                            {/* TAGS */}

                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    flexWrap:
                                                        "wrap",
                                                    gap:
                                                        "5px",
                                                    marginBottom:
                                                        "10px",
                                                }}
                                            >

                                                {(
                                                    item.tags ||
                                                    []
                                                ).map(
                                                    (
                                                        tag
                                                    ) => (

                                                        <span
                                                            key={
                                                                tag
                                                            }
                                                            style={{
                                                                padding:
                                                                    "4px 8px",
                                                                borderRadius:
                                                                    "999px",
                                                                background:
                                                                    "#f3f4f6",
                                                                fontSize:
                                                                    "12px",
                                                            }}
                                                        >
                                                            {
                                                                tag
                                                            }
                                                        </span>

                                                    )
                                                )}

                                            </div>


                                            {/* CONTENT */}

                                            <div
                                                style={{
                                                    color:
                                                        "#333",
                                                    fontSize:
                                                        "14px",
                                                    lineHeight:
                                                        "1.55",
                                                    whiteSpace:
                                                        "pre-line",
                                                    display:
                                                        "-webkit-box",
                                                    WebkitLineClamp:
                                                        7,
                                                    WebkitBoxOrient:
                                                        "vertical",
                                                    overflow:
                                                        "hidden",
                                                    minHeight:
                                                        "150px",
                                                }}
                                            >
                                                {
                                                    item.content
                                                }
                                            </div>


                                            {/* ENGAGEMENT */}

                                            {(
                                                item.engagement?.likes ||
                                                item.engagement?.comments ||
                                                item.engagement?.shares
                                            ) && (

                                                <div
                                                    style={{
                                                        marginTop:
                                                            "10px",
                                                        color:
                                                            "#777",
                                                        fontSize:
                                                            "12px",
                                                    }}
                                                >
                                                    👍{" "}
                                                    {
                                                        item.engagement?.likes ||
                                                        0
                                                    }
                                                    {" · "}
                                                    💬{" "}
                                                    {
                                                        item.engagement?.comments ||
                                                        0
                                                    }
                                                    {" · "}
                                                    ↗️{" "}
                                                    {
                                                        item.engagement?.shares ||
                                                        0
                                                    }
                                                </div>

                                            )}


                                            {/* RESEARCH STATUS */}

                                            <div
                                                style={{
                                                    marginTop:
                                                        "10px",
                                                    fontSize:
                                                        "12px",
                                                    fontWeight:
                                                        700,
                                                    color:
                                                        item.analyzed
                                                            ? "#16803c"
                                                            : "#999",
                                                }}
                                            >
                                                {item.analyzed
                                                    ? "🧠 Đã phân tích"
                                                    : "⏳ Chưa phân tích"}
                                            </div>


                                            {/* ACTIONS */}

                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    gap:
                                                        "7px",
                                                    marginTop:
                                                        "12px",
                                                }}
                                            >

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        alert(
                                                            "🧠 Research Engine sẽ được nối ở bước tiếp theo."
                                                        )
                                                    }
                                                    style={{
                                                        flex:
                                                            1,
                                                        border:
                                                            "none",
                                                        borderRadius:
                                                            "8px",
                                                        padding:
                                                            "9px 6px",
                                                        background:
                                                            "#111827",
                                                        color:
                                                            "#fff",
                                                        fontWeight:
                                                            700,
                                                        cursor:
                                                            "pointer",
                                                    }}
                                                >
                                                    🧠 Phân tích
                                                </button>


                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleEdit(
                                                            item
                                                        )
                                                    }
                                                    style={{
                                                        border:
                                                            "1px solid #ddd",
                                                        background:
                                                            "#fff",
                                                        borderRadius:
                                                            "8px",
                                                        padding:
                                                            "9px 10px",
                                                        cursor:
                                                            "pointer",
                                                    }}
                                                >
                                                    ✏️
                                                </button>


                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDelete(
                                                            item.id
                                                        )
                                                    }
                                                    style={{
                                                        border:
                                                            "1px solid #f2caca",
                                                        background:
                                                            "#fff5f5",
                                                        color:
                                                            "#d71920",
                                                        borderRadius:
                                                            "8px",
                                                        padding:
                                                            "9px 10px",
                                                        cursor:
                                                            "pointer",
                                                    }}
                                                >
                                                    🗑️
                                                </button>

                                            </div>

                                        </div>

                                    </article>

                                );

                            }
                        )}

                    </div>

                )}

            </section>

        </div>

    );

}


export default ContentLibrary;