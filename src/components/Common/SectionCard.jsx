function SectionCard({ title, children }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,.08)",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: "16px",
        }}
      >
        {title}
      </h2>

      {children}
    </div>
  );
}

export default SectionCard;