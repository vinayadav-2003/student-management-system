import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { getUsers, createUser, updateUser, deleteUser } from "../api";

const UserMaster = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [name, setName] = useState("");
  const [role, setRole] = useState("Student");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const getCurrentUserInfo = () => {
    const token = localStorage.getItem("token");
    if (!token) return { role: null, id: null };
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      let userRole = payload.role;
      if (!userRole) {
        userRole = "HEADMASTER";
      } else {
        userRole = userRole.toUpperCase();
      }
      return { role: userRole, id: payload.id };
    } catch {
      return { role: null, id: null };
    }
  };

  const { role: currentRole, id: currentId } = getCurrentUserInfo();

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Could not load users list", "error");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleReset = () => {
    setIsEditing(false);
    setEditId(null);
    setName("");
    setRole("Student");
    setEmail("");
    setPhone("");
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !role) {
      Swal.fire("Warning", "Please fill in all required fields.", "warning");
      return;
    }

    const payload = {
      name: name.trim(),
      role,
      email: email.trim(),
      phone: phone ? phone.trim() : "",
    };

    try {
      if (isEditing) {
        await updateUser(editId, payload);
        Swal.fire("Success", "User updated successfully!", "success");
      } else {
        await createUser(payload);
        Swal.fire("Success", "User created successfully!", "success");
      }
      handleReset();
      fetchUsers();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: err.response?.data?.error || "An error occurred during submission.",
      });
    }
  };

  const handleEdit = (user) => {
    setIsEditing(true);
    setEditId(user.Id);
    setName(user.Name || "");
    setRole(user.Role || "Student");
    setEmail(user.Email || "");
    setPhone(user.Phone || "");
  };

  const handleDelete = async (id, userName) => {
    if (Number(currentId) === Number(id)) {
      Swal.fire("Error", "You cannot delete your own account", "error");
      return;
    }

    const result = await Swal.fire({
      title: `Do you want to delete ${userName}?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it",
    });

    if (result.isConfirmed) {
      try {
        await deleteUser(id);
        Swal.fire("Deleted!", "User has been deleted.", "success");
        fetchUsers();
      } catch (err) {
        Swal.fire("Error", err.response?.data?.error || "Could not delete user.", "error");
      }
    }
  };

  const canModify = (targetRole) => {
    const roleUpper = (targetRole || "").toUpperCase();
    const currentRoleUpper = (currentRole || "").toUpperCase();
    if (currentRoleUpper === "HEADMASTER") return true;
    if (currentRoleUpper === "TEACHER") {
      return roleUpper === "STUDENT";
    }
    return false;
  };

  const filteredUsers = users.filter((u) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (u.Name || "").toLowerCase().includes(searchLower) ||
      (u.Role || "").toLowerCase().includes(searchLower) ||
      (u.Email || "").toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="container-fluid">
      <div className="row g-4">
        {/* Left Form Card */}
        <div className="col-lg-4 col-md-5">
          <div className="card shadow-sm border-0 rounded-3">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold text-muted">
                {isEditing ? "📝 Edit User" : "👥 Add User"}
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSave}>
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Role *</label>
                  <select
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  >
                    <option value="Headmaster">Headmaster</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Student">Student</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-success flex-grow-1 py-2 fw-semibold">
                    {isEditing ? "Update User" : "Save User"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary px-3 py-2"
                    onClick={handleReset}
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right List Card */}
        <div className="col-lg-8 col-md-7">
          <div className="card shadow-sm border-0 rounded-3">
            <div className="card-header bg-white border-0 py-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
              <h5 className="mb-0 fw-bold text-muted">👥 User List</h5>
              <div style={{ maxWidth: "250px" }}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="🔍 Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-bordered table-striped align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="px-3">Name</th>
                      <th>Role</th>
                      <th>Email</th>
                      <th className="text-center" style={{ width: "180px" }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-4 text-muted">
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const canAct = canModify(user.Role, user.Id);
                        const isSelf = Number(currentId) === Number(user.Id);

                        return (
                          <tr key={user.Id}>
                            <td className="px-3 fw-medium">{user.Name}</td>
                            <td>
                              <span
                                className={`badge ${user.Role === "Headmaster"
                                  ? "bg-danger"
                                  : user.Role === "Teacher"
                                    ? "bg-primary"
                                    : "bg-secondary"
                                  }`}
                              >
                                {user.Role}
                              </span>
                            </td>
                            <td>{user.Email}</td>
                            <td className="text-center px-2">
                              <div className="d-flex justify-content-center gap-2">
                                <button
                                  className="btn btn-warning btn-sm"
                                  onClick={() => handleEdit(user)}
                                  disabled={!canAct}
                                >
                                  Update
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDelete(user.Id, user.Name)}
                                  disabled={!canAct || isSelf}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserMaster;
