import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import SectionCard from "../../components/Common/SectionCard";
import PrimaryButton from "../../components/Common/PrimaryButton";

import {
    getCurrentPosting,
    startPosting,
} from "../../services/postingSessionService";

import { getCarById } from "../../services/carService";


import {
    addToPostingQueue,
} from "../../services/facebookPostingQueueService";

import {
    createCampaign,
    attachCampaignJobs,
    setCampaignStatus,
} from "../../services/facebookCampaignService";

import {
    loadAccounts,
    getDefaultAccount,
} from "../../services/facebookAccountService";

import {
    loadGroups,
} from "../../services/facebookGroupService";

import {
    generateFacebookPost,
} from "../../services/aiService";

import {
    learnFromEdit,
} from "../../services/styleLearningService";


function FacebookPostPreview() {

    const navigate = useNavigate();
    const location = useLocation();


    // ==========================================
    // STATE
    // ==========================================

    const [postingCar, setPostingCar] =
        useState(null);

    const [groups, setGroups] =
        useState([]);

    const [selectedGroupIds, setSelectedGroupIds] =
        useState([]);

    const [groupSearch, setGroupSearch] =
        useState("");

    const [content, setContent] =
        useState("");

    // Lưu lại bản AI viết ra ban đầu (trước khi ông sửa)
    // Dùng để so sánh với bản đã sửa, phục vụ tính năng
    // học văn phong cá nhân.
    const [aiOriginalContent, setAiOriginalContent] =
        useState("");

    const [addingToQueue, setAddingToQueue] =
        useState(false);

    const [generatingAI, setGeneratingAI] =
        useState(false);

    const [accounts, setAccounts] =
        useState([]);

    const [selectedAccountId, setSelectedAccountId] =
        useState("");

      
    // ==========================================
    // LOAD DỮ LIỆU
    // ==========================================

    useEffect(() => {
      const stateCarId = location.state?.carId;
      const car = stateCarId ? getCarById(stateCarId) : getCurrentPosting();

      if (car) {
        startPosting(car);
        setPostingCar(car);
        if (location.state?.accountId) {
          setSelectedAccountId(String(location.state.accountId));
        }
        if (car.aiContent?.facebook) {
          setContent(car.aiContent.facebook);
          setAiOriginalContent(car.aiContent.facebook);
        }
      }

      const savedAccounts = loadAccounts();
      setAccounts(savedAccounts);
      if (!location.state?.accountId) {
        const defaultAccount = getDefaultAccount();
        setSelectedAccountId(String(defaultAccount?.id || savedAccounts[0]?.id || ""));
      }

      const availableGroups = loadGroups();
      setGroups(availableGroups);

      const stateGroupId = location.state?.groupId;
      if (stateGroupId) {
        const selectedGroup = availableGroups.find(
          (group) => String(group.id) === String(stateGroupId)
        );
        if (selectedGroup) {
          setSelectedGroupIds([String(selectedGroup.id)]);
        }
      }
    }, [location.state]);

    // ==========================================
    // KIỂM TRA ACCOUNT CÓ ĐƯỢC PHÉP GROUP
    // ==========================================

    function isAccountAllowedForGroup(
        account,
        currentGroup
    ) {

        if (
            !account ||
            !currentGroup
        ) {

            return false;
        }


        // Account phải active

        if (
            account.status !==
            "active"
        ) {

            return false;
        }


        const groupId =
            String(
                currentGroup.id
            );


        // --------------------------------------
        // MODE 1:
        // TẤT CẢ NHÓM
        // --------------------------------------

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
    // ACCOUNT ĐANG CHỌN
    // ==========================================

    const selectedAccount =
        accounts.find(
            (account) =>
                String(
                    account.id
                ) ===
                String(
                    selectedAccountId
                )
        );


    // ==========================================
    // NHÓM ĐƯỢC PHÉP ĐĂNG
    // ==========================================

    const allowedGroups =
        useMemo(() => {

            if (!selectedAccount) {
                return [];
            }

            return groups.filter(
                (group) =>
                    isAccountAllowedForGroup(
                        selectedAccount,
                        group
                    )
            );

        }, [
            groups,
            selectedAccount,
        ]);


    // ==========================================
    // NHÓM SAU KHI TÌM KIẾM
    // ==========================================

    const filteredGroups =
        useMemo(() => {

            const keyword =
                groupSearch
                    .trim()
                    .toLowerCase();

            if (!keyword) {
                return allowedGroups;
            }

            return allowedGroups.filter(
                (group) => {

                    const nameMatch =
                        group.name
                            ?.toLowerCase()
                            .includes(
                                keyword
                            );

                    const urlMatch =
                        group.url
                            ?.toLowerCase()
                            .includes(
                                keyword
                            );

                    const suitableMatch =
                        Array.isArray(
                            group.suitableCars
                        ) &&
                        group.suitableCars.some(
                            (car) =>
                                car
                                    .toLowerCase()
                                    .includes(
                                        keyword
                                    )
                        );

                    return (
                        nameMatch ||
                        urlMatch ||
                        suitableMatch
                    );
                }
            );

        }, [
            allowedGroups,
            groupSearch,
        ]);


        // ==========================================
// NHÓM ƯU TIÊN
// ==========================================
// Top 20 nhóm có độ phù hợp cao nhất
// với chiếc xe đang đăng.
//
// QUAN TRỌNG:
// Chỉ lấy từ allowedGroups
// => tài khoản Facebook hiện tại
// phải được phép đăng vào nhóm đó.
// ==========================================

function getGroupScore(group) {

    if (!postingCar) {
        return 0;
    }

    let score = 50;

    const suitableCars =
        Array.isArray(
            group.suitableCars
        )
            ? group.suitableCars
            : [];

    const suitableText =
        suitableCars
            .join(" ")
            .toLowerCase();


    // --------------------------------------
    // Phù hợp với dòng xe
    // --------------------------------------

    if (
        postingCar.model &&
        suitableText.includes(
            postingCar.model.toLowerCase()
        )
    ) {

        score += 35;
    }


    // --------------------------------------
    // Tên group có hãng / model
    // --------------------------------------

    if (group.name) {

        const groupName =
            group.name.toLowerCase();


        if (
            postingCar.brand &&
            groupName.includes(
                postingCar.brand.toLowerCase()
            )
        ) {

            score += 10;
        }


        if (
            postingCar.model &&
            groupName.includes(
                postingCar.model.toLowerCase()
            )
        ) {

            score += 15;
        }
    }


    // --------------------------------------
    // Group đang active
    // --------------------------------------

    if (
        group.status ===
        "active"
    ) {

        score += 5;
    }


    // --------------------------------------
    // Chưa từng đăng
    // --------------------------------------

    if (
        !group.totalPosts ||
        group.totalPosts === 0
    ) {

        score += 3;
    }


    return Math.min(
        score,
        100
    );
}


// ==========================================
// TOP 20 NHÓM ƯU TIÊN
// ==========================================

const priorityGroups =
    useMemo(() => {

        return [...allowedGroups]

            .map(
                (group) => ({

                    ...group,

                    matchScore:
                        getGroupScore(
                            group
                        ),

                })
            )

            .sort(
                (a, b) => {

                    // Ưu tiên điểm phù hợp cao
                    if (
                        b.matchScore !==
                        a.matchScore
                    ) {

                        return (
                            b.matchScore -
                            a.matchScore
                        );
                    }

                    // Nếu bằng điểm,
                    // ưu tiên nhóm ít đăng hơn
                    return (
                        (a.totalPosts || 0) -
                        (b.totalPosts || 0)
                    );
                }
            )

            .slice(
                0,
                20
            );

    }, [
        allowedGroups,
        postingCar,
    ]);

    // ==========================================
    // NHÓM ĐÃ CHỌN
    // ==========================================

    const selectedGroups =
        allowedGroups.filter(
            (group) =>
                selectedGroupIds.some(
                    (id) =>
                        String(id) ===
                        String(group.id)
                )
        );


    // ==========================================
    // TỰ LOẠI NHÓM KHÔNG CÒN HỢP LỆ
    // KHI ĐỔI FACEBOOK ACCOUNT
    // ==========================================

    useEffect(() => {

        setSelectedGroupIds(
            (currentIds) =>
                currentIds.filter(
                    (id) =>
                        allowedGroups.some(
                            (group) =>
                                String(
                                    group.id
                                ) ===
                                String(id)
                        )
                )
        );

    }, [
        selectedAccountId,
        allowedGroups,
    ]);


    // ==========================================
    // CHỌN / BỎ CHỌN 1 NHÓM
    // ==========================================

    function toggleGroup(
        groupId
    ) {

        const id =
            String(
                groupId
            );

        setSelectedGroupIds(
            (currentIds) => {

                const exists =
                    currentIds.some(
                        (item) =>
                            String(
                                item
                            ) ===
                            id
                    );

                if (exists) {

                    return currentIds.filter(
                        (item) =>
                            String(
                                item
                            ) !==
                            id
                    );
                }

                return [
                    ...currentIds,
                    id,
                ];
            }
        );
    }


    // ==========================================
// CHỌN / BỎ CHỌN TOÀN BỘ NHÓM ƯU TIÊN
// ==========================================

function handleToggleAllPriorityGroups() {

    const priorityIds =
        priorityGroups.map(
            (group) =>
                String(group.id)
        );


    if (
        priorityIds.length === 0
    ) {

        return;
    }


    setSelectedGroupIds(
        (currentIds) => {

            const normalizedIds =
                currentIds.map(
                    (id) =>
                        String(id)
                );


            const allPrioritySelected =
                priorityIds.every(
                    (id) =>
                        normalizedIds.includes(
                            id
                        )
                );


            // --------------------------------
            // Nếu đã chọn hết nhóm ưu tiên
            // → bỏ chọn nhóm ưu tiên
            // → KHÔNG đụng các nhóm khác
            // --------------------------------

            if (
                allPrioritySelected
            ) {

                return normalizedIds.filter(
                    (id) =>
                        !priorityIds.includes(
                            id
                        )
                );
            }


            // --------------------------------
            // Chưa chọn hết
            // → thêm toàn bộ nhóm ưu tiên
            // --------------------------------

            return Array.from(
                new Set([
                    ...normalizedIds,
                    ...priorityIds,
                ])
            );
        }
    );
}


// ==========================================
// CHỌN / BỎ CHỌN TẤT CẢ CÁC NHÓM
// ==========================================

function handleToggleAllAllowedGroups() {

    const allIds =
        allowedGroups.map(
            (group) =>
                String(group.id)
        );


    if (
        allIds.length === 0
    ) {

        return;
    }


    setSelectedGroupIds(
        (currentIds) => {

            const normalizedIds =
                currentIds.map(
                    (id) =>
                        String(id)
                );


            const allSelected =
                allIds.every(
                    (id) =>
                        normalizedIds.includes(
                            id
                        )
                );


            if (
                allSelected
            ) {

                return [];
            }


            return Array.from(
                new Set(
                    allIds
                )
            );
        }
    );
}


// ==========================================
// BỎ CHỌN TẤT CẢ
// ==========================================

function handleClearSelectedGroups() {

    setSelectedGroupIds([]);

}

    // ==========================================
    // BỎ CHỌN TẤT CẢ
    // ==========================================

    function handleClearSelectedGroups() {

        setSelectedGroupIds([]);
    }


    // ==========================================
    // CHƯA CÓ XE
    // ==========================================

    if (!postingCar) {

        return (

            <main className="content">

                <h1>
                    🚀 Facebook Posting
                </h1>


                <SectionCard
                    title="⚠️ Chưa có xe"
                >

                    <p>
                        Chưa có chiếc xe nào
                        được chọn để đăng.
                    </p>


                    <PrimaryButton
                        onClick={() =>
                            navigate(
                                "/cars"
                            )
                        }
                    >
                        🚗 Quay lại danh sách xe
                    </PrimaryButton>

                </SectionCard>

            </main>
        );
    }


    // ==========================================
    // ẢNH XE
    // ==========================================

    const images =
        Array.isArray(
            postingCar.images
        )
            ? postingCar.images
            : [];


    function getImageSrc(
        image
    ) {

        if (
            typeof image ===
            "string"
        ) {

            return image;
        }


        return (
            image?.preview ||
            ""
        );
    }


    // ==========================================
    // TẠO FACEBOOK CONTENT BẰNG AI
    // ==========================================

    async function handleGenerateAI() {

        if (generatingAI) {
            return;
        }


        if (!postingCar) {

            alert(
                "⚠️ Chưa có xe để tạo nội dung."
            );

            return;
        }


        try {

            setGeneratingAI(
                true
            );


            const result =
                await generateFacebookPost(
                    postingCar
                );


            let generatedContent =
                "";


            if (
                typeof result ===
                "string"
            ) {

                generatedContent =
                    result;

            } else if (
                result?.content
            ) {

                generatedContent =
                    result.content;

            } else if (
                result?.text
            ) {

                generatedContent =
                    result.text;

            } else if (
                result?.facebook
            ) {

                generatedContent =
                    result.facebook;
            }


            if (
                !generatedContent?.trim()
            ) {

                throw new Error(
                    "AI không trả về nội dung Facebook."
                );
            }


            setContent(
                generatedContent.trim()
            );

            // Lưu lại bản AI gốc để sau này so sánh
            // với bản ông sửa, phục vụ học văn phong.
            setAiOriginalContent(
                generatedContent.trim()
            );


            alert(
                "🤖 Đã tạo nội dung Facebook bằng AI."
            );

        } catch (error) {

            console.error(
                "Lỗi tạo Facebook AI:",
                error
            );


            alert(
                "❌ Không thể tạo nội dung Facebook:\n\n" +
                    (
                        error?.message ||
                        "Lỗi không xác định."
                    )
            );

        } finally {

            setGeneratingAI(
                false
            );
        }
    }


    // ==========================================
    // TẠO CAMPAIGN + NHIỀU JOB VÀO QUEUE
    // ==========================================
    //
    // Một lần bấm = một Campaign.
    // Tất cả Job của lần này dùng chung campaignId.
    //
    // Campaign A đang chạy không ảnh hưởng việc
    // ông tạo Campaign B sau đó.
    //

    async function handleAddBulkToQueue() {

        if (!selectedAccount) {

            alert(
                "⚠️ Chưa chọn tài khoản Facebook."
            );

            return;
        }


        if (
            selectedAccount.status !==
            "active"
        ) {

            alert(
                "⚠️ Tài khoản Facebook hiện không hoạt động."
            );

            return;
        }


        if (
            selectedGroups.length ===
            0
        ) {

            alert(
                "⚠️ Chưa chọn nhóm Facebook."
            );

            return;
        }


        if (
            images.length ===
            0
        ) {

            alert(
                "⚠️ Xe chưa có ảnh."
            );

            return;
        }


        if (
            !content.trim()
        ) {

            alert(
                "⚠️ Chưa có nội dung Facebook.\n\n" +
                "Ông hãy bấm 'Tạo nội dung bằng AI' " +
                "hoặc nhập nội dung thủ công."
            );

            return;
        }



        const carLabel =
            `${postingCar.brand || ""} ` +
            `${postingCar.model || ""} ` +
            `${postingCar.version || ""}`.trim();


        const confirmed =
            window.confirm(

                `🚀 Tạo Campaign Facebook?\n\n` +

                `🚗 Xe: ${carLabel}\n` +

                `👤 Facebook: ${selectedAccount.name}\n` +

                `👥 Số nhóm: ${selectedGroups.length}\n` +

               `📷 Ảnh: ${images.length}\n` +


`Các Job sẽ được xếp vào Queue ` +
`và mang cùng một Campaign ID.`

            );


        if (!confirmed) {
            return;
        }


        try {

            setAddingToQueue(
                true
            );


            // ==========================================
            // HỌC VĂN PHONG TỪ LẦN SỬA NÀY
            // ==========================================
            //
            // So sánh bản AI viết gốc với bản ông vừa
            // sửa (content hiện tại). Chạy ngầm, không
            // chặn luồng tạo Campaign nếu lỗi.
            // ==========================================

            if (aiOriginalContent) {

                learnFromEdit({
                    original: aiOriginalContent,
                    edited: content.trim(),
                    carId: postingCar.id,
                }).catch((error) => {
                    console.error(
                        "Lỗi học văn phong cá nhân:",
                        error
                    );
                });
            }


// ==========================================
// VARIATION ENGINE V2
// ==========================================
//
// Mục tiêu:
// - Mỗi Job có nội dung Facebook riêng.
// - Không gọi AI lại cho từng Job.
// - Nội dung được tạo deterministic từ bài AI gốc.
// - Retry không tạo lại nội dung.
// - Ảnh và nội dung đều được khóa trong Campaign.
// ==========================================

function createSeededRandom(seed) {

    let value = Number(seed) || 1;

    return function () {

        value =
            (value * 9301 + 49297) %
            233280;

        return value / 233280;
    };
}


// ==========================================
// SHUFFLE ẢNH
// ==========================================

function shuffleIndexes(
    count,
    seed
) {

    const indexes =
        Array.from(
            { length: count },
            (_, index) => index
        );

    const random =
        createSeededRandom(seed);


    for (
        let i = indexes.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                random() * (i + 1)
            );


        [
            indexes[i],
            indexes[j],
        ] = [
            indexes[j],
            indexes[i],
        ];
    }


    return indexes;
}


// ==========================================
// CHUẨN HÓA CONTENT
// ==========================================

function normalizeContent(
    value
) {

    return String(
        value || ""
    )
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}


// ==========================================
// TÁCH NỘI DUNG THÀNH CÁC BLOCK
// ==========================================

function splitContentBlocks(
    content
) {

    return normalizeContent(
        content
    )
        .split(/\n\s*\n/)
        .map(
            (item) =>
                item.trim()
        )
        .filter(Boolean);
}


// ==========================================
// HOÁN ĐỔI BLOCK CONTENT
// ==========================================
//
// Không phá nội dung gốc.
// Chỉ đổi thứ tự các đoạn để bài
// không giống hệt nhau.
// ==========================================

function reorderContentBlocks(
    blocks,
    variantIndex
) {

    if (
        !Array.isArray(blocks) ||
        blocks.length <= 1
    ) {

        return blocks;
    }


    const result =
        [...blocks];


    const mode =
        variantIndex % 5;


    // V1: giữ nguyên
    if (mode === 0) {

        return result;
    }


    // V2: đoạn cuối lên đầu
    if (mode === 1) {

        return [
            result[result.length - 1],
            ...result.slice(
                0,
                result.length - 1
            ),
        ];
    }


    // V3: đoạn thứ 2 lên đầu
    if (mode === 2) {

        return [
            result[1],
            result[0],
            ...result.slice(2),
        ];
    }


    // V4: đảo thứ tự
    if (mode === 3) {

        return [
            ...result,
        ].reverse();
    }


    // V5: đoạn đầu xuống cuối
    return [
        ...result.slice(1),
        result[0],
    ];
}


// ==========================================
// HOOKS
// ==========================================

const FACEBOOK_VARIATION_HOOKS = [

    "🚗 Một chiếc xe đáng xem dành cho các bác đang tìm xe đẹp, lịch sử rõ ràng:",

    "🔥 Hôm nay em giới thiệu tới các bác một chiếc xe rất đáng cân nhắc:",

    "👀 Các bác đang tìm một chiếc xe vừa đẹp vừa yên tâm về chất lượng thì xem em này nhé:",

    "💥 Xe đẹp không thiếu, nhưng một chiếc xe có lịch sử rõ ràng và được kiểm định kỹ càng thì đáng để quan tâm hơn:",

    "✨ Thêm một lựa chọn rất sáng giá cho các bác đang tìm xe đã qua sử dụng:",

    "🚘 Nếu các bác đang săn một chiếc xe đẹp, chạy ít và nguồn gốc rõ ràng thì đừng bỏ qua em này:",

    "📌 Một chiếc xe vừa về, ngoại hình và thông tin xe đều rất đáng chú ý:",

    "😍 Nhìn thực tế chiếc xe này ngoài đời còn đẹp hơn trên ảnh các bác ạ:",

    "🔎 Các bác mua xe cũ quan tâm nhất điều gì? Lịch sử xe, chất lượng hay giá? Chiếc này có khá nhiều điểm cộng:",

    "💯 Thêm một chiếc xe chất lượng đang có mặt tại Toyota Sure:",

    "🚘 Tìm xe cũ nhưng muốn sự yên tâm như mua xe chính hãng? Các bác tham khảo chiếc này:",

    "⭐ Chiếc xe hôm nay em muốn giới thiệu với các bác có một loạt điểm rất đáng tiền:",

    "🔥 Một lựa chọn đáng xem cho các bác đang chuẩn bị xuống tiền mua xe:",

    "📣 Xe đẹp về hàng rồi các bác ơi! Thông tin chi tiết em để ngay dưới đây:",

    "🎯 Nếu tiêu chí của các bác là xe đẹp - lịch sử rõ - kiểm định kỹ thì chiếc này rất đáng xem:",

    "🚗 Có những chiếc xe nhìn qua đã thấy ưng, và đây là một trong số đó:",

    "💎 Một chiếc xe rất phù hợp cho các bác muốn mua xe đã qua sử dụng nhưng vẫn đặt yếu tố chất lượng lên đầu:",

    "📋 Thông tin một chiếc xe đang được quan tâm tại Toyota Sure:",

    "🔔 Các bác đang tìm xe trong tầm này nhớ tham khảo thêm chiếc này trước khi quyết định:",

    "🏆 Một ứng viên rất đáng để đưa vào danh sách xe cần xem trực tiếp:"
];

// ==========================================
// CTA
// ==========================================

const FACEBOOK_VARIATION_CTA = [

    "📞 Chi tiết liên hệ Cương đẹp zai: 0933.666.980",

    "☎️ Các bác quan tâm inbox hoặc liên hệ Cương đẹp zai: 0933.666.980",

    "👉 Muốn xem thêm ảnh và thông tin chi tiết, liên hệ Cương đẹp zai: 0933.666.980",

    "📲 Quan tâm chiếc này cứ liên hệ Cương đẹp zai: 0933.666.980",

    "🚗 Các bác muốn xem xe trực tiếp, liên hệ Cương đẹp zai: 0933.666.980",

    "💬 Cần tư vấn thêm về xe, cứ inbox hoặc gọi Cương đẹp zai: 0933.666.980",

    "📞 Chi tiết xe và giá bán, các bác liên hệ Cương đẹp zai: 0933.666.980",

    "👉 Bác nào đang tìm đúng mẫu này thì liên hệ Cương đẹp zai: 0933.666.980",

    "🏁 Quan tâm xe thì liên hệ Cương đẹp zai để được gửi thông tin chi tiết: 0933.666.980",

    "📲 Cần video chi tiết hoặc muốn xem xe trực tiếp, liên hệ Cương đẹp zai: 0933.666.980",

    "☎️ Toyota Sure sẵn sàng hỗ trợ các bác. Liên hệ Cương đẹp zai: 0933.666.980",

    "💬 Các bác có câu hỏi gì về chiếc xe này cứ inbox Cương đẹp zai: 0933.666.980",

    "🚘 Muốn xem xe tận mắt, liên hệ Cương đẹp zai: 0933.666.980",

    "📞 Bác nào quan tâm em gửi thêm ảnh và thông tin chi tiết: 0933.666.980",

    "👉 Đừng chỉ nhìn ảnh, các bác qua xem thực tế sẽ thấy chiếc này rất đáng cân nhắc. Liên hệ Cương đẹp zai: 0933.666.980",

    "📲 Quan tâm xe thì inbox Cương đẹp zai: 0933.666.980",

    "☎️ Cần báo giá chi tiết hoặc phương án tài chính, liên hệ Cương đẹp zai: 0933.666.980",

    "🚗 Xe có sẵn, các bác quan tâm cứ liên hệ Cương đẹp zai: 0933.666.980",

    "💬 Bác nào đang tìm chiếc tương tự cứ nhắn Cương đẹp zai: 0933.666.980",

    "🏆 Quan tâm chiếc xe này thì liên hệ Cương đẹp zai để xem xe và kiểm tra trực tiếp nhé: 0933.666.980",
];

// ==========================================
// GIÁ TEASER
// ==========================================
//
// Không đưa giá chính xác vào Facebook.
// Ví dụ:
// 468 → 4xx
// 525 → 5xx
// 685 → 6xx
// ==========================================

function getPriceTeaser(price) {

    const numericPrice =
        Number(price);

    if (
        !Number.isFinite(numericPrice) ||
        numericPrice <= 0
    ) {
        return "";
    }

    const hundredMillion =
        Math.floor(
            numericPrice / 100
        );

    return `${hundredMillion}xx`;
}


// ==========================================
// TẠO CONTENT VARIANT
// ==========================================

function buildContentVariant({
    baseContent,
    car,
    variantIndex,
    contentVariant,
}) {

    const rawContent =
    normalizeContent(
        baseContent
    );


// ======================================
// XÓA GIÁ CHÍNH XÁC
// ======================================
//
// 568 triệu → được loại khỏi nội dung
// 568tr → được loại
// 568.000.000 → được loại
// ======================================

const normalized =
    rawContent
        .replace(
            /\b\d{3,4}(?:[.,]\d{3})*(?:\s*)(?:triệu|tr|vnđ|vnd)\b/gi,
            ""
        )
        .replace(
            /\b\d{3,4}(?:[.,]\d{3}){2}\b/gi,
            ""
        )
        .replace(
            /💰\s*giá\s*(?:bán\s*)?:?\s*/gi,
            ""
        )
        .replace(
            /\n{3,}/g,
            "\n\n"
        )
        .trim();


    if (!normalized) {

        return "";
    }


    const blocks =
        splitContentBlocks(
            normalized
        );


    const orderedBlocks =
        reorderContentBlocks(
            blocks,
            variantIndex
        );


    const hook =
        FACEBOOK_VARIATION_HOOKS[
            variantIndex %
            FACEBOOK_VARIATION_HOOKS.length
        ];


    const cta =
        FACEBOOK_VARIATION_CTA[
            (
                variantIndex * 7 +
                contentVariant
            ) %
            FACEBOOK_VARIATION_CTA.length
        ];


    const carLabel =
        [
            car?.brand,
            car?.model,
            car?.version,
        ]
            .filter(Boolean)
            .join(" ")
            .trim();


    // --------------------------------------
    // Dòng nhận diện xe
    // --------------------------------------

    const vehicleLine =
    carLabel
        ? `🚗 ${carLabel}`
        : "";


// ======================================
// GIÁ TEASER
// ======================================

const priceTeaser =
    getPriceTeaser(
        car?.price
    );

const priceLine =
    priceTeaser
        ? `💰 Giá chỉ ${priceTeaser} – chi tiết liên hệ Cương đẹp zai: 0933.666.980`
        : "";

    // --------------------------------------
    // Tạo bài
    // --------------------------------------

    const result = [

    hook,

    vehicleLine,

    ...orderedBlocks,

    priceLine,

    cta,

]
    .filter(Boolean)
    .join("\n\n");


    return normalizeContent(
        result
    );
}


// ==========================================
// CREATE VARIATION PLAN
// ==========================================

function createVariationPlan(
    groups,
    imageTotal,
    baseContent,
    car,
    campaignSeed = Date.now()
) {

    if (
        !Array.isArray(groups) ||
        groups.length === 0
    ) {

        return [];
    }


    if (
        !imageTotal ||
        imageTotal <= 0
    ) {

        return [];
    }


    if (
        !baseContent?.trim()
    ) {

        return [];
    }


    return groups.map(
        (
            group,
            index
        ) => {

            // ----------------------------------
            // Seed riêng cho từng Job
            // ----------------------------------

            const variationSeed =
                Number(
                    campaignSeed
                ) +
                index * 7919;


            const random =
                createSeededRandom(
                    variationSeed
                );


            // ----------------------------------
            // Số ảnh
            // ----------------------------------

            const minimumImages =
                imageTotal >= 6
                    ? 6
                    : imageTotal;


            let imageCount =
                minimumImages;


            if (
                imageTotal >
                minimumImages
            ) {

                const range =
                    imageTotal -
                    minimumImages +
                    1;


                imageCount =
                    minimumImages +
                    Math.floor(
                        random() *
                        range
                    );
            }


            // ----------------------------------
            // Thứ tự ảnh
            // ----------------------------------

            let imageIndexes =
                shuffleIndexes(
                    imageTotal,
                    variationSeed
                );


            imageIndexes =
                imageIndexes.slice(
                    0,
                    imageCount
                );


            // ----------------------------------
            // Content Variant
            // ----------------------------------
            //
            // 1-5 = nhóm phong cách
            // variantIndex = Job cụ thể
            // ----------------------------------

            const contentVariant =
                (index % 5) + 1;


            const variantIndex =
                index;


            const variantContent =
                buildContentVariant({
                    baseContent,
                    car,
                    variantIndex,
                    contentVariant,
                });


            return {

                groupId:
                    String(
                        group.id
                    ),

                contentVariant,

                variantIndex,

                content:
                    variantContent,

                imageIndexes,

                imageCount,

            };
        }
    );
}


            // ======================================
            // 1. TẠO CAMPAIGN
            // ======================================

const variationPlan =
    createVariationPlan(
        selectedGroups,
        images.length,
        content.trim(),
        postingCar
    );

console.log(
    "🎨 Campaign Variation Plan:",
    variationPlan
);

            const campaign =
                await createCampaign({

                    car:
                        postingCar,

                    account:
                        selectedAccount,

                    selectedGroups:
                        selectedGroups.map(
                            (group) => ({
                                ...group,

                                matchScore:
                                    group.matchScore ||
                                    0,
                            })
                        ),

                    content:
                        content.trim(),

                    imageCount:
                        images.length,

                        variationPlan:
    variationPlan,

                });


            console.log(
                "✅ Facebook Campaign Created:",
                campaign
            );


            // ======================================
            // 2. TẠO CÁC QUEUE JOB
            // ======================================

            const createdJobs = [];


            for (
                const currentGroup of selectedGroups
            ) {

const variation =
    variationPlan.find(
        (item) =>
            String(
                item.groupId
            ) ===
            String(
                currentGroup.id
            )
    );


if (!variation) {

    throw new Error(
        `Không tạo được Variation cho nhóm: ${currentGroup.name}`
    );
}


const job =
    await addToPostingQueue({

        // ----------------------------------
        // CAMPAIGN
        // ----------------------------------

        campaignId:
            campaign.id,


        // ----------------------------------
        // XE
        // ----------------------------------

        carId:
            postingCar.id,


        // ----------------------------------
        // GROUP
        // ----------------------------------

        group: {

            ...currentGroup,

            matchScore:
                currentGroup.matchScore ||
                0,

        },


        // ----------------------------------
        // ⭐ CONTENT RIÊNG CỦA JOB
        // ----------------------------------

        content:
            variation.content ||
            content.trim(),


        // ----------------------------------
        // ẢNH RIÊNG
        // ----------------------------------

        imageCount:
            variation.imageCount ||
            images.length,


        // ----------------------------------
        // ACCOUNT
        // ----------------------------------

        accountId:
            String(selectedAccountId || ""),


        // ----------------------------------
        // VARIATION
        // ----------------------------------

        variation:

            variation,

    });

                createdJobs.push(
                    job
                );
            }


            // ======================================
            // 3. GẮN JOB IDS VÀO CAMPAIGN
            // ======================================

            const jobIds =
                createdJobs.map(
                    (job) =>
                        String(
                            job.id
                        )
                );


            await attachCampaignJobs(
                campaign.id,
                jobIds
            );


            // ======================================
            // 4. CAMPAIGN ĐÃ SẴN SÀNG CHỜ QUEUE
            // ======================================

            await setCampaignStatus(
                campaign.id,
                "queued"
            );


            console.log(
                "✅ Facebook Campaign Queue Created:",
                {
                    campaignId:
                        campaign.id,

                    jobIds,
                }
            );


            // ======================================
            // 5. THÔNG BÁO
            // ======================================

            alert(

                "✅ Đã tạo Campaign thành công!\n\n" +

                `🚗 Xe: ${carLabel}\n` +

                `👤 Facebook: ${selectedAccount.name}\n` +

                `👥 ${createdJobs.length} nhóm\n` +

                `🆔 Campaign: ${campaign.id}\n\n` +

                "Các bài đang ở trạng thái CHỜ ĐĂNG."

            );


            navigate(
                "/facebook/queue"
            );


        } catch (error) {

            console.error(
                "❌ Lỗi tạo Facebook Campaign:",
                error
            );


            alert(

                "❌ Không thể tạo Campaign:\n\n" +

                (
                    error?.message ||
                    "Lỗi không xác định."
                )

            );

        } finally {

            setAddingToQueue(
                false
            );

        }
    }


    // ==========================================
    // RENDER
    // ==========================================

    return (

        <main className="content">

            <h1>
                🚀 Facebook Posting
            </h1>


            <p
                style={{
                    color: "#666",
                    marginTop: 0,
                }}
            >
                Chọn một Facebook và nhiều hội nhóm.
                ToyotaSureHub sẽ tự tạo Queue cho từng nhóm.
            </p>


            {/* =================================
                XE
            ================================= */}

            <SectionCard
                title="🚗 Xe đang đăng"
            >

                <h2>
                    {
                        postingCar.brand
                    }{" "}
                    {
                        postingCar.model
                    }
                </h2>


                <p>
                    {
                        postingCar.version
                    }
                    {" · "}
                    {
                        postingCar.year
                    }
                    {postingCar.color
                        ? ` · ${postingCar.color}`
                        : ""}
                </p>

            </SectionCard>


            {/* =================================
                ACCOUNT
            ================================= */}

            <SectionCard
                title="👤 1. Chọn tài khoản Facebook"
            >

                {accounts.length ===
                0 ? (

                    <div>

                        <p>
                            ⚠️ Chưa có tài khoản
                            Facebook nào.
                        </p>


                        <PrimaryButton
                            onClick={() =>
                                navigate(
                                    "/facebook/accounts"
                                )
                            }
                        >
                            👤 Quản lý tài khoản Facebook
                        </PrimaryButton>

                    </div>

                ) : (

                    <div
                        style={{
                            maxWidth:
                                "700px",
                        }}
                    >

                        <select
                            value={
                                selectedAccountId
                            }
                            onChange={(e) =>
                                setSelectedAccountId(
                                    e.target.value
                                )
                            }
                            style={{
                                width:
                                    "100%",

                                padding:
                                    "12px",

                                border:
                                    "1px solid #ccc",

                                borderRadius:
                                    "8px",

                                fontSize:
                                    "16px",

                                boxSizing:
                                    "border-box",

                                background:
                                    "#fff",
                            }}
                        >

                            <option value="">
                                -- Chọn tài khoản Facebook --
                            </option>


                            {accounts.map(
                                (
                                    account
                                ) => (

                                    <option
                                        key={
                                            account.id
                                        }
                                        value={
                                            account.id
                                        }
                                    >

                                        {
                                            account.name
                                        }

                                        {account.isDefault
                                            ? " ⭐ Mặc định"
                                            : ""}

                                        {account.status !==
                                        "active"
                                            ? " 🔴 Không hoạt động"
                                            : ""}

                                    </option>

                                )
                            )}

                        </select>


                        {selectedAccount && (

                            <div
                                style={{
                                    marginTop:
                                        "12px",

                                    padding:
                                        "12px",

                                    background:
                                        "#f5f5f5",

                                    borderRadius:
                                        "8px",
                                }}
                            >

                                <div>
                                    👤{" "}
                                    <strong>
                                        {
                                            selectedAccount.name
                                        }
                                    </strong>
                                </div>


                                <div>
                                    🟢 Trạng thái:{" "}
                                    {
                                        selectedAccount.status
                                    }
                                </div>


                                <div>
                                    👥 Quyền nhóm:{" "}

                                    {selectedAccount.allowAllGroups !==
                                    false
                                        ? selectedAccount.excludedGroupIds?.length >
                                          0
                                            ? "Tất cả nhóm, trừ một số nhóm"
                                            : "Tất cả các nhóm"
                                        : "Chỉ nhóm được chọn"}
                                </div>


                                <div
                                    style={{
                                        marginTop:
                                            "6px",
                                        fontWeight:
                                            "600",
                                    }}
                                >
                                    📊 Được phép đăng:
                                    {" "}
                                    {
                                        allowedGroups.length
                                    }
                                    {" "}
                                    nhóm
                                </div>

                            </div>

                        )}

                    </div>

                )}

            </SectionCard>


           {/* =================================
    GROUP SELECTOR
================================= */}

<SectionCard
    title="👥 2. Chọn các nhóm muốn đăng"
>

    {!selectedAccount ? (

        <p>
            ⚠️ Hãy chọn tài khoản Facebook
            trước.
        </p>

    ) : allowedGroups.length === 0 ? (

        <div
            style={{
                padding: "14px",
                background: "#fff3cd",
                border:
                    "1px solid #ffe69c",
                borderRadius: "8px",
            }}
        >

            <strong>
                🚫 Tài khoản này chưa được
                phép đăng vào nhóm nào.
            </strong>

            <p
                style={{
                    marginBottom: 0,
                    color: "#666",
                }}
            >
                Vào Facebook Accounts để
                thiết lập quyền nhóm.
            </p>

        </div>

    ) : (

        <>

            {/* =================================
                SUMMARY
            ================================== */}

            <div
                style={{
                    marginBottom: "16px",
                    padding: "12px",
                    background: "#f5f5f5",
                    borderRadius: "8px",
                }}
            >

                👥{" "}
                <strong>
                    Đã chọn:
                </strong>{" "}

                <strong
                    style={{
                        color:
                            selectedGroupIds.length > 0
                                ? "#1976d2"
                                : "#666",
                    }}
                >
                    {
                        selectedGroupIds.length
                    }
                </strong>

                {" / "}

                {
                    allowedGroups.length
                }

                {" nhóm"}

            </div>


            {/* =================================
                ⭐ NHÓM ƯU TIÊN
            ================================== */}

            <div
                style={{
                    border:
                        "2px solid #f0c36d",
                    borderRadius: "10px",
                    padding: "14px",
                    marginBottom: "18px",
                    background: "#fffaf0",
                }}
            >

                <div
                    style={{
                        display: "flex",
                        justifyContent:
                            "space-between",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap",
                        marginBottom: "12px",
                    }}
                >

                    <div>

                        <h3
                            style={{
                                margin:
                                    "0 0 4px 0",
                            }}
                        >
                            ⭐ Nhóm ưu tiên
                        </h3>

                        <div
                            style={{
                                color: "#666",
                                fontSize: "13px",
                            }}
                        >
                            Top 20 nhóm có độ phù hợp
                            cao nhất với xe này.
                        </div>

                    </div>


                    <PrimaryButton
                        onClick={
                            handleToggleAllPriorityGroups
                        }
                    >
                        {
                            priorityGroups.length > 0 &&
                            priorityGroups.every(
                                (group) =>
                                    selectedGroupIds.some(
                                        (id) =>
                                            String(id) ===
                                            String(group.id)
                                    )
                            )
                                ? "⬜ Bỏ chọn nhóm ưu tiên"
                                : "☑ Chọn tất cả nhóm ưu tiên"
                        }
                    </PrimaryButton>

                </div>


                {priorityGroups.length === 0 ? (

                    <p
                        style={{
                            color: "#777",
                        }}
                    >
                        Không có nhóm ưu tiên.
                    </p>

                ) : (

                    <div
                        style={{
                            display: "grid",
                            gap: "8px",

                            // Hiện khoảng 5 nhóm,
                            // các nhóm còn lại cuộn.
                            maxHeight: "390px",

                            overflowY: "auto",

                            paddingRight: "4px",
                        }}
                    >

                        {priorityGroups.map(
                            (group, index) => {

                                const isSelected =
                                    selectedGroupIds.some(
                                        (id) =>
                                            String(id) ===
                                            String(group.id)
                                    );


                                return (

                                    <label
                                        key={
                                            group.id
                                        }
                                        style={{
                                            display:
                                                "flex",

                                            alignItems:
                                                "center",

                                            gap:
                                                "10px",

                                            padding:
                                                "10px",

                                            border:
                                                isSelected
                                                    ? "2px solid #1976d2"
                                                    : "1px solid #ddd",

                                            borderRadius:
                                                "8px",

                                            background:
                                                isSelected
                                                    ? "#eaf3ff"
                                                    : "#fff",

                                            cursor:
                                                "pointer",
                                        }}
                                    >

                                        <input
                                            type="checkbox"

                                            checked={
                                                isSelected
                                            }

                                            onChange={() =>
                                                toggleGroup(
                                                    group.id
                                                )
                                            }

                                            style={{
                                                width:
                                                    "19px",

                                                height:
                                                    "19px",

                                                flexShrink:
                                                    0,
                                            }}
                                        />


                                        <div
                                            style={{
                                                flex: 1,
                                            }}
                                        >

                                            <div
                                                style={{
                                                    fontWeight:
                                                        "600",
                                                }}
                                            >

                                                ⭐{" "}
                                                {index + 1}.
                                                {" "}
                                                {group.name}

                                            </div>


                                            <div
                                                style={{
                                                    marginTop:
                                                        "4px",

                                                    fontSize:
                                                        "13px",

                                                    color:
                                                        "#666",
                                                }}
                                            >

                                                🎯 Độ phù hợp:
                                                {" "}

                                                <strong
                                                    style={{
                                                        color:
                                                            "#d48806",
                                                    }}
                                                >
                                                    {
                                                        group.matchScore
                                                    }%
                                                </strong>

                                                {" · "}

                                                📌 Đã đăng:
                                                {" "}
                                                {
                                                    group.totalPosts ||
                                                    0
                                                }

                                            </div>

                                        </div>

                                    </label>

                                );
                            }
                        )}

                    </div>

                )}

            </div>


            {/* =================================
                📋 TẤT CẢ CÁC NHÓM
            ================================== */}

            <div
                style={{
                    border:
                        "1px solid #ddd",
                    borderRadius: "10px",
                    padding: "14px",
                    background: "#fff",
                }}
            >

                <div
                    style={{
                        display: "flex",
                        justifyContent:
                            "space-between",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap",
                        marginBottom: "12px",
                    }}
                >

                    <div>

                        <h3
                            style={{
                                margin:
                                    "0 0 4px 0",
                            }}
                        >
                            📋 Tất cả các nhóm
                        </h3>

                        <div
                            style={{
                                color: "#666",
                                fontSize: "13px",
                            }}
                        >
                            Tìm và tích thêm bất kỳ
                            nhóm nào ông muốn.
                        </div>

                    </div>


                    <PrimaryButton
                        onClick={
                            handleToggleAllAllowedGroups
                        }
                    >
                        {
                            allowedGroups.length > 0 &&
                            allowedGroups.every(
                                (group) =>
                                    selectedGroupIds.some(
                                        (id) =>
                                            String(id) ===
                                            String(group.id)
                                    )
                            )
                                ? "⬜ Bỏ chọn tất cả"
                                : "☑ Chọn tất cả các nhóm"
                        }
                    </PrimaryButton>

                </div>


                {/* =================================
                    SEARCH
                ================================== */}

                <input
                    type="text"
                    value={
                        groupSearch
                    }
                    onChange={(e) =>
                        setGroupSearch(
                            e.target.value
                        )
                    }
                    placeholder="🔎 Tìm tên nhóm..."
                    style={{
                        width: "100%",
                        padding: "11px",
                        border:
                            "1px solid #ccc",
                        borderRadius: "8px",
                        fontSize: "15px",
                        boxSizing:
                            "border-box",
                        marginBottom:
                            "12px",
                    }}
                />


                {groupSearch && (

                    <div
                        style={{
                            marginBottom:
                                "10px",
                            color: "#666",
                            fontSize: "13px",
                        }}
                    >
                        🔎 Tìm thấy{" "}
                        <strong>
                            {
                                filteredGroups.length
                            }
                        </strong>
                        {" "}nhóm
                    </div>

                )}


                {/* =================================
                    ALL GROUP LIST
                ================================== */}

                <div
                    style={{
                        display: "grid",
                        gap: "8px",

                        maxHeight:
                            "500px",

                        overflowY:
                            "auto",

                        paddingRight:
                            "4px",
                    }}
                >

                    {filteredGroups.length ===
                    0 ? (

                        <p
                            style={{
                                color:
                                    "#777",
                            }}
                        >
                            🔎 Không tìm thấy
                            nhóm phù hợp.
                        </p>

                    ) : (

                        filteredGroups.map(
                            (group) => {

                                const isSelected =
                                    selectedGroupIds.some(
                                        (id) =>
                                            String(id) ===
                                            String(group.id)
                                    );


                                const score =
                                    getGroupScore(
                                        group
                                    );


                                return (

                                    <label
                                        key={
                                            group.id
                                        }
                                        style={{
                                            display:
                                                "flex",

                                            alignItems:
                                                "center",

                                            gap:
                                                "10px",

                                            padding:
                                                "10px",

                                            border:
                                                isSelected
                                                    ? "2px solid #1976d2"
                                                    : "1px solid #ddd",

                                            borderRadius:
                                                "8px",

                                            background:
                                                isSelected
                                                    ? "#eaf3ff"
                                                    : "#fff",

                                            cursor:
                                                "pointer",
                                        }}
                                    >

                                        <input
                                            type="checkbox"

                                            checked={
                                                isSelected
                                            }

                                            onChange={() =>
                                                toggleGroup(
                                                    group.id
                                                )
                                            }

                                            style={{
                                                width:
                                                    "19px",

                                                height:
                                                    "19px",

                                                flexShrink:
                                                    0,
                                            }}
                                        />


                                        <div
                                            style={{
                                                flex: 1,
                                            }}
                                        >

                                            <div
                                                style={{
                                                    fontWeight:
                                                        "600",
                                                }}
                                            >
                                                👥{" "}
                                                {
                                                    group.name
                                                }
                                            </div>


                                            <div
                                                style={{
                                                    marginTop:
                                                        "4px",

                                                    fontSize:
                                                        "13px",

                                                    color:
                                                        "#666",
                                                }}
                                            >

                                                🎯{" "}
                                                {score}%

                                                {" · "}

                                                📌 Đã đăng:
                                                {" "}

                                                {
                                                    group.totalPosts ||
                                                    0
                                                }

                                                {" · "}

                                                🟢{" "}
                                                {
                                                    group.status ||
                                                    "active"
                                                }

                                            </div>

                                        </div>

                                    </label>

                                );
                            }
                        )

                    )}

                </div>

            </div>

        </>

    )}

</SectionCard>


            {/* =================================
                ẢNH XE
            ================================= */}

            <SectionCard
                title="📷 3. Ảnh xe"
            >

                {images.length ===
                0 ? (

                    <p>
                        ⚠️ Xe này chưa có ảnh.
                    </p>

                ) : (

                    <div
                        style={{
                            display:
                                "grid",

                            gridTemplateColumns:
                                "repeat(auto-fill, minmax(150px, 1fr))",

                            gap:
                                "12px",
                        }}
                    >

                        {images.map(
                            (
                                image,
                                index
                            ) => {

                                const src =
                                    getImageSrc(
                                        image
                                    );


                                return (

                                    <div
                                        key={
                                            index
                                        }
                                        style={{
                                            border:
                                                "1px solid #ddd",

                                            borderRadius:
                                                "10px",

                                            overflow:
                                                "hidden",

                                            background:
                                                "#fff",
                                        }}
                                    >

                                        <img
                                            src={
                                                src
                                            }
                                            alt={`Ảnh xe ${
                                                index +
                                                1
                                            }`}
                                            style={{
                                                width:
                                                    "100%",

                                                height:
                                                    "150px",

                                                objectFit:
                                                    "cover",

                                                display:
                                                    "block",
                                            }}
                                        />

                                    </div>

                                );
                            }
                        )}

                    </div>

                )}

            </SectionCard>


            {/* =================================
                FACEBOOK CONTENT
            ================================= */}

            <SectionCard
                title="📝 4. Nội dung Facebook"
            >

                <div
                    style={{
                        display:
                            "flex",

                        gap:
                            "10px",

                        flexWrap:
                            "wrap",

                        marginBottom:
                            "12px",
                    }}
                >

                    <PrimaryButton
                        onClick={
                            handleGenerateAI
                        }
                        disabled={
                            generatingAI
                        }
                    >
                        {generatingAI
                            ? "⏳ AI đang viết..."
                            : content.trim()
                                ? "🔄 TẠO LẠI BẰNG AI"
                                : "🤖 TẠO NỘI DUNG BẰNG AI"}
                    </PrimaryButton>


                    {content.trim() && (

                        <PrimaryButton
                            onClick={() =>
                                setContent("")
                            }
                            disabled={
                                generatingAI
                            }
                            style={{
                                background:
                                    "#777",
                            }}
                        >
                            🗑️ Xóa nội dung
                        </PrimaryButton>

                    )}

                </div>


                {!content.trim() && (

                    <div
                        style={{
                            marginBottom:
                                "12px",

                            padding:
                                "12px",

                            background:
                                "#fff8e1",

                            border:
                                "1px solid #ffe082",

                            borderRadius:
                                "8px",
                        }}
                    >

                        💡 Xe này chưa có nội dung
                        Facebook. Ông có thể bấm{" "}
                        <strong>
                            "Tạo nội dung bằng AI"
                        </strong>
                        {" "}hoặc tự nhập nội dung.

                    </div>

                )}


                <textarea
                    value={
                        content
                    }
                    onChange={(e) =>
                        setContent(
                            e.target.value
                        )
                    }
                    placeholder="Nội dung Facebook sẽ xuất hiện ở đây..."
                    style={{
                        width:
                            "100%",

                        minHeight:
                            "300px",

                        padding:
                            "15px",

                        fontSize:
                            "16px",

                        lineHeight:
                            "1.6",

                        boxSizing:
                            "border-box",

                        borderRadius:
                            "10px",

                        border:
                            content.trim()
                                ? "1px solid #ccc"
                                : "1px solid #ffcc80",

                        resize:
                            "vertical",
                    }}
                />


                <div
                    style={{
                        marginTop:
                            "8px",

                        color:
                            "#777",

                        fontSize:
                            "13px",
                    }}
                >

                    📝 {content.length} ký tự

                </div>

            </SectionCard>


            {/* =================================
                BULK READY / ACTION
            ================================= */}

            <SectionCard
                title="🚀 5. Tạo Queue Facebook"
            >
                <div>
                    <div
                        style={{
                            marginBottom:
                                "10px",
                        }}
                    >
                        👤 Facebook:{" "}

                        <strong>
                            {
                                selectedAccount?.name ||
                                "Chưa chọn"
                            }
                        </strong>
                    </div>


                    <div
                        style={{
                            marginBottom:
                                "10px",
                        }}
                    >
                        👥 Số nhóm:{" "}

                        <strong>
                            {
                                selectedGroups.length
                            }
                        </strong>
                    </div>


                    <div
                        style={{
                            marginBottom:
                                "10px",
                        }}
                    >
                        📷 Số ảnh mỗi bài:{" "}

                        <strong>
                            {
                                images.length
                            }
                        </strong>
                    </div>


                    <div
                        style={{
                            marginBottom:
                                "10px",
                        }}
                    >
                        📝 Nội dung:{" "}

                        <strong>
                            {content.trim()
                                ? "Đã có"
                                : "Chưa có"}
                        </strong>
                    </div>


                    <br />

                    <PrimaryButton
                        onClick={
                            handleAddBulkToQueue
                        }
                        disabled={
                            addingToQueue ||
                            !selectedAccount ||
                            selectedGroups.length ===
                                0 ||
                            images.length ===
                                0 ||
                            !content.trim()
                        }
                    >
                        {addingToQueue
                            ? "⏳ Đang tạo Queue..."
                            : `➕ TẠO QUEUE CHO ${selectedGroups.length} NHÓM`}
                    </PrimaryButton>


                    <div
                        style={{
                            marginTop:
                                "12px",

                            color:
                                "#666",

                            fontSize:
                                "14px",
                        }}
                    >

                        💡 Mỗi nhóm sẽ trở thành một
                        Job riêng trong Queue. Sau đó
                        Queue Worker sẽ xử lý tuần tự,
                        không đăng đồng thời tất cả
                        các nhóm.

                    </div>

                </div>

            </SectionCard>

        </main>
    );
}


export default FacebookPostPreview;