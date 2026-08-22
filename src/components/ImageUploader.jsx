import { useRef } from "react";
import imageCompression from "browser-image-compression";

function ImageUploader({ images = [], setImages }) {
  const fileInputRef = useRef(null);

  async function handleSelectFiles(e) {
  const files = Array.from(e.target.files);

  if (files.length === 0) return;

  const newImages = await Promise.all(
  files.map(async (file) => 
        new Promise(async (resolve) => {

            const options = {
  maxSizeMB: 0.3,
  maxWidthOrHeight: 1600,
  useWebWorker: true,
};

const compressedFile = await imageCompression(
  file,
  options
);


          const reader = new FileReader();

          reader.onload = () => {
            resolve({
              id: Date.now() + Math.random(),
              preview: reader.result,
              name: file.name,
            });
          };

          reader.readAsDataURL(compressedFile);
        })
    )
  );


  setImages([...images, ...newImages]);
}

  function handleRemove(id) {
    setImages(images.filter((img) => img.id !== id));
  }

  function handleSetCover(id) {
  const selected = images.find((img) => img.id === id);

  if (!selected) return;

  const others = images.filter((img) => img.id !== id);

  setImages([selected, ...others]);
}

  return (
    <div className="form-group">
      <label>📷 Hình ảnh xe</label>

      <button
        type="button"
        className="add-btn"
        onClick={() => fileInputRef.current.click()}
      >
        ➕ Chọn ảnh
      </button>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleSelectFiles}
      />
            <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          marginTop: "15px",
        }}
      >
        {images.map((img) => (
          <div
            key={img.id}
            style={{
              position: "relative",
            }}
          >
            <img
              src={img.preview}
              alt=""
              style={{
                width: "120px",
                height: "90px",
                objectFit: "cover",
                borderRadius: "8px",
                border: "1px solid #ddd",
              }}
            />
<div
  style={{
    marginTop: "6px",
    textAlign: "center",
  }}
>
  {images[0]?.id === img.id ? (
    <span
      style={{
        color: "#16a34a",
        fontWeight: "bold",
        fontSize: "13px",
      }}
    >
      ⭐ Ảnh bìa
    </span>
  ) : (
    <button
      type="button"
      onClick={() => handleSetCover(img.id)}
      style={{
        fontSize: "12px",
        border: "none",
        background: "transparent",
        color: "#2563eb",
        cursor: "pointer",
      }}
    >
      Đặt làm ảnh bìa
    </button>
  )}
</div>
            <button
              type="button"
              onClick={() => handleRemove(img.id)}
              style={{
                position: "absolute",
                top: "-8px",
                right: "-8px",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                border: "none",
                background: "red",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
               ))}
      </div>

    </div>
  );
}

export default ImageUploader;