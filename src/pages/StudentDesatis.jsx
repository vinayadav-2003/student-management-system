import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getStudent, approveStudent, getUsers } from "../api";
import Swal from "sweetalert2";

function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const approvalSectionRef = useRef(null);
  const [student, setStudent] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [decision, setDecision] = useState("");
  const [remarks, setRemarks] = useState("");
  const [forwardUserId, setForwardUserId] = useState("");
  const [users, setUsers] = useState([]);

  const getRole = () => {
    const token = localStorage.getItem("token");
    if (!token) return localStorage.getItem("role")?.toUpperCase();
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.role?.toUpperCase() || localStorage.getItem("role")?.toUpperCase();
    } catch {
      return localStorage.getItem("role")?.toUpperCase();
    }
  };
  const role = getRole();

  const handleApproveReject = async () => {
    if (!decision) {
      Swal.fire({
        icon: "warning",
        title: "Select an option",
        text: "Please select Approve, Reject, Return or Forward",
      });
      return;
    }
    if (!remarks) {
      Swal.fire({
        icon: "warning",
        title: "Enter Remarks",
        text: "Please enter remarks",
      });
      return;
    }
    if (decision === "Forward" && !forwardUserId) {
      Swal.fire({
        icon: "warning",
        title: "Select User",
        text: "Please select a user to forward to",
      });
      return;
    }

    const confirmResult = await Swal.fire({
      icon:
        decision === "Approved"
          ? "success"
          : decision === "Rejected"
          ? "error"
          : decision === "Returned"
          ? "warning"
          : "info",
      title: `${decision} this student?`,
      showCancelButton: true,
      confirmButtonText: `Yes, ${decision}`,
      cancelButtonText: "Cancel",
      confirmButtonColor:
        decision === "Approved"
          ? "#198754"
          : decision === "Rejected"
          ? "#dc3545"
          : decision === "Returned"
          ? "#ffc107"
          : "#0d6efd",
    });

    if (!confirmResult.isConfirmed) return;

    try {
      const payload = { decision, remarks };
      if (decision === "Forward") payload.forwardUserId = forwardUserId;

      await approveStudent(id, payload);

      Swal.fire({
        icon: "success",
        title: `Student ${decision}!`,
        text: `The student has been ${decision.toLowerCase()} successfully.`,
        timer: 2000,
        showConfirmButton: false,
      });

      setDecision("");
      setRemarks("");
      setForwardUserId("");
      loadStudent();
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Failed",
        text: err.response?.data?.error || "Failed to submit approval decision.",
      });
    }
  };

  const loadStudent = async () => {
    try {
      const res = await getStudent(id);
      setStudent(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadStudent();
  }, [id]);

  useEffect(() => {
    if (role === "TEACHER" || role === "HEADMASTER") {
      loadUsers();
    }
  }, [role]);

  // action=approve param aane par approval section tak smooth-scroll karo
  useEffect(() => {
    if (searchParams.get("action") === "approve" && student?.canApprove === 1) {
      setTimeout(() => {
        approvalSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [searchParams, student]);

  if (!student) {
    return <h3 className="text-center mt-5">Loading...</h3>;
  }

  return (
    <div className="container mt-4">
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h5>Student Full Profile</h5>
        </div>

        <div className="card-body">
          <div className="row g-4">
            <div className="col-md-6">
              <label className="form-label fw-bold">Student ID</label>
              <input type="text" className="form-control" value={student.student_id} readOnly />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold">Name</label>
              <input type="text" className="form-control" value={student.name} readOnly />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold">Email</label>
              <input type="text" className="form-control" value={student.email} readOnly />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold">Mobile</label>
              <input type="text" className="form-control" value={student.mobile} readOnly />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold">Course</label>
              <input type="text" className="form-control" value={student.course} readOnly />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold">Age</label>
              <input type="text" className="form-control" value={student.age} readOnly />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold">State</label>
              <input type="text" className="form-control" value={student.state} readOnly />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold">City</label>
              <input type="text" className="form-control" value={student.city} readOnly />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold">Created By</label>
              <input type="text" className="form-control" value={student.createdBy || "N/A"} readOnly />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold">Create by Time</label>
              <input
                type="text"
                className="form-control"
                value={
                  student.createdDate
                    ? new Date(student.createdDate).toLocaleString()
                    : student.created_at
                    ? new Date(student.created_at).toLocaleString()
                    : ""
                }
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold">Status</label>
              <input
                type="text"
                className={`form-control ${
  student.latest_request_status === "Returned"
    ? "text-warning fw-bold"
    : student.latest_request_status === "Approved"
    ? "text-success fw-bold"
    : student.latest_request_status === "Rejected"
    ? "text-danger fw-bold"
    : student.latest_request_status === "Forwarded" || student.latest_request_status === "Forward"
    ? "text-info fw-bold"
    : ""
}`}
                value={student.decision === "Forwarded" || student.decision === "Forward" ? "Forwarded" : (student.latest_request_status || "Pending")}
                readOnly
              />
            </div>
          </div>

          <div className="d-flex justify-content-between mt-4">
            <button className="btn btn-secondary" onClick={() => navigate(-1)}>
              ← Back
            </button>
          </div>
        </div>
      </div>

      {student.decision && (
        <div className="card shadow mt-4">
          <div
            className="card-header fw-bold"
            style={{ cursor: "pointer" }}
            onClick={() => setShowDetails(!showDetails)}
          >
            <div
              className={`badge ${
                student.decision === "Approved"
                  ? "bg-success"
                  : student.decision === "Rejected"
                  ? "bg-danger"
                  : student.decision === "Returned"
                  ? "bg-warning"
                  : student.decision === "Forwarded" || student.decision === "Forward"
                  ? "bg-info"
                  : student.decision
              }`}
            >
              {student.decision === "Approved"
                ? `Approved By ${student.decisionByName || ""}`
                : student.decision === "Rejected"
                ? `Rejected By ${student.decisionByName || ""}`
                : student.decision === "Returned"
                ? `Returned By ${student.decisionByName || ""}`
                : `Forwarded By ${student.decisionByName || ""}`
              }
            </div>

            <span className="float-end">{showDetails ? "▲" : "▼"}</span>
          </div>

          {showDetails && (
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Remarks</label>
                  <input type="text" className="form-control" value={student.decisionRemarks || " "} readOnly />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Updated_At</label>
                  <input
                    type="text"
                    className="form-control"
                    value={
                      student.decisionUpdatedAt
                        ? new Date(student.decisionUpdatedAt).toLocaleString()
                        : student.decisionDate
                        ? new Date(student.decisionDate).toLocaleString()
                        : "N/A"
                    }
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {(role === "TEACHER" || role === "HEADMASTER") && (
        <div className="card shadow mt-4" ref={approvalSectionRef}>
          <div className="card-header bg-primary text-white">
            <div className="card-body">
              <p className="text-warning fw-bold">Pending With : {student.pendingWithName || "N/A"}</p>
            </div>
          </div>

          {student.canApprove === 1 && (
            <div className="card-body">
              <div className="d-flex justify-content-center gap-5 flex-wrap">
                <label>
                  <input
                    type="radio"
                    name="decision"
                    value="Approved"
                    checked={decision === "Approved"}
                    onChange={(e) => setDecision(e.target.value)}
                  />{" "}
                  Approve
                </label>

                <label>
                  <input
                    type="radio"
                    name="decision"
                    value="Rejected"
                    checked={decision === "Rejected"}
                    onChange={(e) => setDecision(e.target.value)}
                  />{" "}
                  Reject
                </label>

                <label>
                  <input
                    type="radio"
                    name="decision"
                    value="Returned"
                    checked={decision === "Returned"}
                    onChange={(e) => setDecision(e.target.value)}
                  />{" "}
                  Return
                </label>

                <label>
                  <input
                    type="radio"
                    name="decision"
                    value="Forward"
                    checked={decision === "Forward"}
                    onChange={(e) => setDecision(e.target.value)}
                  />{" "}
                  Forward
                </label>
              </div>

              {decision === "Forward" && (
                <div className="mt-3">
                  <label className="form-label">Forward Users</label>
                  <select
                    className="form-select"
                    value={forwardUserId}
                    onChange={(e) => setForwardUserId(e.target.value)}
                  >
                    <option value="">Select User</option>
                    {users
                      .filter((u) => Number(u.Id || u.id) !== Number(student.pending_assigned_user_id))
                      .map((u) => (
                        <option key={u.Id || u.id} value={u.Id || u.id}>
                          {u.Name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="mt-3">
                <textarea
                  id="remarks"
                  className="form-control"
                  rows="3"
                  placeholder="Enter Remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
              <div className="mt-4 d-flex gap-2 justify-content-center">
                <div className="mt-3">
                  <button className="btn btn-success" onClick={handleApproveReject}>
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default StudentDetails;