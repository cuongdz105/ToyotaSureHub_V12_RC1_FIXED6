function PrimaryButton({
  children,
  onClick,
  type = "button",
  style = {},
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        background: "#d71920",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        padding: "12px 20px",
        cursor: "pointer",
        fontSize: "15px",
        fontWeight: "600",
        minHeight: "44px",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export default PrimaryButton;