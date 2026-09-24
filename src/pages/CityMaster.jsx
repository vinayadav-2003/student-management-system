import { useEffect, useState } from "react";
import { getCities, createCity, updateCity, deleteCity, getStates } from "../api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

function CityMaster() {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]); // Cities list
  const [states, setStates] = useState([]); // States list
  const [selectedStateId, setSelectedStateId] = useState(""); // Selected state ID for new city
  const [cityName, setCityName] = useState(""); // New city name input
  const [editingId, setEditingId] = useState(null); // Editing city ID
  const [editingName, setEditingName] = useState(""); // Editing city name input
  const [editingStateId, setEditingStateId] = useState(""); // Editing city state ID

  const fetchCities = async () => {
    try {
      const res = await getCities();
      setCities(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to fetch cities", "error");
    }
  };

  const fetchStates = async () => {
    try {
      const res = await getStates();
      setStates(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCities();
    fetchStates();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!cityName.trim() || !selectedStateId) {
      Swal.fire("Warning", "Please select a State and enter City Name", "warning");
      return;
    }
    try {
      await createCity({ name: cityName, stateId: Number(selectedStateId) });
      setCityName(""); // Clear input
      fetchCities(); // Refresh list
      window.dispatchEvent(new Event('cityChanged'));
      Swal.fire("Added!", "City added successfully.", "success");
    } catch {
      Swal.fire("Error", "Error adding city", "error");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingName.trim() || !editingStateId) {
      Swal.fire("Warning", "Please select a State and enter City Name", "warning");
      return;
    }
    try {
      await updateCity(editingId, { name: editingName, stateId: Number(editingStateId) });
      setEditingId(null); // Reset edit ID
      setEditingName("");
      setEditingStateId("");
      fetchCities(); // Refresh list
      window.dispatchEvent(new Event('cityChanged'));
      Swal.fire("Updated!", "City updated successfully.", "success");
    } catch {
      Swal.fire("Error", "Error updating city", "error");
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: `Do you want to delete ${name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it"
    });

    if (result.isConfirmed) {
      try {
        await deleteCity(id);
        fetchCities(); // Refresh list
        window.dispatchEvent(new Event('cityChanged'));
        Swal.fire("Deleted!", "City has been deleted.", "success");
      } catch {
        Swal.fire("Error", "Could not delete city. It might be linked to a student.", "error");
      }
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">City Master</h3>
          <p className="text-muted mb-0">Manage cities dynamically</p>
        </div>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/read")}>
          ⬅️ Back to Students
        </button>
      </div>

      <div className="row g-4">
        {/* Form Card */}
        <div className="col-md-4">
          <div className="card p-3 shadow-sm border-0">
            <h5 className="fw-bold mb-3">{editingId ? "✏️ Edit City" : "➕ Add City"}</h5>
            <form onSubmit={editingId ? handleUpdate : handleAdd}>
              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold">SELECT STATE</label>
                <select
                  className="form-select"
                  value={editingId ? String(editingStateId) : String(selectedStateId)}
                  onChange={(e) => editingId ? setEditingStateId(e.target.value) : setSelectedStateId(e.target.value)}
                  required
                >
                  <option value="">Select State</option>
                  {states.map(s => (
                    <option key={s.id} value={String(s.id)}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold">CITY NAME</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingId ? editingName : cityName}
                  onChange={(e) => editingId ? setEditingName(e.target.value) : setCityName(e.target.value)}
                  placeholder="City Name"
                  disabled={editingId ? !editingStateId : !selectedStateId}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary w-100 fw-medium"
                disabled={editingId ? !editingStateId : !selectedStateId}
              >
                Save
              </button>
              {editingId && (
                <button type="button" className="btn btn-link w-100 mt-2 text-decoration-none text-muted" onClick={() => { setEditingId(null); setEditingName(""); setEditingStateId(""); }}>
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
                  <th>State</th>
                  <th>City Name</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cities.map((city, index) => (
                  <tr key={city.id}>
                    <td>{index + 1}</td>
                    <td className="fw-semibold text-primary">{city.stateName || "N/A"}</td>
                    <td>{city.name}</td>
                    <td className="text-end">
                      <button className="btn btn-warning btn-sm me-2" onClick={() => { setEditingId(city.id); setEditingName(city.name); setEditingStateId(city.stateId || ""); }}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(city.id, city.name)}>
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

export default CityMaster;
