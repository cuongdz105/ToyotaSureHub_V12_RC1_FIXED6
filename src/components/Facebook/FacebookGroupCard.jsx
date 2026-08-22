import { useMemo, useState } from "react";

import PrimaryButton from "../Common/PrimaryButton";
import SectionCard from "../Common/SectionCard";

import { getCurrentPosting } from "../../services/postingSessionService";
import { loadAccounts } from "../../services/facebookAccountService";

function FacebookGroupCard({
  group,
  onEdit,
  onDelete,
}) {
  const postingCar = getCurrentPosting();

  const [showAccounts, setShowAccounts] =
    useState(false);

  /*
   * ==========================================
   * TÌM CÁC ACCOUNT ĐƯỢC PHÉP ĐĂNG VÀO GROUP
   *
   * Quyền nằm ở ACCOUNT, không nằm ở GROUP.
   *
   * Account:
   * allowAllGroups = true
   *     => được đăng tất cả nhóm,
   *        trừ các nhóm bị loại trừ.
   *
   * Account:
   * allowAllGroups = false
   *     => chỉ được đăng các nhóm
   *        được chọn cụ thể.
   * ==========================================
   */

  const allowedAccounts = useMemo(() => {
    const accounts = loadAccounts();

    return accounts.filter((account) => {
      if (account.status !== "active") {
        return false;
      }

      /*
       * Cho phép tất cả nhóm
       */
      if (account.allowAllGroups === true) {
        const excludedGroups =
          Array.isArray(
            account.excludedGroupIds
          )
            ? account.excludedGroupIds
            : [];

        return !excludedGroups.some(
          (id) =>
            String(id) ===
            String(group.id)
        );
      }

      /*
       * Chế độ chọn nhóm cụ thể
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
          String(group.id)
      );
    });
  }, [group]);

  /*
   * ==========================================
   * COPY AI
   * ==========================================
   */

  function handleCopyAI() {
    if (!postingCar?.aiContent?.facebook) {
      alert(
        "⚠️ Chưa có nội dung Facebook AI."
      );
      return;
    }

    navigator.clipboard.writeText(
      postingCar.aiContent.facebook
    );

    alert(
      "✅ Đã copy bài Facebook."
    );
  }

  /*
   * ==========================================
   * ĐÁNH DẤU ĐÃ ĐĂNG
   * ==========================================
   */

  function handleMarkPosted() {
    alert(
      "✅ Đã đánh dấu đã đăng."
    );
  }

  /*
   * ==========================================
   * RENDER
   * ==========================================
   */

  return (
    <SectionCard
      title={`👥 ${group.name}`}
    >
      <p>
        ⭐ Rating:{" "}
        {group.rating || 0}/5
      </p>

      <p>
        🟢 Trạng thái:{" "}
        {group.status || "active"}
      </p>

      <p>
        📌 Đã đăng:{" "}
        {group.totalPosts || 0}
      </p>

      <p>
        👤 Lead:{" "}
        {group.leads || 0}
      </p>

      <p>
        💰 Xe bán:{" "}
        {group.soldCars || 0}
      </p>

      <p>
        🚗 Dòng xe:{" "}
        {Array.isArray(
          group.suitableCars
        ) &&
        group.suitableCars.length > 0
          ? group.suitableCars.join(", ")
          : "Chưa có"}
      </p>

      <br />

      {/* =====================================
          ACTION BUTTONS
      ====================================== */}

      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        {postingCar?.aiContent?.facebook && (
          <PrimaryButton
            onClick={handleCopyAI}
            style={{
              background: "#1976d2",
            }}
          >
            📋 Copy AI
          </PrimaryButton>
        )}

        {group.url && (
          <PrimaryButton
            onClick={() =>
              window.open(
                group.url,
                "_blank"
              )
            }
          >
            🌐 Mở nhóm
          </PrimaryButton>
        )}

        {/* =================================
            XEM TÀI KHOẢN
        ================================== */}

        <PrimaryButton
          onClick={() =>
            setShowAccounts(
              !showAccounts
            )
          }
          style={{
            background: "#7b1fa2",
          }}
        >
          👤{" "}
          {showAccounts
            ? "Ẩn tài khoản"
            : "Xem tài khoản"}
        </PrimaryButton>

        <PrimaryButton
          onClick={handleMarkPosted}
          style={{
            background: "#2e7d32",
          }}
        >
          ✅ Đã đăng
        </PrimaryButton>

        <PrimaryButton
          onClick={() =>
            onEdit(group)
          }
          style={{
            background: "#ff9800",
          }}
        >
          ✏️ Sửa
        </PrimaryButton>

        <PrimaryButton
          onClick={() =>
            onDelete(group.id)
          }
          style={{
            background: "#e53935",
          }}
        >
          🗑️ Xóa
        </PrimaryButton>
      </div>

      {/* =====================================
          DANH SÁCH ACCOUNT ĐƯỢC PHÉP ĐĂNG
      ====================================== */}

      {showAccounts && (
        <div
          style={{
            marginTop: "16px",
            padding: "16px",
            border:
              "1px solid #ddd",
            borderRadius: "10px",
            background: "#fafafa",
          }}
        >
          <h3
            style={{
              marginTop: 0,
            }}
          >
            👤 Tài khoản được phép đăng
          </h3>

          {allowedAccounts.length ===
          0 ? (
            <div
              style={{
                padding: "14px",
                background: "#fff3cd",
                borderRadius: "8px",
                color: "#856404",
              }}
            >
              ⚠️ Chưa có tài khoản
              Facebook nào được phép
              đăng vào nhóm này.
            </div>
          ) : (
            <>
              <p
                style={{
                  color: "#666",
                  marginTop: 0,
                }}
              >
                Có{" "}
                <strong>
                  {allowedAccounts.length}
                </strong>{" "}
                tài khoản có thể đăng
                vào nhóm này:
              </p>

              <div
                style={{
                  display: "grid",
                  gap: "8px",
                }}
              >
                {allowedAccounts.map(
                  (account) => (
                    <div
                      key={account.id}
                      style={{
                        padding:
                          "12px",
                        background:
                          "#fff",
                        border:
                          "1px solid #ddd",
                        borderRadius:
                          "8px",
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                      }}
                    >
                      <div>
                        <strong>
                          👤{" "}
                          {
                            account.name
                          }
                        </strong>

                        {account.isDefault && (
                          <span
                            style={{
                              marginLeft:
                                "8px",
                              background:
                                "#e11",
                              color:
                                "#fff",
                              padding:
                                "3px 7px",
                              borderRadius:
                                "12px",
                              fontSize:
                                "11px",
                            }}
                          >
                            ⭐ Mặc định
                          </span>
                        )}

                        {account.note && (
                          <div
                            style={{
                              marginTop:
                                "4px",
                              color:
                                "#666",
                              fontSize:
                                "13px",
                            }}
                          >
                            📝{" "}
                            {
                              account.note
                            }
                          </div>
                        )}
                      </div>

                      <span
                        style={{
                          color:
                            "#0aaf50",
                          fontWeight:
                            "600",
                          fontSize:
                            "13px",
                        }}
                      >
                        ● Được phép
                      </span>
                    </div>
                  )
                )}
              </div>
            </>
          )}

          <div
            style={{
              marginTop: "12px",
              color: "#666",
              fontSize: "13px",
            }}
          >
            💡 Quyền đăng được quản lý
            từ trang{" "}
            <strong>
              Facebook Accounts
            </strong>
            . Group không lưu trực tiếp
            tài khoản.
          </div>
        </div>
      )}
    </SectionCard>
  );
}

export default FacebookGroupCard;