import { useState } from "react";
import { useParams } from "react-router-dom";

import { getCarById, updateCar } from "../services/carService";
import Gallery from "../components/Gallery/Gallery";
import "../styles/CarWorkspace.css";

import {
  generateFacebookPost,
  generateYoutubeScript,
  generateYoutubePost,
  generateTikTokScript,
  generateTikTokPost,
  generateSEO,
  generateThumbnail,
} from "../services/aiService";

import AIResultModal from "../components/AIResultModal";
import AIMenu from "../components/AIMenu";
import { saveHistory } from "../ai/history/historyService";
import CarActionBar from "../components/CarWorkspace/CarActionBar";
import CarInfo from "../components/CarWorkspace/CarInfo";
import { generateAll } from "../services/aiBatchService";
import MarketingCenter from "../components/CarWorkspace/MarketingCenter";
import WorkspaceCard from "../components/CarWorkspace/Card/WorkspaceCard";
import AICenter from "../components/CarWorkspace/AICenter";

import {
  findResearchSamples,
  buildResearchContext,
} from "../services/contentResearchService";


function CarWorkspace() {

  const { id } = useParams();


  const [car, setCar] =
    useState(() => getCarById(id));


  const [showAI, setShowAI] =
    useState(false);


  const [aiTitle, setAiTitle] =
    useState("");


  const [aiContent, setAiContent] =
    useState("");


  const [loadingAI, setLoadingAI] =
    useState(false);


  const [showMenu, setShowMenu] =
    useState(false);


  const [regenerateAction, setRegenerateAction] =
    useState(null);


  // =======================================
  // REFRESH XE
  // =======================================

  const refreshCar = () => {

    const updatedCar =
      getCarById(id);


    if (updatedCar) {

      setCar(updatedCar);

    }

  };


  // =======================================
  // RESEARCH CONTEXT
  // =======================================

  const getResearchContext =
    async (platform) => {

      const samples =
        await findResearchSamples(
          car,
          platform,
          5
        );


      return buildResearchContext(
        samples
      );

    };


  // =======================================
  // YOUTUBE - KỊCH BẢN QUAY
  // =======================================

  const handleYoutubeScript =
    async () => {

      setLoadingAI(true);

      setShowAI(true);

      setShowMenu(false);


      setAiTitle(
        "🎬 Kịch bản quay YouTube"
      );


      setRegenerateAction(
        () => handleYoutubeScript
      );


      try {

        console.log(
          "🔎 Đang tìm Research cho kịch bản YouTube..."
        );


        const researchContext =
          await getResearchContext(
            "youtube"
          );


        console.log(
          "📚 YouTube Script Research:",
          researchContext
        );


        const result =
  await generateYoutubeScript(
    car,
    researchContext
  );


        updateCar(
          car.id,
          {
            aiContent: {
              ...(car.aiContent || {}),
              youtubeScript:
                result,
            },
          }
        );


        refreshCar();


        setAiContent(
          result
        );


        saveHistory({

          type:
            "YouTube Script",

          title:
            "🎬 Kịch bản quay YouTube",

          car:
            `${car.brand} ${car.model} ${car.year}`,

          content:
            result,

        });


      } catch (error) {

        console.error(
          "YouTube Script Error:",
          error
        );


        setAiTitle(
          "Lỗi"
        );


        setAiContent(
          "Không thể tạo kịch bản quay YouTube."
        );

      } finally {

        setLoadingAI(false);

      }

    };


  // =======================================
  // YOUTUBE - NỘI DUNG ĐĂNG
  // =======================================

  const handleYoutubePost =
    async () => {

      setLoadingAI(true);

      setShowAI(true);

      setShowMenu(false);


      setAiTitle(
        "📝 Nội dung đăng YouTube"
      );


      setRegenerateAction(
        () => handleYoutubePost
      );


      try {

        const researchContext =
  await getResearchContext(
    "youtube"
  );

const result =
  await generateYoutubePost(
    car,
    researchContext
  );


        updateCar(
          car.id,
          {
            aiContent: {
              ...(car.aiContent || {}),
              youtube:
                result,
            },
          }
        );


        refreshCar();


        setAiContent(
          result
        );


        saveHistory({

          type:
            "YouTube Post",

          title:
            "📝 Nội dung đăng YouTube",

          car:
            `${car.brand} ${car.model} ${car.year}`,

          content:
            result,

        });


      } catch (error) {

        console.error(
          "YouTube Post Error:",
          error
        );


        setAiTitle(
          "Lỗi"
        );


        setAiContent(
          "Không thể tạo nội dung đăng YouTube."
        );

      } finally {

        setLoadingAI(false);

      }

    };


  // =======================================
  // FACEBOOK AI
  // =======================================

  const handleToyotaAI =
    async () => {

      try {

        setLoadingAI(true);

        setShowAI(true);

        setShowMenu(false);


        setAiTitle(
          "🤖 Toyota AI - Facebook"
        );


        setRegenerateAction(
          () => handleToyotaAI
        );


        const result =
          await generateFacebookPost(
            car
          );


        updateCar(
          car.id,
          {
            aiContent: {
              ...(car.aiContent || {}),
              facebook:
                result,
            },
          }
        );


        refreshCar();


        setAiContent(
          result
        );


        saveHistory({

          type:
            "Facebook",

          title:
            "🤖 Toyota AI - Facebook",

          car:
            `${car.brand} ${car.model} ${car.year}`,

          content:
            result,

        });


      } catch (error) {

        console.error(
          "Facebook AI Error:",
          error
        );


        setAiTitle(
          "Lỗi"
        );


        setAiContent(
          "Không thể tạo nội dung Facebook."
        );

      } finally {

        setLoadingAI(false);

      }

    };


  // =======================================
  // TIKTOK - KỊCH BẢN QUAY
  // =======================================

  const handleTikTokScript =
    async () => {

      setLoadingAI(true);

      setShowAI(true);

      setShowMenu(false);


      setAiTitle(
        "🎬 Kịch bản quay TikTok"
      );


      setRegenerateAction(
        () => handleTikTokScript
      );


      try {

        console.log(
          "🔎 Đang tìm Research cho kịch bản TikTok..."
        );


        const researchContext =
          await getResearchContext(
            "tiktok"
          );


        console.log(
          "📚 TikTok Script Research:",
          researchContext
        );


        const result =
  await generateTikTokScript(
    car,
    researchContext
  );


        updateCar(
          car.id,
          {
            aiContent: {
              ...(car.aiContent || {}),
              tiktokScript:
                result,
            },
          }
        );


        refreshCar();


        setAiContent(
          result
        );


        saveHistory({

          type:
            "TikTok Script",

          title:
            "🎬 Kịch bản quay TikTok",

          car:
            `${car.brand} ${car.model} ${car.year}`,

          content:
            result,

        });


      } catch (error) {

        console.error(
          "TikTok Script Error:",
          error
        );


        setAiTitle(
          "Lỗi"
        );


        setAiContent(
          "Không thể tạo kịch bản quay TikTok."
        );

      } finally {

        setLoadingAI(false);

      }

    };


  // =======================================
  // TIKTOK - NỘI DUNG ĐĂNG
  // =======================================

  const handleTikTokPost =
    async () => {

      setLoadingAI(true);

      setShowAI(true);

      setShowMenu(false);


      setAiTitle(
        "📝 Nội dung đăng TikTok"
      );


      setRegenerateAction(
        () => handleTikTokPost
      );


      try {

       const researchContext =
  await getResearchContext(
    "tiktok"
  );

const result =
  await generateTikTokPost(
    car,
    researchContext
  );


        updateCar(
          car.id,
          {
            aiContent: {
              ...(car.aiContent || {}),
              tiktok:
                result,
            },
          }
        );


        refreshCar();


        setAiContent(
          result
        );


        saveHistory({

          type:
            "TikTok Post",

          title:
            "📝 Nội dung đăng TikTok",

          car:
            `${car.brand} ${car.model} ${car.year}`,

          content:
            result,

        });


      } catch (error) {

        console.error(
          "TikTok Post Error:",
          error
        );


        setAiTitle(
          "Lỗi"
        );


        setAiContent(
          "Không thể tạo nội dung đăng TikTok."
        );

      } finally {

        setLoadingAI(false);

      }

    };


  // =======================================
  // SEO
  // =======================================

  const handleSEOAI =
    async () => {

      setLoadingAI(true);

      setShowAI(true);

      setShowMenu(false);


      setAiTitle(
        "📰 SEO AI"
      );


      try {

        const result =
          await generateSEO(
            car
          );


        updateCar(
          car.id,
          {
            aiContent: {
              ...(car.aiContent || {}),
              seo:
                result,
            },
          }
        );


        refreshCar();


        setAiContent(
          result
        );


        saveHistory({

          type:
            "SEO",

          title:
            "SEO AI",

          car:
            `${car.brand} ${car.model} ${car.year}`,

          content:
            result,

        });


      } catch (error) {

        console.error(
          "SEO AI Error:",
          error
        );


        setAiTitle(
          "Lỗi"
        );


        setAiContent(
          "Không thể tạo SEO AI."
        );

      } finally {

        setLoadingAI(false);

      }

    };


  // =======================================
  // THUMBNAIL
  // =======================================

  const handleThumbnailAI =
    async () => {

      setLoadingAI(true);

      setShowAI(true);

      setShowMenu(false);


      setAiTitle(
        "🖼 Thumbnail AI"
      );


      try {

        const result =
          await generateThumbnail(
            car
          );


        updateCar(
          car.id,
          {
            aiContent: {
              ...(car.aiContent || {}),
              thumbnail:
                result,
            },
          }
        );


        refreshCar();


        setAiContent(
          result
        );


      } catch (error) {

        console.error(
          "Thumbnail AI Error:",
          error
        );


        setAiTitle(
          "Lỗi"
        );


        setAiContent(
          "Không thể tạo Thumbnail AI."
        );

      } finally {

        setLoadingAI(false);

      }

    };


  // =======================================
  // COPY ALL
  // =======================================

  const handleCopyAll =
    () => {

      const ai =
        car.aiContent || {};


      const content =
        `📘 FACEBOOK
${ai.facebook || "Chưa có"}

==============================

🎬 TIKTOK - KỊCH BẢN
${ai.tiktokScript || "Chưa có"}

==============================

📝 TIKTOK - NỘI DUNG ĐĂNG
${ai.tiktok || "Chưa có"}

==============================

▶️ YOUTUBE - KỊCH BẢN
${ai.youtubeScript || "Chưa có"}

==============================

📝 YOUTUBE - NỘI DUNG ĐĂNG
${ai.youtube || "Chưa có"}

==============================

📰 SEO
${ai.seo || "Chưa có"}

==============================

🖼 THUMBNAIL
${ai.thumbnail || "Chưa có"}
`;


      navigator.clipboard
        .writeText(
          content
        );


      alert(
        "✅ Đã copy toàn bộ AI!"
      );

    };


  // =======================================
  // DOWNLOAD
  // =======================================

  const handleDownloadAI =
    () => {

      const blob =
        new Blob(
          [aiContent],
          {
            type:
              "text/plain;charset=utf-8",
          }
        );


      const url =
        URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          "a"
        );


      link.href =
        url;


      link.download =
        `${aiTitle}.txt`;


      document.body.appendChild(
        link
      );


      link.click();


      document.body.removeChild(
        link
      );


      URL.revokeObjectURL(
        url
      );

    };


  // =======================================
  // OPEN SAVED AI
  // =======================================

  const openSavedAI =
    (type) => {

      const ai =
        car.aiContent || {};


      const content =
        ai[type];


      if (!content) {

        alert(
          "Chưa có nội dung."
        );

        return;

      }


      setAiTitle(
        `🤖 ${type.toUpperCase()}`
      );


      setAiContent(
        content
      );


      setLoadingAI(
        false
      );


      setShowAI(
        true
      );

    };


  // =======================================
  // GENERATE ALL
  // =======================================

  const handleGenerateAll =
    async () => {

      try {

        setLoadingAI(
          true
        );


        const result =
          await generateAll(
            car
          );


        updateCar(
          car.id,
          {
            aiContent:
              result,
          }
        );


        setAiTitle(
          "🚀 Generate All"
        );


        setAiContent(
          "✅ Đã tạo Facebook\n" +
          "✅ Đã tạo TikTok\n" +
          "✅ Đã tạo YouTube\n" +
          "✅ Đã tạo SEO\n" +
          "✅ Đã tạo Thumbnail"
        );


        setShowAI(
          true
        );


      } catch (err) {

        console.error(
          err
        );

      } finally {

        setLoadingAI(
          false
        );

      }

    };


  // =======================================
  // NO CAR
  // =======================================

  if (!car) {

    return (

      <div className="app">

        <main className="content">

          <h2>
            ❌ Không tìm thấy xe
          </h2>

        </main>

      </div>

    );

  }


  return (

    <div className="app">

      <main className="content">

        <h1>
          🚗 Car Workspace
        </h1>

        <p>
          Quản lý toàn bộ nội dung
          của chiếc xe.
        </p>


        <CarActionBar

          onBack={() => {}}

          onEdit={() => {}}

          onDelete={() => {}}

          onAI={() =>
            setShowMenu(
              true
            )
          }


          onFacebook={() => {

            console.log(
              "Facebook",
              car
            );

          }}


          onTikTok={() => {

            console.log(
              "TikTok",
              car
            );

          }}


          onYoutube={() => {

            console.log(
              "YouTube",
              car
            );

          }}

        />


        <WorkspaceCard
          title="📦 Thông tin xe"
        >

          <CarInfo
            car={car}
            onViewAI={
              openSavedAI
            }
          />

        </WorkspaceCard>


        <WorkspaceCard
          title="📸 Hình ảnh"
        >

          <Gallery
            images={
              car.images
            }
          />

        </WorkspaceCard>


        <WorkspaceCard
          title="🤖 AI Center"
        >

          <AICenter

            car={
              car
            }

            onViewAI={
              openSavedAI
            }

            onGenerateAll={
              handleGenerateAll
            }

            onSalesChat={() => {

              alert(
                "🚧 AI Sales Assistant đang phát triển..."
              );

            }}

          />

        </WorkspaceCard>


        <WorkspaceCard
          title="📣 Marketing"
        >

          <MarketingCenter
            car={
              car
            }
          />

        </WorkspaceCard>

      </main>


      {/* =====================================
          AI MENU
      ===================================== */}

      <AIMenu

        open={
          showMenu
        }

        onClose={() =>
          setShowMenu(
            false
          )
        }


        onGenerateAll={() => {

          handleGenerateAll();

        }}


        onFacebook={() => {

          handleToyotaAI();

        }}


        onYoutubeScript={() => {

          handleYoutubeScript();

        }}


        onYoutubePost={() => {

          handleYoutubePost();

        }}


        onTikTokScript={() => {

          handleTikTokScript();

        }}


        onTikTokPost={() => {

          handleTikTokPost();

        }}


        onSEO={() => {

          handleSEOAI();

        }}


        onThumbnail={() => {

          handleThumbnailAI();

        }}

      />


      {/* =====================================
          AI RESULT
      ===================================== */}

      <AIResultModal

        open={
          showAI
        }

        title={
          aiTitle
        }

        content={
          aiContent
        }

        loading={
          loadingAI
        }

        onClose={() =>
          setShowAI(
            false
          )
        }

        onCopy={() => {

          navigator.clipboard
            .writeText(
              aiContent
            );

          alert(
            "✅ Đã copy nội dung!"
          );

        }}

        onCopyAll={
          handleCopyAll
        }

        onDownload={
          handleDownloadAI
        }

        onRegenerate={
          regenerateAction
        }

      />

    </div>

  );

}

export default CarWorkspace;