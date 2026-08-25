import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { getStoreSnapshot, subscribe } from "../../services/appDataStore";

import {
  loadGroups,
  addGroup,
  updateGroup,
  deleteGroup,
} from "../../services/facebookGroupService";

import {
  loadAccounts,
} from "../../services/facebookAccountService";

import PrimaryButton from "../../components/Common/PrimaryButton";
import TextInput from "../../components/Common/TextInput";
import SectionCard from "../../components/Common/SectionCard";
import EmptyState from "../../components/Common/EmptyState";

import FacebookGroupCard from "../../components/Facebook/FacebookGroupCard";

import {
  getCurrentPosting,
} from "../../services/postingSessionService";
import { useCars } from "../../hooks/useCars";

function FacebookGroups() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cars } = useCars();

  // Đọc trực tiếp từ appDataStore — tự re-render khi Groups/Accounts
  // đổi ở bất kỳ trang nào khác, không cần refresh thủ công.
  const snapshot = useSyncExternalStore(subscribe, getStoreSnapshot, getStoreSnapshot);
  const groups = snapshot.groups;
  const accounts = snapshot.accounts;

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const [search, setSearch] = useState("");

  const [selectedGroup, setSelectedGroup] =
    useState(null);

  /*
   * Group đang mở phần quản lý Account
   */
  const [managingAccountGroupId, setManagingAccountGroupId] =
    useState(null);

  /*
   * Các Account đang được tick
   * cho Group đang quản lý
   */
  const [selectedAccountIds, setSelectedAccountIds] =
    useState([]);

  /*
   * Group đang được sửa
   */
  const [editingGroupId, setEditingGroupId] =
    useState(null);

  const [editForm, setEditForm] =
    useState({
      name: "",
      url: "",
      status: "active",
      rating: 5,
      members: "",
      category: "",
      suitableCars: "",
      notes: "",
      allowPost: true,
      requireApproval: false,
    });

  const stateCarId = location.state?.carId || null;
  const postingCar =
    (stateCarId
      ? cars.find((car) => String(car.id) === String(stateCarId))
      : null) || getCurrentPosting();

  // ==========================================
// FACEBOOK GROUP DUPLICATE GUARD
// ==========================================

function normalizeGroupUrl(value = "") {

    let raw =
        String(value || "").trim();

    if (!raw) {
        return "";
    }

    // Nếu người dùng nhập thiếu https://
    if (!/^https?:\/\//i.test(raw)) {
        raw =
            `https://${raw}`;
    }

    try {

        const urlObj =
            new URL(raw);

        let hostname =
            urlObj.hostname
                .toLowerCase()
                .replace(/^www\./, "");

        // Không phải Facebook
        if (
            hostname !== "facebook.com" &&
            hostname !== "m.facebook.com"
        ) {

            return raw
                .toLowerCase()
                .replace(/\/+$/, "");
        }

        // Chuẩn hóa đường dẫn
        let pathname =
            urlObj.pathname
                .replace(/\/+/g, "/")
                .replace(/\/+$/, "")
                .toLowerCase();

        return (
            `https://facebook.com${pathname}`
        );

    } catch {

        return raw
            .toLowerCase()
            .replace(/\/+$/, "");
    }
}


// ==========================================
// LẤY FACEBOOK GROUP ID TỪ URL
// ==========================================

function extractFacebookGroupId(
    value = ""
) {

    const normalized =
        normalizeGroupUrl(value);

    if (!normalized) {
        return "";
    }

    const match =
        normalized.match(
            /facebook\.com\/groups\/([^/?#]+)/i
        );

    if (!match?.[1]) {
        return "";
    }

    const identifier =
        decodeURIComponent(
            match[1]
        ).trim();

    // Group ID dạng số
    if (/^\d+$/.test(identifier)) {
        return identifier;
    }

    return "";
}


// ==========================================
// TÌM GROUP BỊ TRÙNG
// ==========================================

function findDuplicateGroup(
    candidateUrl,
    excludeGroupId = null
) {

    const candidateNormalizedUrl =
        normalizeGroupUrl(
            candidateUrl
        );

    const candidateGroupId =
        extractFacebookGroupId(
            candidateUrl
        );


    return groups.find(
        (group) => {

            // Khi đang sửa một group,
            // không coi chính nó là duplicate.
            if (
                excludeGroupId !== null &&
                String(group.id) ===
                    String(excludeGroupId)
            ) {

                return false;
            }


            // ==================================
            // ƯU TIÊN KIỂM TRA GROUP ID
            // ==================================

            const existingGroupId =
                group.facebookGroupId ||
                extractFacebookGroupId(
                    group.url
                );


            if (
                candidateGroupId &&
                existingGroupId &&
                String(candidateGroupId) ===
                    String(existingGroupId)
            ) {

                return true;
            }


            // ==================================
            // FALLBACK: SO SÁNH URL CHUẨN HÓA
            // ==================================

            const existingNormalizedUrl =
                normalizeGroupUrl(
                    group.url
                );


            return (
                candidateNormalizedUrl &&
                existingNormalizedUrl &&
                candidateNormalizedUrl ===
                    existingNormalizedUrl
            );
        }
    );
}

  useEffect(() => {
    refreshData();

    /*
     * Nếu Queue mở trang này để sửa một Group cụ thể,
     * tự động mở đúng Group đó.
     *
     * Ví dụ:
     * /facebook/groups?groupId=123&returnTo=queue&jobId=abc
     */
    const params = new URLSearchParams(
      window.location.search
    );

    const groupIdParam =
      params.get("groupId");

    if (!groupIdParam) {
      return;
    }

    const currentGroups = loadGroups();

    const targetGroup =
      currentGroups.find(
        (group) =>
          String(group.id) ===
          String(groupIdParam)
      );

    if (targetGroup) {
      handleEdit(targetGroup);
    }
  }, []);

  /*
   * ==========================================
   * LOAD DATA
   * ==========================================
   */

  // Groups/Accounts giờ đến từ appDataStore (xem useSyncExternalStore ở trên)
  // nên luôn tự cập nhật. Giữ hàm này làm no-op để chỗ gọi refreshData()
  // trong useEffect phía trên không bị lỗi.
  function refreshData() {}

  /*
   * ==========================================
   * THÊM GROUP
   * ==========================================
   */

  // ==========================================
// THÊM HỘI NHÓM
// ==========================================

async function handleAddGroup() {

    const cleanName =
        name.trim();

    const cleanUrl =
        url.trim();


    // ========================================
    // KIỂM TRA TÊN
    // ========================================

    if (!cleanName) {

        alert(
            "⚠️ Vui lòng nhập tên hội nhóm."
        );

        return;
    }


    // ========================================
    // KIỂM TRA LINK
    // ========================================

    if (!cleanUrl) {

        alert(
            "⚠️ Vui lòng nhập Link Facebook Group."
        );

        return;
    }


    // ========================================
    // KIỂM TRA GROUP TRÙNG
    // ========================================

    const duplicateGroup =
        findDuplicateGroup(
            cleanUrl
        );


    if (duplicateGroup) {

        const duplicateId =
            duplicateGroup.facebookGroupId ||
            extractFacebookGroupId(
                duplicateGroup.url
            );


        alert(

            "⚠️ HỘI NHÓM ĐÃ TỒN TẠI!\n\n" +

            `👥 ${duplicateGroup.name}\n` +

            `🔗 ${
                duplicateGroup.url ||
                "(chưa có link)"
            }\n` +

            (
                duplicateId
                    ? `🆔 Group ID: ${duplicateId}\n`
                    : ""
            ) +

            "\n" +

            "ToyotaSureHub không tạo thêm nhóm trùng."
        );


        return;
    }


    // ========================================
    // CHUẨN HÓA LINK
    // ========================================

    const normalizedUrl =
        normalizeGroupUrl(
            cleanUrl
        );


    const facebookGroupId =
        extractFacebookGroupId(
            cleanUrl
        );


    // ========================================
    // THÊM GROUP
    // ========================================

    await addGroup({

        name:
            cleanName,

        url:
            normalizedUrl,

        facebookGroupId:
            facebookGroupId ||
            null,

    });


    // ========================================
    // RESET FORM
    // ========================================

    setName("");

    setUrl("");


    // ========================================
    // LOAD LẠI DANH SÁCH
    // ========================================

    refreshData();


    alert(

        "✅ Đã thêm hội nhóm.\n\n" +

        `👥 ${cleanName}`

    );
}

  /*
   * ==========================================
   * XÓA GROUP
   * ==========================================
   */

  async function handleDelete(id) {
    if (
      !window.confirm(
        "Xóa hội nhóm này?"
      )
    ) {
      return;
    }

    await deleteGroup(id);

    if (selectedGroup?.id === id) {
      setSelectedGroup(null);
    }

    if (
      managingAccountGroupId === id
    ) {
      setManagingAccountGroupId(
        null
      );

      setSelectedAccountIds([]);
    }

    refreshData();
  }

  /*
   * ==========================================
   * EDIT GROUP
   * ==========================================
   */

  function handleEdit(group) {
    setEditingGroupId(group.id);

    setEditForm({
      name: group.name || "",
      url: group.url || "",
      status: group.status || "active",
      rating: group.rating ?? 5,
      members: group.members || "",
      category: group.category || "",
      suitableCars: Array.isArray(group.suitableCars)
        ? group.suitableCars.join(", ")
        : (group.suitableCars || ""),
      notes: group.notes || "",
      allowPost: group.allowPost !== false,
      requireApproval: group.requireApproval === true,
    });

    setManagingAccountGroupId(null);
    setSelectedAccountIds([]);

    setTimeout(() => {
      document
        .getElementById(`facebook-group-edit-${group.id}`)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 50);
  }

  function handleCancelEdit() {
    setEditingGroupId(null);
  }

  async function handleSaveEdit(group) {
    if (!editForm.name.trim()) {
      alert("Vui lòng nhập tên hội nhóm.");
      return;
    }

    const updatedGroup = await updateGroup(
      group.id,
      {
        name: editForm.name.trim(),
        url: editForm.url.trim(),
        status: editForm.status,
        rating: Number(editForm.rating) || 0,
        members: editForm.members.trim(),
        category: editForm.category.trim(),
        suitableCars: editForm.suitableCars
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        notes: editForm.notes.trim(),
        allowPost: editForm.allowPost,
        requireApproval: editForm.requireApproval,
      }
    );

    if (selectedGroup?.id === group.id) {
      const selectedUpdated = {
        ...selectedGroup,
        ...updatedGroup,
        matchScore: getGroupScore({
          ...selectedGroup,
          ...updatedGroup,
        }),
      };

      setSelectedGroup(selectedUpdated);

    }

    setEditingGroupId(null);
    refreshData();

    /*
     * Nếu đi từ Queue sang đây để sửa lỗi,
     * sau khi lưu sẽ quay lại đúng Job.
     */
    const params = new URLSearchParams(
      window.location.search
    );

    const returnTo = params.get("returnTo");
    const jobId = params.get("jobId");

    if (returnTo === "queue") {
      const queueParams = new URLSearchParams();

      if (jobId) {
        queueParams.set("focusJobId", jobId);
      }

      window.location.href =
        `/facebook/queue${
          queueParams.toString()
            ? `?${queueParams.toString()}`
            : ""
        }`;

      return;
    }

    alert("✅ Đã lưu thông tin hội nhóm.");
  }

  /*
   * ==========================================
   * TÍNH ĐỘ PHÙ HỢP
   * ==========================================
   */

  function getGroupScore(group) {
    if (!postingCar) return 0;

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

    /*
     * Nhóm phù hợp với dòng xe
     */
    if (
      postingCar.model &&
      suitableText.includes(
        postingCar.model.toLowerCase()
      )
    ) {
      score += 35;
    }

    /*
     * Tên nhóm có hãng / model
     */
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

    /*
     * Group đang active
     */
    if (
      group.status === "active"
    ) {
      score += 5;
    }

    /*
     * Chưa từng đăng
     */
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

  /*
   * ==========================================
   * NHÓM GỢI Ý
   * ==========================================
   */

  const recommendedGroups =
    useMemo(() => {
      return [...groups]
        .map((group) => ({
          ...group,

          matchScore:
            getGroupScore(group),
        }))
        .sort(
          (a, b) =>
            b.matchScore -
            a.matchScore
        )
        .slice(0, 5);
    }, [groups, postingCar]);

  /*
   * ==========================================
   * TÌM KIẾM GROUP
   * ==========================================
   */

  const searchedGroups =
    useMemo(() => {
      const keyword =
        search
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
              .includes(keyword);

          const urlMatch =
            group.url
              ?.toLowerCase()
              .includes(keyword);

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
    }, [groups, search]);

  /*
   * ==========================================
   * CHỌN GROUP ĐỂ ĐĂNG
   * ==========================================
   */

  function handleSelectGroup(group) {
    const groupWithScore = {
      ...group,

      matchScore:
        group.matchScore ||
        getGroupScore(group),
    };

    setSelectedGroup(
      groupWithScore
    );


    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /*
   * ==========================================
   * MỞ QUẢN LÝ ACCOUNT CỦA GROUP
   * ==========================================
   */

  function handleOpenAccountManager(
    group
  ) {
    const accountIds =
      Array.isArray(
        group.accountIds
      )
        ? group.accountIds
        : [];

    setManagingAccountGroupId(
      group.id
    );

    /*
     * Luôn lưu ID dưới dạng String
     * để checkbox không bị lỗi
     * number/string.
     */
    setSelectedAccountIds(
      accountIds.map((id) =>
        String(id)
      )
    );
  }

  /*
   * ==========================================
   * TICK / BỎ TICK ACCOUNT
   * ==========================================
   */

  function handleToggleAccount(
    accountId
  ) {
    const id = String(
      accountId
    );

    setSelectedAccountIds(
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
   * LƯU ACCOUNT CHO GROUP
   * ==========================================
   */

  async function handleSaveAccounts(
    group
  ) {
    await updateGroup(
      group.id,
      {
        accountIds:
          selectedAccountIds,
      }
    );

    setManagingAccountGroupId(
      null
    );

    setSelectedAccountIds([]);

    refreshData();

    /*
     * Nếu group này đang được chọn
     * thì cập nhật luôn state của Group đang chọn.
     */
    if (
      selectedGroup?.id ===
      group.id
    ) {
      const updatedGroup = {
        ...group,

        accountIds:
          selectedAccountIds,
      };

      setSelectedGroup(
        updatedGroup
      );

    }

    alert(
      "✅ Đã lưu tài khoản Facebook cho nhóm."
    );
  }

  /*
   * ==========================================
   * ĐÓNG QUẢN LÝ ACCOUNT
   * ==========================================
   */

  function handleCancelAccountManager() {
    setManagingAccountGroupId(
      null
    );

    setSelectedAccountIds([]);
  }

  /*
   * ==========================================
   * LẤY TÊN ACCOUNT
   * ==========================================
   */

  function getAccountName(
    accountId
  ) {
    const account =
      accounts.find(
        (item) =>
          String(item.id) ===
          String(accountId)
      );

    return (
      account?.name ||
      "Tài khoản không tồn tại"
    );
  }

  /*
   * ==========================================
   * LẤY ACCOUNT CỦA GROUP
   * ==========================================
   */

  function getGroupAccounts(
    group
  ) {
    const accountIds =
      Array.isArray(
        group.accountIds
      )
        ? group.accountIds
        : [];

    return accountIds
      .map((id) =>
        accounts.find(
          (account) =>
            String(
              account.id
            ) ===
            String(id)
        )
      )
      .filter(Boolean);
  }

  /*
   * ==========================================
   * RENDER
   * ==========================================
   */

  return (
    <div className="content">

      <h1>
        👥 Facebook Posting Center
      </h1>

      <p>
        Chọn hội nhóm để đăng bài
        Facebook nhanh nhất.
      </p>

      {/* =====================================
          XE ĐANG ĐĂNG
      ====================================== */}

      {postingCar && (
        <SectionCard
          title="🚗 Đang đăng xe"
        >
          <h2>
            {postingCar.brand}{" "}
            {postingCar.model}
          </h2>

          <p>
            {postingCar.version} ·{" "}
            {postingCar.year}
          </p>
        </SectionCard>
      )}

      {/* =====================================
          NHÓM ĐÃ CHỌN
      ====================================== */}

      {selectedGroup && (
        <SectionCard
          title="🎯 Nhóm đã chọn"
        >
          <h2>
            👥{" "}
            {selectedGroup.name}
          </h2>

          <p>
            ⭐ Độ phù hợp:{" "}
            <strong>
              {
                selectedGroup.matchScore ||
                getGroupScore(
                  selectedGroup
                )
              }
              %
            </strong>
          </p>

          <p>
            👤 Tài khoản được phép:{" "}
            <strong>
              {
                getGroupAccounts(
                  selectedGroup
                ).length
              }
            </strong>
          </p>

          <PrimaryButton
            onClick={() =>
              navigate("/facebook/post", {
                state: {
                  carId: postingCar?.id || null,
                  groupId: selectedGroup?.id || null,
                },
              })
            }
          >
            🚀 Tiếp tục đăng
          </PrimaryButton>
        </SectionCard>
      )}

           {/* =====================================
          GỢI Ý NHÓM
      ====================================== */}

      {postingCar &&
        groups.length > 0 && (
          <SectionCard
            title="🔥 Nhóm nên đăng"
          >
            <p>
              ToyotaSureHub tự gợi ý
              dựa trên độ phù hợp
              với chiếc xe đang bán.
            </p>

            {/* =================================
                DANH SÁCH NHÓM GỢI Ý - CÓ CUỘN
            ================================== */}
            <div
              style={{
                maxHeight: "430px",
                overflowY: "auto",
                paddingRight: "6px",
              }}
            >
              {recommendedGroups.map(
                (group) => (
                  <div
                    key={group.id}
                    style={{
                      border:
                        "1px solid #ddd",
                      borderRadius:
                        "10px",
                      padding: "15px",
                      marginBottom:
                        "12px",
                      background:
                        selectedGroup?.id ===
                          group.id
                          ? "#fff8e1"
                          : "#fff",
                    }}
                  >
                    <h3>
                      👥{" "}
                      {group.name}
                    </h3>

                    <p>
                      ⭐ Độ phù hợp:{" "}
                      <strong>
                        {
                          group.matchScore
                        }
                        %
                      </strong>
                    </p>

                    <p>
                      📌 Đã đăng:{" "}
                      {
                        group.totalPosts ||
                        0
                      }
                    </p>

                    <p>
                      🟢 Trạng thái:{" "}
                      {
                        group.status ||
                        "active"
                      }
                    </p>

                    <p>
                      👤 Tài khoản:{" "}
                      <strong>
                        {
                          Array.isArray(
                            group.accountIds
                          )
                            ? group.accountIds.length
                            : 0
                        }
                      </strong>
                    </p>

                    <PrimaryButton
                      onClick={() =>
                        handleSelectGroup(
                          group
                        )
                      }
                    >
                      👉 Chọn đăng
                    </PrimaryButton>
                  </div>
                )
              )}
            </div>
          </SectionCard>
        )}

      {/* =====================================
          TÌM NHÓM
      ====================================== */}

      <SectionCard
        title="🔍 Tìm hội nhóm"
      >
        <TextInput
          placeholder="Nhập tên nhóm, dòng xe..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
        />

        <br />
        <br />

        {search && (
          <p>
            Tìm thấy:{" "}
            <strong>
              {
                searchedGroups.length
              }
            </strong>{" "}
            nhóm
          </p>
        )}

        {search &&
          searchedGroups.map(
            (group) => (
              <div
                key={group.id}
                style={{
                  border:
                    "1px solid #ddd",
                  borderRadius:
                    "10px",
                  padding: "15px",
                  marginBottom:
                    "10px",
                }}
              >
                <h3>
                  👥{" "}
                  {group.name}
                </h3>

                <p>
                  ⭐ Độ phù hợp:{" "}
                  {
                    getGroupScore(
                      group
                    )
                  }
                  %
                </p>

                <PrimaryButton
                  onClick={() =>
                    handleSelectGroup(
                      {
                        ...group,
                        matchScore:
                          getGroupScore(
                            group
                          ),
                      }
                    )
                  }
                >
                  👉 Chọn nhóm này
                </PrimaryButton>
              </div>
            )
          )}
      </SectionCard>

      {/* =====================================
          THÊM NHÓM
      ====================================== */}

      <SectionCard
        title="➕ Thêm hội nhóm"
      >
        <TextInput
          placeholder="Tên hội nhóm"
          value={name}
          onChange={(e) =>
            setName(
              e.target.value
            )
          }
        />

        <br />
        <br />

        <TextInput
          placeholder="Link Facebook Group"
          value={url}
          onChange={(e) =>
            setUrl(
              e.target.value
            )
          }
        />

        <br />
        <br />

        <PrimaryButton
          onClick={handleAddGroup}
        >
          ➕ Thêm nhóm
        </PrimaryButton>
      </SectionCard>

      {/* =====================================
          THƯ VIỆN NHÓM
      ====================================== */}

      <SectionCard
        title="📚 Thư viện hội nhóm"
      >
        {groups.length === 0 ? (
          <EmptyState
            text="Chưa có hội nhóm."
          />
        ) : (
          groups.map(
            (group) => {
              const groupAccounts =
                getGroupAccounts(
                  group
                );

              const isManaging =
                managingAccountGroupId ===
                group.id;

              return (
                <div
                  key={group.id}
                  style={{
                    marginBottom:
                      "20px",
                  }}
                >

                  {/* =========================
                      SỬA GROUP
                  ========================== */}

                  {editingGroupId === group.id && (
                    <div
                      id={`facebook-group-edit-${group.id}`}
                      style={{
                        marginBottom: "10px",
                        padding: "18px",
                        background: "#fff8e1",
                        border: "2px solid #f0c36d",
                        borderRadius: "10px",
                      }}
                    >
                      <h3 style={{ marginTop: 0 }}>
                        ✏️ Sửa hội nhóm
                      </h3>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                          gap: "12px",
                        }}
                      >
                        <TextInput
                          placeholder="Tên hội nhóm"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm((current) => ({
                              ...current,
                              name: e.target.value,
                            }))
                          }
                        />

                        <TextInput
                          placeholder="Link Facebook Group"
                          value={editForm.url}
                          onChange={(e) =>
                            setEditForm((current) => ({
                              ...current,
                              url: e.target.value,
                            }))
                          }
                        />

                        <TextInput
                          placeholder="Dòng xe phù hợp, cách nhau bằng dấu phẩy"
                          value={editForm.suitableCars}
                          onChange={(e) =>
                            setEditForm((current) => ({
                              ...current,
                              suitableCars: e.target.value,
                            }))
                          }
                        />

                        <TextInput
                          placeholder="Số thành viên"
                          value={editForm.members}
                          onChange={(e) =>
                            setEditForm((current) => ({
                              ...current,
                              members: e.target.value,
                            }))
                          }
                        />

                        <TextInput
                          placeholder="Danh mục"
                          value={editForm.category}
                          onChange={(e) =>
                            setEditForm((current) => ({
                              ...current,
                              category: e.target.value,
                            }))
                          }
                        />

                        <TextInput
                          placeholder="Rating 0 - 5"
                          value={editForm.rating}
                          onChange={(e) =>
                            setEditForm((current) => ({
                              ...current,
                              rating: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <textarea
                        value={editForm.notes}
                        onChange={(e) =>
                          setEditForm((current) => ({
                            ...current,
                            notes: e.target.value,
                          }))
                        }
                        placeholder="Ghi chú"
                        style={{
                          width: "100%",
                          minHeight: "90px",
                          marginTop: "12px",
                          padding: "10px",
                          boxSizing: "border-box",
                          border: "1px solid #ccc",
                          borderRadius: "8px",
                          resize: "vertical",
                        }}
                      />

                      <div
                        style={{
                          display: "flex",
                          gap: "18px",
                          flexWrap: "wrap",
                          marginTop: "12px",
                        }}
                      >
                        <label>
                          <input
                            type="checkbox"
                            checked={editForm.allowPost}
                            onChange={(e) =>
                              setEditForm((current) => ({
                                ...current,
                                allowPost: e.target.checked,
                              }))
                            }
                          />{" "}
                          Cho phép đăng
                        </label>

                        <label>
                          <input
                            type="checkbox"
                            checked={editForm.requireApproval}
                            onChange={(e) =>
                              setEditForm((current) => ({
                                ...current,
                                requireApproval: e.target.checked,
                              }))
                            }
                          />{" "}
                          Nhóm yêu cầu duyệt bài
                        </label>

                        <label>
                          Trạng thái:{" "}
                          <select
                            value={editForm.status}
                            onChange={(e) =>
                              setEditForm((current) => ({
                                ...current,
                                status: e.target.value,
                              }))
                            }
                            style={{
                              padding: "7px",
                              borderRadius: "6px",
                              border: "1px solid #ccc",
                            }}
                          >
                            <option value="active">active</option>
                            <option value="inactive">inactive</option>
                          </select>
                        </label>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                          marginTop: "15px",
                        }}
                      >
                        <PrimaryButton
                          onClick={() =>
                            handleSaveEdit(group)
                          }
                        >
                          💾 Lưu thay đổi
                        </PrimaryButton>

                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          style={{
                            padding: "10px 16px",
                            border: "1px solid #ccc",
                            borderRadius: "8px",
                            background: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CARD CŨ */}

                  <FacebookGroupCard
                    group={group}
                    onEdit={
                      handleEdit
                    }
                    onDelete={
                      handleDelete
                    }
                  />

                  {/* ACCOUNT CỦA GROUP */}

                  <div
                    style={{
                      marginTop:
                        "8px",
                      padding:
                        "15px",
                      border:
                        "1px solid #ddd",
                      borderRadius:
                        "10px",
                      background:
                        "#fafafa",
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
                        gap: "10px",
                        flexWrap:
                          "wrap",
                      }}
                    >

                      <div>
                        <strong>
                          👤 Tài khoản
                          Facebook
                        </strong>

                        <div
                          style={{
                            marginTop:
                              "6px",
                            color:
                              "#666",
                            fontSize:
                              "14px",
                          }}
                        >
                          {groupAccounts.length ===
                            0
                            ? "Chưa có tài khoản nào được phép đăng."
                            : groupAccounts
                              .map(
                                (
                                  account
                                ) =>
                                  account.name
                              )
                              .join(
                                " · "
                              )}
                        </div>
                      </div>

                      <PrimaryButton
                        onClick={() =>
                          handleOpenAccountManager(
                            group
                          )
                        }
                      >
                        👤 Quản lý tài khoản
                      </PrimaryButton>

                    </div>

                    {/* =========================
                        BẢNG CHỌN ACCOUNT
                    ========================== */}

                    {isManaging && (
                      <div
                        style={{
                          marginTop:
                            "15px",
                          padding:
                            "15px",
                          background:
                            "#fff8e1",
                          border:
                            "1px solid #f0c36d",
                          borderRadius:
                            "10px",
                        }}
                      >

                        <h3>
                          👤 Tài khoản được
                          phép đăng
                        </h3>

                        <p
                          style={{
                            color:
                              "#666",
                            fontSize:
                              "14px",
                          }}
                        >
                          Có thể chọn nhiều
                          tài khoản cho cùng
                          một nhóm.
                        </p>

                        {accounts.length ===
                          0 ? (
                          <div>
                            <p>
                              ⚠️ Chưa có
                              tài khoản
                              Facebook nào.
                            </p>

                            <PrimaryButton
                              onClick={() =>
                              (window.location.href =
                                "/facebook/accounts")
                              }
                            >
                              👤 Thêm tài khoản
                            </PrimaryButton>
                          </div>
                        ) : (
                          <>
                            {accounts.map(
                              (
                                account
                              ) => {
                                const checked =
                                  selectedAccountIds.includes(
                                    String(
                                      account.id
                                    )
                                  );

                                return (
                                  <label
                                    key={
                                      account.id
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
                                      borderRadius:
                                        "8px",
                                      cursor:
                                        "pointer",
                                    }}
                                  >

                                    <input
                                      type="checkbox"
                                      checked={
                                        checked
                                      }
                                      onChange={() =>
                                        handleToggleAccount(
                                          account.id
                                        )
                                      }
                                    />

                                    <span>
                                      👤{" "}
                                      <strong>
                                        {
                                          account.name
                                        }
                                      </strong>

                                      {account.isDefault && (
                                        <span
                                          style={{
                                            marginLeft:
                                              "8px",
                                            color:
                                              "#e31b23",
                                            fontSize:
                                              "13px",
                                          }}
                                        >
                                          ⭐ Mặc định
                                        </span>
                                      )}

                                      <span
                                        style={{
                                          marginLeft:
                                            "8px",
                                          color:
                                            account.status ===
                                              "active"
                                              ? "green"
                                              : "red",
                                          fontSize:
                                            "13px",
                                        }}
                                      >
                                        ●{" "}
                                        {
                                          account.status
                                        }
                                      </span>
                                    </span>

                                  </label>
                                );
                              }
                            )}

                            <div
                              style={{
                                marginTop:
                                  "12px",
                                display:
                                  "flex",
                                gap:
                                  "8px",
                                flexWrap:
                                  "wrap",
                              }}
                            >

                              <PrimaryButton
                                onClick={() =>
                                  handleSaveAccounts(
                                    group
                                  )
                                }
                              >
                                💾 Lưu tài khoản
                              </PrimaryButton>

                              <button
                                type="button"
                                onClick={
                                  handleCancelAccountManager
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
                          </>
                        )}

                      </div>
                    )}

                  </div>

                </div>
              );
            }
          )
        )}
      </SectionCard>

    </div>
  );
}

export default FacebookGroups;