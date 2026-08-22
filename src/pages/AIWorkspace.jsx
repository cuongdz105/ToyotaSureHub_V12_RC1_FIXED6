import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import "../styles/AIWorkspace.css";
import { generateAI } from "../ai/aiEngine";
import { AI_TYPES } from "../ai/aiTypes";
import { getCarById } from "../services/carService";

function AIWorkspace() {

    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);

    const [searchParams] = useSearchParams();
    const carId = searchParams.get("carId");
    const car = carId ? getCarById(carId) : null;

    const handleAI = async (type) => {

        setLoading(true);

        const content = await generateAI(type);

        setResult(content);

        setLoading(false);

    };

    return (

        <div className="ai-workspace">

            <div className="workspace-header">
                <h1>🤖 Toyota AI Workspace</h1>
                <p>Chọn loại nội dung muốn tạo.</p>
            </div>

           {car && (

    <div className="selected-car">

        <div className="car-header">

            <h2>
                🚗 {car.brand} {car.model} {car.version}
            </h2>

            <span className="car-status">
                {car.status}
            </span>

        </div>

        <div className="car-info">

            <p><strong>📅 Năm:</strong> {car.year}</p>

            <p><strong>🎨 Màu:</strong> {car.color}</p>

            <p><strong>📍 ODO:</strong> {car.odo.toLocaleString()} km</p>

            <p><strong>💰 Giá:</strong> {car.price} triệu</p>

            <p><strong>📑 Pháp lý:</strong> {car.legal}</p>

            <p><strong>🛡 Bảo hành:</strong> {car.warranty}</p>

        </div>

    </div>

)}

            <div className="ai-actions">

                {AI_TYPES.map((item) => (

                    <button
                        key={item.id}
                        onClick={() => handleAI(item.id)}
                    >
                        {item.icon} {item.title}
                    </button>

                ))}

            </div>

            <div className="ai-result">

                <h2>Kết quả</h2>

                <pre>

                    {loading
                        ? "🤖 AI đang tạo nội dung..."
                        : result || "Chưa có nội dung AI."}

                </pre>

            </div>

        </div>

    );

}

export default AIWorkspace;
