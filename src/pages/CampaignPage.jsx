import { useState } from "react";
import CampaignEngine from "../engine/CampaignEngine";

function CampaignPage() {
    const [campaigns, setCampaigns] = useState(
    CampaignEngine.getAll()
);

const [campaignName, setCampaignName] = useState("");

const createCampaign = () => {
    CampaignEngine.start({
        name: campaignName || `Campaign ${campaigns.length + 1}`,
        status: "draft",
        createdAt: new Date().toISOString(),
    });

    setCampaigns(CampaignEngine.getAll());
    setCampaignName("");
};

    return (
        <div style={{ padding: "30px" }}>
            <h1>📣 Facebook Campaign</h1>

          <div style={{ marginTop: "20px" }}>
    <input
        type="text"
        placeholder="Nhập tên Campaign..."
        value={campaignName}
        onChange={(e) => setCampaignName(e.target.value)}
        style={{
            width: "320px",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            marginRight: "12px",
        }}
    />

    <button
        onClick={createCampaign}
        style={{
            padding: "10px 18px",
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
        }}
    >
        ➕ Tạo Campaign
    </button>
</div>

            <div
                style={{
                    marginTop: "20px",
                    padding: "20px",
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    background: "#fff",
                }}
            >
                <h3>📊 Tổng Campaign</h3>

                <h2>{campaigns.length}</h2>

                <p>Campaign đang lưu trong hệ thống.</p>
            </div>
        </div>
    );
}

export default CampaignPage;