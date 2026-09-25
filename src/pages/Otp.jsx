import { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

function Otp({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;
  const devOtp = location.state?.devOtp;

  const [otp, setOtp] = useState(devOtp || "");

  const verifyOtp = async () => {
    try {
      const res = await axios.post("/verify-otp", { email, otp });

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);

        if (onLogin) onLogin();

        const redirectTo = sessionStorage.getItem("redirectAfterLogin");
        sessionStorage.removeItem("redirectAfterLogin");

        navigate(redirectTo || "/read", { replace: true });
        
      } else {
        alert("Wrong OTP. Please try again.");
      }
    } catch {
      alert("OTP Verification Failed");
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex justify-content-center align-items-center bg-light">
      <div
        className="card shadow-lg border-0"
        style={{ width: "400px", borderRadius: "20px" }}
      >
        <div
          className="text-center text-white p-4"
          style={{
            background: "#08122F",
            borderTopLeftRadius: "20px",
            borderTopRightRadius: "20px",
          }}
        >
          <h2>OTP Verification</h2>
          <p className="mb-0">Enter the OTP to continue</p>
        </div>

        <div className="p-4">
          {devOtp && (
            <div className="alert alert-info py-2 px-3 mb-3 small text-center">
              🔑 OTP: <strong>{devOtp}</strong> (Auto-filled)
            </div>
          )}
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="text"
              className="form-control"
              value={email || ""}
              disabled
            />
          </div>

          <div className="mb-4">
            <label className="form-label">OTP</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
            />
          </div>

          <button className="btn btn-primary w-100" onClick={verifyOtp}>
            Verify OTP
          </button>
        </div>
      </div>
    </div>
  );
}

export default Otp;