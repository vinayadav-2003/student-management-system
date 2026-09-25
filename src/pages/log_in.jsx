import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  loadCaptchaEnginge,
  LoadCanvasTemplateNoReload,
  validateCaptcha,
} from "react-simple-captcha";



const Login = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaInput, setCaptchaInput] = useState("");
  
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    loadCaptchaEnginge(6);
  }, []);

  const regenerateCaptcha = () => {
    loadCaptchaEnginge(6);
    setCaptchaInput("");
  };

  const handleLogin = async () => {
    setError("");

    if (!validateCaptcha(captchaInput)) {
      setError("Wrong CAPTCHA! Please try again.");
      regenerateCaptcha();
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/login", { email, password });

      if (res.data.success) {
        if (res.data.requiresPasswordChange) {
          localStorage.setItem("token", res.data.token);
          if (onLogin) onLogin();
          navigate("/change-password");
        } else {
          navigate("/otp", { state: { email, devOtp: res.data.devOtp } });
        }
      } else {
        setError("Invalid email or password.");
        regenerateCaptcha();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Try again.");
      regenerateCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setForgotSuccess("");
    if (!forgotEmail || !forgotEmail.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post("/api/forgot-password", { email: forgotEmail });
      if (res.data.success) {
        setForgotSuccess(res.data.message || "Temporary password sent! Check your inbox.");
        setForgotEmail("");
      } else {
        setError(res.data.error || "Failed to send temporary password.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send temporary password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-wrapper" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>

      <div className="form-card" style={{ width: "100%", maxWidth: "420px" }}>
        <div className="form-header">
          <div className="avatar-circle">🎓</div>
          <h5 className="text-white mb-0">Student Management System</h5>
          <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
            {forgotMode ? "Forgot Password" : "Sign in to continue"}
          </p>
        </div>

        <div className="p-4">
          {error && (
            <div className="alert alert-danger py-2 mb-3" style={{ fontSize: "13px" }}>
              {error}
            </div>
          )}

          {forgotSuccess && (
            <div className="alert alert-success py-2 mb-3" style={{ fontSize: "13px" }}>
              {forgotSuccess}
            </div>
          )}

          {forgotMode ? (
            <div>
              <div className="mb-4">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()}
                  placeholder="Enter your registered email"
                  autoComplete="email"
                />
              </div>

              <button
                className="btn btn-submit w-100 mb-3"
                onClick={handleForgotPassword}
                disabled={loading}
              >
                {loading ? "Sending Email..." : "Send Temporary Password"}
              </button>

              <div className="text-center mt-3">
                <button
                  type="button"
                  className="btn btn-link text-decoration-none"
                  style={{ fontSize: "13px", color: "#3b82f6" }}
                  onClick={() => {
                    setForgotMode(false);
                    setError("");
                    setForgotSuccess("");
                  }}
                >
                  ← Back to Login
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="admin@example.com"
                  autoComplete="email"
                />
              </div>

              <div className="mb-2">
                <label className="form-label">Password</label>
                <div className="input-group">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    placeholder="password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                <div className="text-end mt-2">
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none p-0"
                    style={{ fontSize: "13px", color: "#3b82f6" }}
                    onClick={() => {
                      setForgotMode(true);
                      setError("");
                      setForgotSuccess("");
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label d-flex justify-content-between align-items-center">
                  <span>CAPTCHA Verification</span>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary py-0 px-2"
                    onClick={regenerateCaptcha}
                    style={{ fontSize: "12px" }}
                  >
                    🔄 Refresh
                  </button>
                </label>

                <div className="border rounded p-2 mb-2 bg-light text-center">
                  <LoadCanvasTemplateNoReload />
                </div>

                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter CAPTCHA"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>

              <button
                className="btn btn-submit w-100"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Login;