import { useEffect, useState } from "react";
import { getStates, createState, updateState, deleteState } from "../api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

function StateMaster() {
  const navigate = useNavigate();
  const [states, setStates] = useState([]); // States list
  const [stateName, setStateName] = useState(""); // New state input
  const [editingId, setEditingId] = useState(null); // Editing state ID
  const [editingName, setEditingName] = useState(""); // Editing state input

  const fetchStates = async () => {
    try {
      const res = await getStates();
      setStates(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to fetch states list", "error");
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!stateName.trim()) return;
    try {
      await createState({ name: stateName });
      setStateName(""); // Clear input
      fetchStates(); // Refresh list
      window.dispatchEvent(new Event('stateChanged'));
      Swal.fire("Added!", "State added successfully.", "success");
    } catch {
      Swal.fire("Error", "Error adding state (name might already exist)", "error");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingName.trim()) return;
    try {
      await updateState(editingId, { name: editingName });
      setEditingId(null); // Reset edit ID
      setEditingName("");
      fetchStates(); // Refresh list
      window.dispatchEvent(new Event('stateChanged'));
      Swal.fire("Updated!", "State updated successfully.", "success");
    } catch {
      Swal.fire("Error", "Error updating state", "error");
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: `Do you want to delete ${name}?`,
      text: "All cities under this state will also be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel"
    });

    if (result.isConfirmed) {
      try {
        await deleteState(id);
        fetchStates(); // Refresh list
        window.dispatchEvent(new Event('stateChanged'));
        Swal.fire("Deleted!", "State has been deleted.", "success");
      } catch {
        Swal.fire("Error", "Could not delete state.", "error");
      }
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">State Master</h3>
          <p className="text-muted mb-0">Manage states dynamically</p>
        </div>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/read")}>
          ⬅️ Back to Students
        </button>
      </div>

      <div className="row g-4">
        {/* Form Card */}
        <div className="col-md-4">
          <div className="card p-3 shadow-sm border-0">
            <h5 className="fw-bold mb-3">{editingId ? "✏️ Edit State" : "➕ Add State"}</h5>
            <form onSubmit={editingId ? handleUpdate : handleAdd}>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  value={editingId ? editingName : stateName}
                  onChange={(e) => editingId ? setEditingName(e.target.value) : setStateName(e.target.value)}
                  placeholder="State Name"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-100 fw-medium">Save</button>
              {editingId && (
                <button type="button" className="btn btn-link w-100 mt-2 text-decoration-none text-muted" onClick={() => { setEditingId(null); setEditingName(""); }}>
                  Cancel
                </button>
              )}
            </form>
          </div>
        </div>

        {/* List Card */}
        <div className="col-md-8">
          <div className="card p-3 shadow-sm border-0">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>State Name</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {states.map((state, index) => (
                  <tr key={state.id}>
                    <td>{index + 1}</td>
                    <td>{state.name}</td>
                    <td className="text-end">
                      <button className="btn btn-warning btn-sm me-2" onClick={() => { setEditingId(state.id); setEditingName(state.name); }}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(state.id, state.name)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StateMaster;
