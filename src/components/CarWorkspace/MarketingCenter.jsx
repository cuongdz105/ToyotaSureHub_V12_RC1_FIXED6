import "./MarketingCenter.css";
import { useNavigate } from "react-router-dom";

import CampaignEngine from "../../engine/CampaignEngine";
import PlatformCard from "./PlatformCard";
import { startPosting } from "../../services/postingSessionService";

function MarketingCenter({ car }) {

    const navigate = useNavigate();

    const ai = car.aiContent || {};

    const createCampaign = (platform) => {

        const campaign = CampaignEngine.start({
            carId: car.id,
            platform,
        });

        console.log(campaign);

        alert(`Đã tạo ${platform} Campaign`);
    };

    const handleFacebookWorkflow = () => {

    startPosting(car);

    navigate("/facebook/groups", { state: { carId: car.id } });

};

    const platforms = [
        {
            key: "facebook",
            icon: "📘",
            title: "Facebook",
            generated: !!ai.facebook,
        },
        {
            key: "tiktok",
            icon: "🎬",
            title: "TikTok",
            generated: !!ai.tiktok,
        },
        {
            key: "youtube",
            icon: "▶️",
            title: "YouTube",
            generated: !!ai.youtube,
        },
        {
            key: "seo",
            icon: "📰",
            title: "SEO",
            generated: !!ai.seo,
        },
    ];

    return (
        <div className="marketing-center">

            <button
                onClick={handleFacebookWorkflow}
                style={{
                    width: "100%",
                    marginBottom: 20,
                    padding: "14px",
                    fontSize: "18px",
                    borderRadius: "10px",
                    cursor: "pointer",
                }}
            >
                🚀 Bắt đầu đăng Facebook
            </button>

            <div className="marketing-grid">

                {platforms.map((platform) => (

                    <PlatformCard
                        key={platform.key}
                        icon={platform.icon}
                        title={platform.title}
                        generated={platform.generated}
                        published={false}
                        onView={() =>
                            alert(`Xem ${platform.title}`)
                        }
                        onPublish={() =>
                            createCampaign(platform.key)
                        }
                    />

                ))}

            </div>

        </div>
    );
}

export default MarketingCenter;