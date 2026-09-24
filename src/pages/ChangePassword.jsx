import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  let isForced = false;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      isForced = !!payload.requiresPasswordChange;
    } catch (error) {
      console.error(error);
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
      setError("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (e.g. !@#$%^&*).");
      return;
    }

    if (newPassword === oldPassword) {
      setError("New password cannot be the same as your old/temporary password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/change-password", {
        oldPassword,
        newPassword,
      });

      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Password Updated!",
          text: isForced
            ? "Your password has been changed successfully. Please log in with your new password."
            : "Your password has been changed successfully.",
          confirmButtonColor: "#3b82f6",
        }).then(() => {
          if (isForced) {
            localStorage.removeItem("token");
            window.location.href = "/";
          } else {
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
            navigate("/read");
          }
        });
      } else {
        setError(res.data.error || "Failed to update password.");
      }
    } catch (err) {
      setError(
        err.response?.data?.error || "An error occurred while changing password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-wrapper" style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div className="form-card" style={{ width: "100%", maxWidth: "450px" }}>
        <div className="form-header" style={{ background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "2rem", textAlign: "center", color: "#ffffff" }}>
          <div className="avatar-circle" style={{ width: "64px", height: "64px", background: "#1e293b", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", border: "1px solid #334155", fontSize: "24px" }}>🔑</div>
          <h5 className="text-white mb-0">{isForced ? "Change Password Required" : "Change Password"}</h5>
          <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px", marginBottom: 0 }}>
            {isForced ? "Please update your temporary password to continue" : "Update your account password"}
          </p>
        </div>

        <div className="p-4">
          {error && (
            <div className="alert alert-danger py-2 mb-3" style={{ fontSize: "13px" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <div className="mb-3">
              <label className="form-label">{isForced ? "Old / Temporary Password" : "Old Password"}</label>
              <div className="input-group">
                <input
                  type={showOldPassword ? "text" : "password"}
                  className="form-control"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder={isForced ? "Enter temporary password" : "Enter old password"}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                >
                  {showOldPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Change password </label>
              <div className="input-group">
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label">Confirm New Password</label>
              <div className="input-group">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-submit w-100"
              disabled={loading}
              style={{ padding: "10px", fontWeight: "600" }}
            >
              {loading ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
