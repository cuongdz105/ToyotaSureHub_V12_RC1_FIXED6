import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    signIn,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return;
    }

    const target =
      location.state?.from || "/";

    navigate(target, { replace: true });
  }, [
    authLoading,
    isAuthenticated,
    location.state,
    navigate,
  ]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await signIn(
        cleanEmail,
        password
      );

      const target =
        location.state?.from || "/";

      navigate(target, { replace: true });
    } catch (err) {
      console.error(
        "ToyotaSureHub Login Error:",
        err
      );

      const message =
        err?.message || "";

      if (
        message
          .toLowerCase()
          .includes("invalid login credentials")
      ) {
        setError(
          "Email hoặc mật khẩu không đúng."
        );
      } else {
        setError(
          message ||
            "Không thể đăng nhập. Vui lòng thử lại."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background:
          "linear-gradient(135deg, #f5f6f8 0%, #eceff3 100%)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          background: "#fff",
          borderRadius: 18,
          padding: 32,
          boxShadow:
            "0 16px 45px rgba(0,0,0,0.12)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          <div
            style={{
              fontSize: 48,
              marginBottom: 8,
            }}
          >
            🚗
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 27,
            }}
          >
            ToyotaSureHub
          </h1>

          <p
            style={{
              margin:
                "8px 0 0",
              color: "#777",
            }}
          >
            🔐 Đăng nhập hệ thống
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
        >
          <label
            style={{
              display: "block",
              fontWeight: 700,
              marginBottom: 7,
            }}
          >
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            autoComplete="username"
            placeholder="Nhập email"
            disabled={submitting}
            style={{
              width: "100%",
              height: 46,
              padding:
                "0 13px",
              border:
                "1px solid #d7d7d7",
              borderRadius: 9,
              boxSizing: "border-box",
              marginBottom: 16,
              fontSize: 15,
            }}
          />

          <label
            style={{
              display: "block",
              fontWeight: 700,
              marginBottom: 7,
            }}
          >
            Mật khẩu
          </label>

          <div
            style={{
              position: "relative",
              marginBottom: 16,
            }}
          >
            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
              disabled={submitting}
              style={{
                width: "100%",
                height: 46,
                padding:
                  "0 48px 0 13px",
                border:
                  "1px solid #d7d7d7",
                borderRadius: 9,
                boxSizing: "border-box",
                fontSize: 15,
              }}
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  (value) => !value
                )
              }
              disabled={submitting}
              style={{
                position: "absolute",
                right: 8,
                top: 7,
                width: 34,
                height: 32,
                border: "none",
                background:
                  "transparent",
                cursor: "pointer",
              }}
              aria-label={
                showPassword
                  ? "Ẩn mật khẩu"
                  : "Hiện mật khẩu"
              }
            >
              {showPassword
                ? "🙈"
                : "👁️"}
            </button>
          </div>

          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: 11,
                borderRadius: 9,
                background: "#fff1f1",
                border:
                  "1px solid #ffcaca",
                color: "#b42318",
                fontSize: 14,
                lineHeight: 1.45,
              }}
            >
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              height: 48,
              border: "none",
              borderRadius: 9,
              background:
                submitting
                  ? "#999"
                  : "#d71920",
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
              cursor:
                submitting
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {submitting
              ? "⏳ Đang đăng nhập..."
              : "🔐 Đăng nhập"}
          </button>
        </form>

        <p
          style={{
            margin:
              "20px 0 0",
            textAlign: "center",
            color: "#888",
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          ToyotaSureHub • Chỉ dành cho người được cấp tài khoản
        </p>
      </div>
    </div>
  );
}

export default Login;
