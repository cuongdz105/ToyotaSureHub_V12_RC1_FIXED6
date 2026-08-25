import { useEffect, useState, useSyncExternalStore } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import SectionCard from "../../components/Common/SectionCard";
import PrimaryButton from "../../components/Common/PrimaryButton";

import { getStoreSnapshot, subscribe } from "../../services/appDataStore";

import {
    loadAccounts,
    addAccount,
    deleteAccount,
    setDefaultAccount,
    updateAccount,
} from "../../services/facebookAccountService";

import {
    loadGroups,
} from "../../services/facebookGroupService";

function FacebookAccounts() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Đọc trực tiếp từ appDataStore — tự re-render khi Accounts/Groups
    // đổi ở bất kỳ trang nào khác, không cần refresh thủ công.
    const snapshot = useSyncExternalStore(subscribe, getStoreSnapshot, getStoreSnapshot);
    const accounts = snapshot.accounts;
    const groups = snapshot.groups;

    const [name, setName] =
        useState("");

    const [profileUrl, setProfileUrl] =
        useState("");

    const [note, setNote] =
        useState("");

    /*
     * Account đang mở phần
     * quản lý quyền Group
     */
    const [
        managingAccountId,
        setManagingAccountId,
    ] = useState(null);

    /*
     * Cho phép tất cả Group
     */
    const [
        allowAllGroups,
        setAllowAllGroups,
    ] = useState(true);

    /*
     * Danh sách Group được phép
     * khi allowAllGroups = false
     */
    const [
        allowedGroupIds,
        setAllowedGroupIds,
    ] = useState([]);

    /*
     * Danh sách Group bị loại trừ
     * khi allowAllGroups = true
     */
    const [
        excludedGroupIds,
        setExcludedGroupIds,
    ] = useState([]);

    /*
     * Tìm kiếm Group
     */
    const [
        groupSearch,
        setGroupSearch,
    ] = useState("");

    // ==========================================
    // GROUP ĐANG ĐƯỢC ĐÁNH DẤU TỪ QUEUE
    // ==========================================
    const [
        focusedGroupId,
        setFocusedGroupId,
    ] = useState(null);

    useEffect(() => {
        refreshData();
    }, []);

    // ==========================================
    // MỞ ĐÚNG ACCOUNT / GROUP TỪ QUEUE
    // ==========================================

    useEffect(() => {

        const accountId =
            searchParams.get("accountId");

        const groupId =
            searchParams.get("groupId");

        if (!accountId || accounts.length === 0) {
            return;
        }

        const targetAccount =
            accounts.find(
                (account) =>
                    String(account.id) ===
                    String(accountId)
            );

        if (!targetAccount) {
            return;
        }

        // Tự mở đúng Account
        handleOpenGroupManager(
            targetAccount
        );

        if (groupId) {
            setFocusedGroupId(
                String(groupId)
            );

            setGroupSearch("");

            // Cuộn tới đúng Group sau khi UI render
            setTimeout(() => {
                const element =
                    document.getElementById(
                        `facebook-group-${groupId}`
                    );

                if (element) {
                    element.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });
                }
            }, 150);
        }

    }, [accounts, searchParams]);

    // Accounts/Groups giờ đến từ appDataStore (xem useSyncExternalStore ở trên)
    // nên luôn tự cập nhật. Giữ hàm này làm no-op để các chỗ gọi refreshData()
    // bên dưới không bị lỗi.
    function refreshData() {}

    /*
     * ==========================================
     * THÊM ACCOUNT
     * ==========================================
     */

    async function handleAddAccount() {
        if (!name.trim()) {
            alert(
                "⚠️ Vui lòng nhập tên tài khoản."
            );

            return;
        }

        await addAccount({
            name:
                name.trim(),

            profileUrl:
                profileUrl.trim(),

            note:
                note.trim(),
        });

        setName("");
        setProfileUrl("");
        setNote("");

        refreshData();

        alert(
            "✅ Đã thêm tài khoản Facebook."
        );
    }

    /*
     * ==========================================
     * ĐẶT MẶC ĐỊNH
     * ==========================================
     */

    async function handleSetDefault(id) {
        await setDefaultAccount(id);

        refreshData();

        alert(
            "⭐ Đã đặt tài khoản làm mặc định."
        );
    }

    /*
     * ==========================================
     * XÓA ACCOUNT
     * ==========================================
     */

    async function handleDelete(
        id,
        accountName
    ) {
        const confirmed =
            window.confirm(
                `Xóa tài khoản "${accountName}"?`
            );

        if (!confirmed) {
            return;
        }

        await deleteAccount(id);

        if (
            managingAccountId === id
        ) {
            closeGroupManager();
        }

        refreshData();
    }

    /*
     * ==========================================
     * MỞ QUẢN LÝ GROUP
     * ==========================================
     */

    function handleOpenGroupManager(
        account
    ) {
        setManagingAccountId(
            account.id
        );

        setAllowAllGroups(
            account.allowAllGroups !==
                false
        );

        setAllowedGroupIds(
            Array.isArray(
                account.allowedGroupIds
            )
                ? account.allowedGroupIds.map(
                      (id) =>
                          String(id)
                  )
                : []
        );

        setExcludedGroupIds(
            Array.isArray(
                account.excludedGroupIds
            )
                ? account.excludedGroupIds.map(
                      (id) =>
                          String(id)
                  )
                : []
        );

        setGroupSearch("");
    }

    /*
     * ==========================================
     * ĐÓNG QUẢN LÝ GROUP
     * ==========================================
     */

    function closeGroupManager() {
        setManagingAccountId(
            null
        );

        setAllowAllGroups(true);

        setAllowedGroupIds([]);

        setExcludedGroupIds([]);

        setGroupSearch("");
    }

    /*
     * ==========================================
     * TICK GROUP ĐƯỢC PHÉP
     * ==========================================
     */

    function handleToggleAllowedGroup(
        groupId
    ) {
        const id =
            String(groupId);

        setAllowedGroupIds(
            (current) => {
                if (
                    current.includes(id)
                ) {
                    return current.filter(
                        (item) =>
                            item !== id
                    );
                }

                return [
                    ...current,
                    id,
                ];
            }
        );
    }

    /*
     * ==========================================
     * TICK GROUP NGOẠI LỆ
     * ==========================================
     */

    function handleToggleExcludedGroup(
        groupId
    ) {
        const id =
            String(groupId);

        setExcludedGroupIds(
            (current) => {
                if (
                    current.includes(id)
                ) {
                    return current.filter(
                        (item) =>
                            item !== id
                    );
                }

                return [
                    ...current,
                    id,
                ];
            }
        );
    }

    /*
     * ==========================================
     * LƯU QUYỀN GROUP
     * ==========================================
     */

    async function handleSaveGroupPermissions(
        account
    ) {
        await updateAccount(
            account.id,
            {
                allowAllGroups,

                allowedGroupIds:
                    allowAllGroups
                        ? []
                        : allowedGroupIds,

                excludedGroupIds:
                    allowAllGroups
                        ? excludedGroupIds
                        : [],
            }
        );

        refreshData();

        closeGroupManager();

        alert(
            "✅ Đã lưu quyền đăng nhóm cho tài khoản."
        );

        // Nếu được mở từ Queue Error Handler,
        // quay thẳng về Queue sau khi sửa xong.
        const returnTo =
            searchParams.get("returnTo");

        const jobId =
            searchParams.get("jobId");

        if (returnTo === "queue") {
            const queueUrl =
                jobId
                    ? `/facebook/queue?focusJobId=${encodeURIComponent(jobId)}`
                    : "/facebook/queue";

            navigate(queueUrl);
        }
    }

    /*
     * ==========================================
     * TÌM GROUP
     * ==========================================
     */

    function getFilteredGroups() {
        const keyword =
            groupSearch
                .trim()
                .toLowerCase();

        if (!keyword) {
            return groups;
        }

        return groups.filter(
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

                return (
                    nameMatch ||
                    urlMatch
                );
            }
        );
    }

    /*
     * ==========================================
     * ĐẾM QUYỀN
     * ==========================================
     */

    function getPermissionText(
        account
    ) {
        if (
            account.allowAllGroups !==
            false
        ) {
            const excluded =
                Array.isArray(
                    account.excludedGroupIds
                )
                    ? account
                          .excludedGroupIds
                          .length
                    : 0;

            if (excluded === 0) {
                return "Tất cả các nhóm";
            }

            return `Tất cả nhóm, trừ ${excluded} nhóm`;
        }

        const allowed =
            Array.isArray(
                account.allowedGroupIds
            )
                ? account.allowedGroupIds
                      .length
                : 0;

        return `${allowed} nhóm được phép`;
    }

    return (
        <main
            style={{
                padding: "24px",
                maxWidth: "1400px",
                margin: "0 auto",
            }}
        >

            <h1
                style={{
                    marginBottom: "6px",
                }}
            >
                👤 Facebook Accounts
            </h1>

            <p
                style={{
                    color: "#666",
                    marginTop: 0,
                }}
            >
                Quản lý các tài khoản Facebook
                dùng để đăng bài.
            </p>

            {/* =========================
                THÊM TÀI KHOẢN
            ========================= */}

            <SectionCard
                title="➕ Thêm tài khoản"
            >
                <div
                    style={{
                        display: "grid",
                        gap: "14px",
                        maxWidth: "700px",
                    }}
                >

                    <div>
                        <label
                            style={{
                                display:
                                    "block",
                                fontWeight:
                                    "600",
                                marginBottom:
                                    "6px",
                            }}
                        >
                            Tên tài khoản
                        </label>

                        <input
                            type="text"
                            placeholder="VD: Cương Toyota"
                            value={name}
                            onChange={(e) =>
                                setName(
                                    e.target.value
                                )
                            }
                            style={{
                                width: "100%",
                                boxSizing:
                                    "border-box",
                                padding:
                                    "11px",
                                border:
                                    "1px solid #ccc",
                                borderRadius:
                                    "8px",
                                fontSize:
                                    "15px",
                            }}
                        />
                    </div>

                    <div>
                        <label
                            style={{
                                display:
                                    "block",
                                fontWeight:
                                    "600",
                                marginBottom:
                                    "6px",
                            }}
                        >
                            Link Facebook
                        </label>

                        <input
                            type="text"
                            placeholder="https://facebook.com/..."
                            value={
                                profileUrl
                            }
                            onChange={(e) =>
                                setProfileUrl(
                                    e.target.value
                                )
                            }
                            style={{
                                width: "100%",
                                boxSizing:
                                    "border-box",
                                padding:
                                    "11px",
                                border:
                                    "1px solid #ccc",
                                borderRadius:
                                    "8px",
                                fontSize:
                                    "15px",
                            }}
                        />
                    </div>

                    <div>
                        <label
                            style={{
                                display:
                                    "block",
                                fontWeight:
                                    "600",
                                marginBottom:
                                    "6px",
                            }}
                        >
                            Ghi chú
                        </label>

                        <textarea
                            rows="3"
                            placeholder="VD: Tài khoản chính, chuyên đăng xe Toyota..."
                            value={note}
                            onChange={(e) =>
                                setNote(
                                    e.target.value
                                )
                            }
                            style={{
                                width: "100%",
                                boxSizing:
                                    "border-box",
                                padding:
                                    "11px",
                                border:
                                    "1px solid #ccc",
                                borderRadius:
                                    "8px",
                                fontSize:
                                    "15px",
                                resize:
                                    "vertical",
                            }}
                        />
                    </div>

                    <div>
                        <PrimaryButton
                            onClick={
                                handleAddAccount
                            }
                        >
                            💾 LƯU TÀI KHOẢN
                        </PrimaryButton>
                    </div>

                </div>
            </SectionCard>

            {/* =========================
                DANH SÁCH ACCOUNT
            ========================= */}

            <SectionCard
                title="📋 Danh sách tài khoản"
            >

                {accounts.length ===
                0 ? (

                    <div
                        style={{
                            padding:
                                "30px",
                            textAlign:
                                "center",
                            color:
                                "#777",
                        }}
                    >
                        👤 Chưa có tài khoản
                        Facebook nào.
                    </div>

                ) : (

                    <div
                        style={{
                            display:
                                "grid",
                            gridTemplateColumns:
                                "repeat(auto-fill, minmax(340px, 1fr))",
                            gap:
                                "16px",
                        }}
                    >

                        {accounts.map(
                            (account) => {

                                const isManaging =
                                    managingAccountId ===
                                    account.id;

                                return (
                                    <div
                                        key={
                                            account.id
                                        }
                                        style={{
                                            border:
                                                account.isDefault
                                                    ? "2px solid #e11"
                                                    : "1px solid #ddd",

                                            borderRadius:
                                                "12px",

                                            padding:
                                                "18px",

                                            background:
                                                "#fff",

                                            boxShadow:
                                                "0 2px 8px rgba(0,0,0,0.06)",
                                        }}
                                    >

                                        {/* HEADER */}

                                        <div
                                            style={{
                                                display:
                                                    "flex",
                                                justifyContent:
                                                    "space-between",
                                                alignItems:
                                                    "flex-start",
                                                gap:
                                                    "10px",
                                            }}
                                        >

                                            <div>

                                                <h3
                                                    style={{
                                                        margin:
                                                            0,
                                                        marginBottom:
                                                            "6px",
                                                    }}
                                                >
                                                    👤{" "}
                                                    {
                                                        account.name
                                                    }
                                                </h3>

                                                {account.isDefault && (
                                                    <span
                                                        style={{
                                                            display:
                                                                "inline-block",
                                                            background:
                                                                "#e11",
                                                            color:
                                                                "#fff",
                                                            padding:
                                                                "4px 9px",
                                                            borderRadius:
                                                                "20px",
                                                            fontSize:
                                                                "12px",
                                                            fontWeight:
                                                                "600",
                                                        }}
                                                    >
                                                        ⭐ MẶC ĐỊNH
                                                    </span>
                                                )}

                                            </div>

                                            <span
                                                style={{
                                                    color:
                                                        account.status ===
                                                        "active"
                                                            ? "#0aaf50"
                                                            : "#999",

                                                    fontWeight:
                                                        "600",
                                                }}
                                            >
                                                ●{" "}
                                                {account.status ===
                                                "active"
                                                    ? "Hoạt động"
                                                    : account.status}
                                            </span>

                                        </div>

                                        <hr />

                                        {/* THÔNG TIN */}

                                        <p>
                                            🔗{" "}
                                            <strong>
                                                Link:
                                            </strong>{" "}
                                            {account.profileUrl ||
                                                "Chưa có"}
                                        </p>

                                        <p>
                                            📝{" "}
                                            <strong>
                                                Ghi chú:
                                            </strong>{" "}
                                            {account.note ||
                                                "Không có"}
                                        </p>

                                        <p>
                                            👥{" "}
                                            <strong>
                                                Quyền nhóm:
                                            </strong>{" "}
                                            {getPermissionText(
                                                account
                                            )}
                                        </p>

                                        <p>
                                            📤{" "}
                                            <strong>
                                                Tổng bài:
                                            </strong>{" "}
                                            {account.totalPosts ||
                                                0}
                                        </p>

                                        {/* ACTIONS */}

                                        <div
                                            style={{
                                                display:
                                                    "flex",
                                                gap:
                                                    "8px",
                                                flexWrap:
                                                    "wrap",
                                                marginTop:
                                                    "16px",
                                            }}
                                        >

                                            {!account.isDefault && (
                                                <PrimaryButton
                                                    onClick={() =>
                                                        handleSetDefault(
                                                            account.id
                                                        )
                                                    }
                                                >
                                                    ⭐ Đặt mặc định
                                                </PrimaryButton>
                                            )}

                                            <PrimaryButton
                                                onClick={() =>
                                                    handleOpenGroupManager(
                                                        account
                                                    )
                                                }
                                            >
                                                👥 Quản lý nhóm
                                            </PrimaryButton>

                                            <PrimaryButton
                                                onClick={() =>
                                                    handleDelete(
                                                        account.id,
                                                        account.name
                                                    )
                                                }
                                            >
                                                🗑️ Xóa
                                            </PrimaryButton>

                                        </div>

                                        {/* =========================
                                            GROUP PERMISSION MANAGER
                                        ========================= */}

                                        {isManaging && (

                                            <div
                                                style={{
                                                    marginTop:
                                                        "18px",

                                                    padding:
                                                        "16px",

                                                    background:
                                                        "#f8f9fa",

                                                    border:
                                                        "1px solid #ddd",

                                                    borderRadius:
                                                        "10px",
                                                }}
                                            >

                                                <h3
                                                    style={{
                                                        marginTop:
                                                            0,
                                                    }}
                                                >
                                                    👥 Quyền đăng nhóm
                                                </h3>

                                                {/* ALL GROUPS */}

                                                <label
                                                    style={{
                                                        display:
                                                            "flex",
                                                        alignItems:
                                                            "center",
                                                        gap:
                                                            "10px",
                                                        padding:
                                                            "12px",
                                                        background:
                                                            "#fff",
                                                        border:
                                                            "1px solid #ddd",
                                                        borderRadius:
                                                            "8px",
                                                        cursor:
                                                            "pointer",
                                                    }}
                                                >

                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            allowAllGroups
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            setAllowAllGroups(
                                                                e
                                                                    .target
                                                                    .checked
                                                            )
                                                        }
                                                    />

                                                    <strong>
                                                        🌐 Cho phép đăng tất cả các nhóm
                                                    </strong>

                                                </label>

                                                <p
                                                    style={{
                                                        marginTop:
                                                            "8px",
                                                        color:
                                                            "#666",
                                                        fontSize:
                                                            "14px",
                                                    }}
                                                >
                                                    {allowAllGroups
                                                        ? "Tài khoản này được đăng tất cả nhóm. Ông có thể bỏ tích những nhóm không muốn đăng."
                                                        : "Tài khoản này chỉ được đăng những nhóm được tích bên dưới."}
                                                </p>

                                                {focusedGroupId && (
                                                    <div
                                                        style={{
                                                            marginTop: "12px",
                                                            padding: "10px 12px",
                                                            background: "#fff3cd",
                                                            border: "1px solid #ffe69c",
                                                            borderRadius: "8px",
                                                            fontSize: "14px",
                                                        }}
                                                    >
                                                        🎯 Đang xử lý lỗi từ Queue: Group được đánh dấu màu vàng bên dưới.
                                                    </div>
                                                )}

                                                {/* SEARCH */}

                                                <div
                                                    style={{
                                                        marginTop:
                                                            "14px",
                                                    }}
                                                >

                                                    <input
                                                        type="text"
                                                        placeholder="🔍 Tìm nhóm..."
                                                        value={
                                                            groupSearch
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            setGroupSearch(
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        style={{
                                                            width:
                                                                "100%",
                                                            boxSizing:
                                                                "border-box",
                                                            padding:
                                                                "11px",
                                                            border:
                                                                "1px solid #ccc",
                                                            borderRadius:
                                                                "8px",
                                                            fontSize:
                                                                "15px",
                                                        }}
                                                    />

                                                </div>

                                                {/* GROUP LIST */}

                                                <div
                                                    style={{
                                                        marginTop:
                                                            "12px",
                                                        maxHeight:
                                                            "350px",
                                                        overflowY:
                                                            "auto",
                                                    }}
                                                >

                                                    {groups.length ===
                                                    0 ? (

                                                        <p
                                                            style={{
                                                                color:
                                                                    "#777",
                                                            }}
                                                        >
                                                            📭 Chưa có hội nhóm nào.
                                                        </p>

                                                    ) : (

                                                        getFilteredGroups().length ===
                                                        0 ? (

                                                            <p
                                                                style={{
                                                                    color:
                                                                        "#777",
                                                                }}
                                                            >
                                                                🔍 Không tìm thấy nhóm phù hợp.
                                                            </p>

                                                        ) : (

                                                            getFilteredGroups().map(
                                                                (
                                                                    group
                                                                ) => {

                                                                    const groupId =
                                                                        String(
                                                                            group.id
                                                                        );

                                                                    const checked =
                                                                        allowAllGroups
                                                                            ? !excludedGroupIds.includes(
                                                                                  groupId
                                                                              )
                                                                            : allowedGroupIds.includes(
                                                                                  groupId
                                                                              );

                                                                    return (
                                                                        <label
                                                                            id={`facebook-group-${group.id}`}
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
                                                                                marginBottom:
                                                                                    "6px",
                                                                                background:
                                                                                    "#fff",
                                                                                border:
                                                                                    "1px solid #e5e5e5",
                                                                                borderRadius:
                                                                                    "8px",
                                                                                                                                                                cursor:
                                                                                    "pointer",
                                                                                background:
                                                                                    focusedGroupId === String(group.id)
                                                                                        ? "#fff3cd"
                                                                                        : "#fff",
                                                                                border:
                                                                                    focusedGroupId === String(group.id)
                                                                                        ? "2px solid #ff9800"
                                                                                        : "1px solid #e5e5e5",
                                                                            }}
                                                                        >

                                                                            <input
                                                                                type="checkbox"
                                                                                checked={
                                                                                    checked
                                                                                }
                                                                                onChange={() =>
                                                                                    allowAllGroups
                                                                                        ? handleToggleExcludedGroup(
                                                                                              group.id
                                                                                          )
                                                                                        : handleToggleAllowedGroup(
                                                                                              group.id
                                                                                          )
                                                                                }
                                                                            />

                                                                            <div
                                                                                style={{
                                                                                    flex:
                                                                                        1,
                                                                                }}
                                                                            >

                                                                                <strong>
                                                                                    👥{" "}
                                                                                    {
                                                                                        group.name
                                                                                    }
                                                                                </strong>

                                                                                {group.url && (
                                                                                    <div
                                                                                        style={{
                                                                                            color:
                                                                                                "#777",
                                                                                            fontSize:
                                                                                                "12px",
                                                                                            marginTop:
                                                                                                "3px",
                                                                                        }}
                                                                                    >
                                                                                        {group.url}
                                                                                    </div>
                                                                                )}

                                                                            </div>

                                                                        </label>
                                                                    );
                                                                }
                                                            )

                                                        )
                                                    )}

                                                </div>

                                                {/* EXCEPTION INFO */}

                                                {allowAllGroups &&
                                                    excludedGroupIds.length >
                                                        0 && (

                                                        <div
                                                            style={{
                                                                marginTop:
                                                                    "10px",
                                                                padding:
                                                                    "10px",
                                                                background:
                                                                    "#fff3cd",
                                                                border:
                                                                    "1px solid #ffe69c",
                                                                borderRadius:
                                                                    "8px",
                                                                fontSize:
                                                                    "14px",
                                                            }}
                                                        >
                                                            🚫 Đang loại trừ{" "}
                                                            <strong>
                                                                {
                                                                    excludedGroupIds.length
                                                                }
                                                            </strong>{" "}
                                                            nhóm.
                                                        </div>

                                                    )}

                                                {/* ACTIONS */}

                                                <div
                                                    style={{
                                                        display:
                                                            "flex",
                                                        gap:
                                                            "8px",
                                                        flexWrap:
                                                            "wrap",
                                                        marginTop:
                                                            "14px",
                                                    }}
                                                >

                                                    {searchParams.get("returnTo") === "queue" && (
                                                        <button
                                                            type="button"
                                                            onClick={() => navigate("/facebook/queue")}
                                                            style={{
                                                                padding: "10px 16px",
                                                                border: "1px solid #ccc",
                                                                borderRadius: "8px",
                                                                background: "#fff",
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            ↩️ Quay lại Queue
                                                        </button>
                                                    )}

                                                    <PrimaryButton
                                                        onClick={() =>
                                                            handleSaveGroupPermissions(
                                                                account
                                                            )
                                                        }
                                                    >
                                                        💾 Lưu quyền nhóm
                                                    </PrimaryButton>

                                                    <button
                                                        type="button"
                                                        onClick={
                                                            closeGroupManager
                                                        }
                                                        style={{
                                                            padding:
                                                                "10px 16px",
                                                            border:
                                                                "1px solid #ccc",
                                                            borderRadius:
                                                                "8px",
                                                            background:
                                                                "#fff",
                                                            cursor:
                                                                "pointer",
                                                        }}
                                                    >
                                                        Hủy
                                                    </button>

                                                </div>

                                            </div>

                                        )}

                                    </div>
                                );
                            }
                        )}

                    </div>
                )}

            </SectionCard>

            {/* =========================
                LƯU Ý
            ========================= */}

            <SectionCard
                title="💡 Lưu ý"
            >
                <p>
                    Hệ thống hiện chỉ quản lý
                    thông tin và quyền sử dụng
                    tài khoản Facebook.
                </p>

                <p>
                    🔐{" "}
                    <strong>
                        Không lưu mật khẩu Facebook
                    </strong>{" "}
                    trong ToyotaSureHub.
                </p>

                <p>
                    🚀 Kết nối tài khoản để
                    đăng Facebook thật sẽ được
                    xây dựng ở bước Posting Engine
                    tiếp theo.
                </p>
            </SectionCard>

        </main>
    );
}

export default FacebookAccounts;