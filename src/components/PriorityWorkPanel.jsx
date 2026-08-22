import { useEffect, useState } from "react";
import { subscribe as subscribeAppData } from "../services/appDataStore";
import { useNavigate } from "react-router-dom";

import {
  getDashboardWorkItems,
} from "../services/dashboardWorkService";

/*
 * ToyotaSureHub V12
 * Dashboard Priority Work Center
 *
 * Mục tiêu:
 * - Dashboard không còn chỉ hiển thị số liệu.
 * - Hiển thị "việc tiếp theo nên làm".
 * - Nếu Queue/Campaign đang dở -> đi thẳng Queue.
 * - Nếu là xe mới cần đăng -> chuyển sang Facebook Posting
 *   bằng React Router state để bước tiếp theo nhận đúng xe/account.
 *
 * LƯU Ý:
 * Intent workflow chỉ truyền qua React Router state;
 * không dùng browser storage làm nguồn dữ liệu nghiệp vụ.
 */

function formatCarLabel(task) {
  if (task?.carLabel) {
    return task.carLabel;
  }

  if (task?.car) {
    const car = task.car;

    let odo = "";

    if (
      car.odo !== undefined &&
      car.odo !== null &&
      car.odo !== ""
    ) {
      const odoValue = Number(car.odo);

      if (!Number.isNaN(odoValue)) {
        // ToyotaSureHub quy ước:
        // 5.5 = 5,5 vạn km
        // 8.6 = 8,6 vạn km
        // 12 = 12 vạn km

        odo = `${odoValue.toLocaleString("vi-VN", {
          maximumFractionDigits: 1,
        })} vạn km`;
      }
    }

    return [
      car.brand,
      car.model,
      car.version,
      car.year,
      car.color,
      odo,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  return task?.carId
    ? `Xe #${task.carId}`
    : "Xe chưa xác định";
}

function getTaskMeta(task) {

  if (task.type === "queue") {
    return {
      icon: "📋",
      title: "Đang có việc Facebook dở",
      button: "📋 Vào Queue",
    };
  }

  return {
    icon: "🚀",
    title: "Xe cần được đẩy tin",
    button: "🚀 Bắt đầu đăng",
  };
}


function PriorityWorkPanel() {

  const navigate = useNavigate();

  const [tasks, setTasks] =
    useState([]);

  const [loading, setLoading] =
    useState(true);


  async function refresh() {

    try {

      setLoading(true);

      const items = await getDashboardWorkItems();

      setTasks(
        Array.isArray(items) ? items : []
      );

    } catch (error) {

      console.error(
        "V11 Priority Work Panel:",
        error
      );

      setTasks([]);

    } finally {

      setLoading(false);

    }
  }


  useEffect(() => {

    refresh();

    const handleStoreChange = () => {
      refresh();
    };

    const unsubscribe =
      subscribeAppData(handleStoreChange);

    return () => {
      unsubscribe();
    };

  }, []);


  function handleTask(task) {

    if (!task?.carId) {
      return;
    }


    /*
     * ================================
     * QUEUE
     * ================================
     */

    if (task.type === "queue") {

      navigate("/facebook/queue");

      return;
    }


    /*
     * ================================
     * BẮT ĐẦU CHIẾN DỊCH MỚI
     * ================================
     *
     * Không nhét full car vào URL.
     *
     * Chỉ truyền:
     * - carId
     * - accountId gợi ý
     *
     * Facebook Posting sẽ lấy xe thật
     * từ carService.
     */

    navigate("/facebook/post", {
      state: {
        carId: task.carId,
        accountId: task.accountId ?? null,
      },
    });
  }


  /*
   * ================================
   * LOADING
   * ================================
   */

  if (loading) {

    return (

      <section className="section-card">

        <div
          style={{
            padding: 20,
            color: "#666",
          }}
        >
          🧠 Đang tính việc ưu tiên...
        </div>

      </section>

    );
  }


  /*
   * ================================
   * UI
   * ================================
   */

  return (

    <section className="section-card">

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
        }}
      >

        <div>

          <h2
            style={{
              margin: 0,
            }}
          >
            🧠 Việc tiếp theo
          </h2>


          <p
            style={{
              margin: "5px 0 0",
              color: "#777",
            }}
          >
            ToyotaSureHub tự xếp thứ tự ưu tiên
            dựa trên Queue, Campaign và tình trạng xe.
          </p>

        </div>


        <button
          type="button"
          onClick={refresh}
          style={{
            border: "1px solid #ddd",
            background: "#fff",
            borderRadius: 8,
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          ↻ Cập nhật
        </button>

      </div>


      {tasks.length === 0 ? (

        <div
          style={{
            padding: 20,
            border: "1px dashed #ddd",
            borderRadius: 10,
            color: "#777",
          }}
        >
          🎉 Hiện chưa có việc Facebook cần ưu tiên.
        </div>

      ) : (

        <div
          style={{
            display: "grid",
            gap: 10,
          }}
        >

          {tasks.map((task, index) => {

            const meta =
              getTaskMeta(task);


            return (

              <div
                key={`${task.carId}-${index}`}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "38px minmax(0, 1fr) auto",
                  alignItems: "center",
                  gap: 12,
                  padding: 14,
                  border:
                    "1px solid #e8e8e8",
                  borderRadius: 12,
                  background:
                    index === 0
                      ? "#fffaf0"
                      : "#fff",
                }}
              >

                {/* ICON */}

                <div
                  style={{
                    fontSize: 24,
                    textAlign: "center",
                  }}
                >
                  {meta.icon}
                </div>


                {/* CONTENT */}

                <div
                  style={{
                    minWidth: 0,
                  }}
                >

                  <div
                    style={{
                      fontWeight: 700,
                    }}
                  >
                    {formatCarLabel(task) ||
                      `Xe #${task.carId}`}
                  </div>


                  <div
                    style={{
                      marginTop: 3,
                      color: "#666",
                      fontSize: 13,
                    }}
                  >
                    {meta.title}
                    {" · "}
                    <strong>
                      {task.score}
                    </strong>{" "}
                    điểm
                  </div>


                  <div
                    style={{
                      marginTop: 6,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                    }}
                  >

                    {(task.reasons || []).map(
                      (reason) => (

                        <span
                          key={reason}
                          style={{
                            fontSize: 12,
                            padding:
                              "4px 7px",
                            borderRadius: 999,
                            background:
                              "#f3f3f3",
                          }}
                        >
                          {reason}
                        </span>

                      )
                    )}

                  </div>

                </div>


                {/* ACTION */}

                <button
                  type="button"
                  onClick={() =>
                    handleTask(task)
                  }
                  style={{
                    border: "none",
                    borderRadius: 9,
                    padding:
                      "10px 14px",
                    background:
                    task.type === "queue"
                        ? "#f3f3f3"
                        : "#d71920",

                    color:
                    task.type === "queue"
                        ? "#111"
                        : "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace:
                      "nowrap",
                  }}
                >
                  {meta.button}
                </button>

              </div>

            );

          })}

        </div>

      )}

    </section>

  );
}


export default PriorityWorkPanel;

