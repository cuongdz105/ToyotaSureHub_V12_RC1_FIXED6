import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import { addCar, updateCar } from "../services/carService";

import { brands } from "../data/brands";
import { colors } from "../data/colors";
import { warranties } from "../data/warranty";
import { legalTypes } from "../data/legal";
import { statusList } from "../data/status";

import ImageUploader from "./ImageUploader";

import {
  recognizeCarFromImages,
} from "../services/carVisionService";


function CarForm({ editCar }) {

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();


  // ==========================================
  // CAR DATA
  // ==========================================

  const [car, setCar] = useState(
    editCar || {
      brand: "Toyota",
      model: "",
      version: "",
      year: "",
      color: "",
      odo: "",
      warranty: "Toyota Sure",
      legal: "Cá nhân",
      status: "🟢 Đang bán",
      price: "",
      checked: true,
      accidentFree: true,
      engineOriginal: true,
      floodFree: true,
      fineFree: true,
      notes: "",
      images: [],
    }
  );


  // ==========================================
  // AI VISION STATE
  // ==========================================

  const [recognizingCar, setRecognizingCar] =
    useState(false);

  const [visionResult, setVisionResult] =
    useState(null);


  // ==========================================
  // SAVE STATE (chống bấm Lưu nhiều lần)
  // ==========================================

  const [saving, setSaving] = useState(false);


  // ==========================================
  // BRAND / MODEL / VERSION
  // ==========================================

  const selectedBrand = brands.find(
    (brand) => brand.name === car.brand
  );

  const models = selectedBrand
    ? selectedBrand.models
    : [];

  const selectedModel = models.find(
    (model) => model.name === car.model
  );

  const versions = selectedModel
    ? selectedModel.versions
    : [];


  // ==========================================
  // FORM CHANGE
  // ==========================================

  function handleChange(e) {

    const {
      name,
      value,
      type,
      checked,
    } = e.target;


    setCar((prev) => ({
      ...prev,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

  }


  // ==========================================
  // AI - NHẬN DIỆN XE
  // ==========================================

  async function handleRecognizeCar() {

    if (
      !Array.isArray(car.images) ||
      car.images.length === 0
    ) {

      alert(
        "📷 Ông cần tải ít nhất 1 ảnh xe trước."
      );

      return;
    }


    try {

      setRecognizingCar(true);

      setVisionResult(null);


      const result =
        await recognizeCarFromImages(
          car.images
        );


      setVisionResult(result);

    } catch (error) {

      console.error(
        "Vision AI error:",
        error
      );


      alert(
        error.message ||
        "Không thể nhận diện xe."
      );

    } finally {

      setRecognizingCar(false);

    }

  }


  // ==========================================
  // AI - DÙNG KẾT QUẢ
  // ==========================================

  function applyVisionResult() {

  if (!visionResult) {
    return;
  }

  setCar((prev) => ({
    ...prev,

    brand:
      visionResult.brand ||
      prev.brand,

    model:
      visionResult.model ||
      prev.model,

    version:
      visionResult.version ||
      prev.version,

    year:
      visionResult.year ||
      prev.year,

    color:
      visionResult.color ||
      prev.color,

    odo:
      visionResult.odo ||
      prev.odo,
  }));

  alert(
    "✅ Đã đưa kết quả AI vào form. Ông kiểm tra lại trước khi lưu xe."
  );
}


  // ==========================================
  // LƯU XE
  // ==========================================

  async function handleSave() {

    if (saving) {
      return;
    }


    if (!car.brand) {

      alert("Chọn hãng xe");

      return;
    }


    if (!car.model) {

      alert("Chọn dòng xe");

      return;
    }


    if (!car.version) {

      alert("Chọn phiên bản");

      return;
    }


    setSaving(true);


    try {

      // ==========================================
      // LƯU XE
      // ==========================================

      if (editCar) {

        try {
          await updateCar(car.id, car);
          alert("✅ Đã cập nhật xe");
        } catch (error) {
          console.error("Update car error:", error);
          alert(`❌ Không thể cập nhật xe: ${error?.message || error}`);
          return;
        }

      } else {

        try {

          await addCar(car);

          alert(
            "✅ Đã thêm xe vào Supabase"
          );

        } catch (error) {

          console.error(
            "Create car Supabase error:",
            error
          );

          alert(
            `❌ Không thể lưu xe: ${
              error.message || "Lỗi Supabase"
            }`
          );

          return;
        }
      }


      // ==========================================
      // NẾU ĐI TỪ FACEBOOK QUEUE
      // ==========================================

      const returnTo =
        searchParams.get("returnTo");

      const jobId =
        searchParams.get("jobId");


      if (returnTo === "queue") {

        const queueUrl = jobId
          ? `/facebook/queue?focusJobId=${encodeURIComponent(
              jobId
            )}`
          : "/facebook/queue";


        navigate(queueUrl);

        return;
      }


      // ==========================================
      // LUỒNG SỬA / THÊM XE BÌNH THƯỜNG
      // ==========================================

      navigate("/cars");

    } finally {

      setSaving(false);

    }

  }


  return (

    <div className="form-container">


      {/* ========================================
          1. HÌNH ẢNH XE
      ======================================== */}

      <div
        style={{
          background: "#fff",
          border: "1px solid #eee",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "25px",
        }}
      >

        <h2
          style={{
            marginTop: 0,
            marginBottom: "6px",
          }}
        >
          📷 1. Hình ảnh xe
        </h2>


        <p
          style={{
            color: "#777",
            marginTop: 0,
            marginBottom: "18px",
          }}
        >
          Tải ảnh xe lên trước. Toyota AI sẽ
          phân tích bộ ảnh để đề xuất thông tin xe.
        </p>


        <ImageUploader
          images={car.images}
          setImages={(images) =>
            setCar((prev) => ({
              ...prev,
              images,
            }))
          }
        />


        {/* ======================================
            AI BUTTON
        ====================================== */}

        <button
          type="button"
          onClick={handleRecognizeCar}
          disabled={
            recognizingCar ||
            !car.images?.length
          }
          style={{
            marginTop: "18px",
            padding: "13px 20px",
            border: "none",
            borderRadius: "9px",

            background:
              recognizingCar ||
              !car.images?.length
                ? "#aaa"
                : "#d71920",

            color: "#fff",
            fontSize: "15px",
            fontWeight: "bold",

            cursor:
              recognizingCar ||
              !car.images?.length
                ? "not-allowed"
                : "pointer",
          }}
        >

          {recognizingCar
            ? "⏳ AI đang phân tích..."
            : "🤖 Nhận diện xe bằng AI"}

        </button>


        {/* ======================================
            AI RESULT
        ====================================== */}

        {visionResult && (

          <div
            style={{
              marginTop: "20px",
              padding: "18px",
              borderRadius: "10px",
              background: "#f8fafc",
              border: "1px solid #ddd",
            }}
          >

            <h3
              style={{
                marginTop: 0,
              }}
            >
              🤖 Kết quả nhận diện
            </h3>


            <div
              style={{
                fontSize: "16px",
                lineHeight: "1.8",
              }}
            >

              <div>
                <strong>Hãng:</strong>{" "}
                {visionResult.brand || "—"}
              </div>


              <div>
                <strong>Dòng:</strong>{" "}
                {visionResult.model || "—"}
              </div>


              <div>
                <strong>Phiên bản:</strong>{" "}
                {visionResult.version || "—"}
              </div>


              <div>
                <strong>Năm:</strong>{" "}
                {visionResult.year || "—"}
              </div>


              <div>
                <strong>Màu:</strong>{" "}
                {visionResult.color || "—"}
              </div>


              <div>
                <strong>ODO:</strong>{" "}
                {visionResult.odo ||
                  "Không đọc được"}
              </div>

            </div>


            {/* CONFIDENCE */}

            {typeof visionResult.confidence ===
              "number" && (

              <div
                style={{
                  marginTop: "10px",
                  fontWeight: "bold",
                }}
              >

                🎯 Độ tin cậy:{" "}

                {Math.round(
                  visionResult.confidence * 100
                )}

                %

              </div>

            )}


            {/* APPLY */}

            <button
              type="button"
              onClick={applyVisionResult}
              style={{
                marginTop: "15px",
                padding: "11px 18px",
                border: "none",
                borderRadius: "8px",
                background: "#16a34a",
                color: "#fff",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              ✓ Dùng kết quả này
            </button>

          </div>

        )}

      </div>


      {/* ========================================
          2. THÔNG TIN XE
      ======================================== */}

      <h2>
        📝 2. Thông tin xe
      </h2>


      {/* HÃNG */}

      <div className="form-group">

        <label>
          Hãng xe
        </label>


        <select
          name="brand"
          value={car.brand}
          onChange={handleChange}
        >

          {brands.map((brand) => (

            <option
              key={brand.name}
              value={brand.name}
            >
              {brand.name}
            </option>

          ))}

        </select>

      </div>


      {/* DÒNG XE */}

      <div className="form-group">

        <label>
          Dòng xe
        </label>


        <select
          name="model"
          value={car.model}
          onChange={handleChange}
        >

          <option value="">
            -- Chọn dòng xe --
          </option>


          {models.map((model) => (

            <option
              key={model.name}
              value={model.name}
            >
              {model.name}
            </option>

          ))}

        </select>

      </div>


      {/* PHIÊN BẢN */}

      <div className="form-group">

        <label>
          Phiên bản
        </label>


        <select
          name="version"
          value={car.version}
          onChange={handleChange}
        >

          <option value="">
            -- Chọn phiên bản --
          </option>


          {versions.map((version) => (

            <option
              key={version.name}
              value={version.name}
            >
              {version.name}
            </option>

          ))}

        </select>

      </div>


      {/* NĂM */}

      <div className="form-group">

        <label>
          Năm sản xuất
        </label>


        <input
          type="number"
          name="year"
          value={car.year}
          onChange={handleChange}
        />

      </div>


      {/* MÀU */}

      <div className="form-group">

        <label>
          Màu xe
        </label>


        <select
          name="color"
          value={car.color}
          onChange={handleChange}
        >

          <option value="">
            -- Chọn màu xe --
          </option>


          {colors.map((color) => (

            <option
              key={color}
              value={color}
            >
              {color}
            </option>

          ))}

        </select>

      </div>


      {/* ODO */}

      <div className="form-group">

        <label>
          ODO (km)
        </label>


        <input
          type="number"
          name="odo"
          value={car.odo}
          onChange={handleChange}
        />

      </div>


      {/* GIÁ */}

      <div className="form-group">

        <label>
          Giá (triệu)
        </label>


        <input
          type="number"
          name="price"
          value={car.price}
          onChange={handleChange}
        />

      </div>


      {/* BẢO HÀNH */}

      <div className="form-group">

        <label>
          Bảo hành
        </label>


        <select
          name="warranty"
          value={car.warranty}
          onChange={handleChange}
        >

          {warranties.map((item) => (

            <option
              key={item}
              value={item}
            >
              {item}
            </option>

          ))}

        </select>

      </div>


      {/* PHÁP LÝ */}

      <div className="form-group">

        <label>
          Pháp lý
        </label>


        <select
          name="legal"
          value={car.legal}
          onChange={handleChange}
        >

          {legalTypes.map((item) => (

            <option
              key={item}
              value={item}
            >
              {item}
            </option>

          ))}

        </select>

      </div>


      {/* TRẠNG THÁI */}

      <div className="form-group">

        <label>
          Trạng thái
        </label>


        <select
          name="status"
          value={car.status}
          onChange={handleChange}
        >

          {statusList.map((item) => (

            <option
              key={item}
              value={item}
            >
              {item}
            </option>

          ))}

        </select>

      </div>


      {/* ========================================
          3. CAM KẾT TOYOTA SURE
      ======================================== */}

      <hr />


      <h3>
        🛡️ 3. Cam kết Toyota Sure
      </h3>


      {/* CHECKED */}

      <div className="form-group">

        <label>

          <input
            type="checkbox"
            name="checked"
            checked={car.checked}
            onChange={handleChange}
          />

          {" "}
          Đã kiểm định theo tiêu chuẩn
          Toyota Sure

        </label>

      </div>


      {/* ACCIDENT */}

      <div className="form-group">

        <label>

          <input
            type="checkbox"
            name="accidentFree"
            checked={car.accidentFree}
            onChange={handleChange}
          />

          {" "}
          Không tai nạn

        </label>

      </div>


      {/* ENGINE */}

      <div className="form-group">

        <label>

          <input
            type="checkbox"
            name="engineOriginal"
            checked={car.engineOriginal}
            onChange={handleChange}
          />

          {" "}
          Không bổ máy

        </label>

      </div>


      {/* FLOOD */}

      <div className="form-group">

        <label>

          <input
            type="checkbox"
            name="floodFree"
            checked={car.floodFree}
            onChange={handleChange}
          />

          {" "}
          Không ngập nước

        </label>

      </div>


      {/* FINE */}

      <div className="form-group">

        <label>

          <input
            type="checkbox"
            name="fineFree"
            checked={car.fineFree}
            onChange={handleChange}
          />

          {" "}
          Không phạt nguội

        </label>

      </div>


      {/* ========================================
          GHI CHÚ
      ======================================== */}

      <div className="form-group">

        <label>
          Ghi chú
        </label>


        <textarea
          name="notes"
          value={car.notes}
          onChange={handleChange}
          rows="4"
        />

      </div>


      {/* ========================================
          SAVE
      ======================================== */}

      <button
        type="button"
        className="save-btn"
        onClick={handleSave}
        disabled={saving}
        style={{
          opacity: saving ? 0.6 : 1,
          cursor: saving ? "not-allowed" : "pointer",
        }}
      >

        {saving ? "⏳ Đang lưu..." : "💾 Lưu xe"}

      </button>


    </div>
  );

}


export default CarForm;