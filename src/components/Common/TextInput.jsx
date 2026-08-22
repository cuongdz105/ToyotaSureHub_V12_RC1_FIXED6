function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "12px",
        minHeight: "44px",
        border: "1px solid #ddd",
        borderRadius: "10px",
        fontSize: "15px",
        boxSizing: "border-box",
      }}
    />
  );
}

export default TextInput;