import { useState } from "react";

function Gallery({ images = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  function handlePrev() {
  if (currentIndex === 0) {
    setCurrentIndex(images.length - 1);
  } else {
    setCurrentIndex(currentIndex - 1);
  }
}

function handleNext() {
  if (currentIndex === images.length - 1) {
    setCurrentIndex(0);
  } else {
    setCurrentIndex(currentIndex + 1);
  }
}

  if (images.length === 0) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          border: "1px dashed #ccc",
          borderRadius: "10px",
        }}
      >
        Chưa có hình ảnh
      </div>
    );
  }

  return (
    <div>
      <img
        src={images[currentIndex].preview}
        alt=""
       style={{
    width:"100%",
    height:"520px",
    objectFit:"cover",
    borderRadius:"10px",
    cursor:"pointer",
    transition:"0.25s",
}}
      />
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "15px",
  }}
>
  <button
    className="add-btn"
    onClick={handlePrev}
  >
    ◀ Trước
  </button>

  <strong>
    {currentIndex + 1} / {images.length}
  </strong>

  <button
    className="add-btn"
    onClick={handleNext}
  >
    Sau ▶
  </button>
</div>

      <div
  style={{
    display: "flex",
    gap: "10px",
    marginTop: "15px",
    flexWrap: "wrap",
  }}
>
  {images.map((image, index) => (
    <img
      key={image.id}
      src={image.preview}
      alt=""
      onClick={() => setCurrentIndex(index)}
      style={{
        width: "90px",
        height: "70px",
        objectFit: "cover",
        borderRadius: "8px",
        cursor: "pointer",
        border:
          currentIndex === index
            ? "3px solid #e60012"
            : "2px solid #ddd",
      }}
    />
  ))}
</div>
    </div>
  );
}

export default Gallery;