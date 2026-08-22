import { useState } from "react";

import {
  getCarsFromSupabase,
  createCarInSupabase,
  deleteCarFromSupabase,
} from "../services/carSupabaseService";

export default function SupabaseCarTest() {
  const [cars, setCars] = useState([]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================
  // READ
  // ==========================================

  const loadCars = async () => {
    try {
      setLoading(true);
      setResult("Đang đọc dữ liệu...");

      const data = await getCarsFromSupabase();

      setCars(data);

      setResult(
        `✅ Đọc Supabase thành công!\n\n` +
        `Số xe: ${data.length}`
      );
    } catch (error) {
      setResult(
        `❌ READ lỗi:\n${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // CREATE
  // ==========================================

  const addTestCar = async () => {
    try {
      setLoading(true);
      setResult("Đang tạo xe test...");

      const newCar = await createCarInSupabase({
        brand: "Toyota",
        model: "Vios",
        version: "TEST SUPABASE",
        year: 2026,
        color: "Đen",
        odo: 1000,
        price: 500,
        warranty: "TEST",
        legal: "TEST",
        status: "🟢 Đang bán",
        soldAt: null,
        notes: "XE TEST V12 - XÓA SAU KHI KIỂM TRA",

        aiContent: {
          facebook: "",
          tiktok: "",
          youtube: "",
          seo: "",
          thumbnail: "",
        },
      });

      setResult(
        `✅ CREATE thành công!\n\n` +
        `ID Supabase:\n${newCar.id}`
      );

      await loadCars();
    } catch (error) {
      setResult(
        `❌ CREATE lỗi:\n${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // DELETE
  // ==========================================

  const deleteTestCar = async (id) => {
    try {
      setLoading(true);
      setResult("Đang xóa xe test...");

      await deleteCarFromSupabase(id);

      setResult(
        `✅ DELETE thành công!\n\n` +
        `ID:\n${id}`
      );

      await loadCars();
    } catch (error) {
      setResult(
        `❌ DELETE lỗi:\n${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <div
      style={{
        padding: 40,
        fontFamily: "Arial, sans-serif",
      }}
    >

      <h1>Supabase Car CRUD Test</h1>

      <p>
        Trang này chỉ dùng để test Supabase.
        Không ảnh hưởng carService / LocalStorage.
      </p>


      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
        }}
      >

        <button
          onClick={loadCars}
          disabled={loading}
        >
          Đọc Cars
        </button>


        <button
          onClick={addTestCar}
          disabled={loading}
        >
          + Tạo xe TEST
        </button>

      </div>


      <pre
        style={{
          background: "#f5f5f5",
          padding: 20,
          borderRadius: 8,
          whiteSpace: "pre-wrap",
        }}
      >
        {result}
      </pre>


      <h2>
        Cars trên Supabase: {cars.length}
      </h2>


      <div>
        {cars.map((car) => (
          <div
            key={car.id}
            style={{
              border: "1px solid #ddd",
              padding: 15,
              marginBottom: 10,
              borderRadius: 8,
            }}
          >

            <strong>
              {car.brand} {car.model}
            </strong>

            <div>
              Version: {car.version}
            </div>

            <div>
              ID: {car.id}
            </div>

            <div>
              Giá: {car.price}
            </div>

            <button
              onClick={() =>
                deleteTestCar(car.id)
              }
              disabled={loading}
              style={{
                marginTop: 10,
              }}
            >
              Xóa xe này
            </button>

          </div>
        ))}
      </div>

    </div>
  );
}