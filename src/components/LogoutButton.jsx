import { useAuth } from "../contexts/AuthContext";

function LogoutButton() {
  const { user, signOut } = useAuth();

  async function handleLogout() {
    const confirmed = window.confirm(
      "Ông có chắc muốn đăng xuất ToyotaSureHub không?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await signOut();
    } catch (error) {
      console.error(
        "ToyotaSureHub Logout Error:",
        error
      );

      alert(
        error?.message ||
          "Không thể đăng xuất."
      );
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      title={
        user?.email
          ? `Đăng nhập: ${user.email}`
          : "Đăng xuất"
      }
      style={{
        border: "none",
        borderRadius: 8,
        padding: "8px 12px",
        background: "#d71920",
        color: "#fff",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      🚪 Đăng xuất
    </button>
  );
}

export default LogoutButton;
