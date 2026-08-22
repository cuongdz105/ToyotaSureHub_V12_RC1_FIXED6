function EmptyState({
  text = "Chưa có dữ liệu.",
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "40px",
        color: "#777",
      }}
    >
      📭

      <br />
      <br />

      {text}
    </div>
  );
}

export default EmptyState;