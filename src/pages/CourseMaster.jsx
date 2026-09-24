import { useEffect, useState } from "react";
import { getCourses, createCourse, updateCourse, deleteCourse } from "../api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

function CourseMaster() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]); // Courses list
  const [courseName, setCourseName] = useState(""); // New course input
  const [editingId, setEditingId] = useState(null); // Editing course ID
  const [editingName, setEditingName] = useState(""); // Editing course input

  const fetchCourses = async () => {
    try {
      const res = await getCourses();
      setCourses(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to fetch courses", "error");
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!courseName.trim()) return;
    try {
      await createCourse({ name: courseName });
      setCourseName(""); // Clear input
      fetchCourses(); // Refresh list
      window.dispatchEvent(new Event('courseChanged'));
      Swal.fire("Added!", "Course added successfully.", "success");
    } catch {
      Swal.fire("Error", "Error adding course", "error");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingName.trim()) return;
    try {
      await updateCourse(editingId, { name: editingName });
      setEditingId(null); // Reset edit ID
      setEditingName("");
      fetchCourses(); // Refresh list
      window.dispatchEvent(new Event('courseChanged'));
      Swal.fire("Updated!", "Course updated successfully.", "success");
    } catch {
      Swal.fire("Error", "Error updating course", "error");
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
        await deleteCourse(id);
        fetchCourses(); // Refresh list
        window.dispatchEvent(new Event('courseChanged'));
        Swal.fire("Deleted!", "Course has been deleted.", "success");
      } catch {
        Swal.fire("Error", "Could not delete course. It might be linked to a student.", "error");
      }
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Course Master</h3>
          <p className="text-muted mb-0">Manage courses dynamically</p>
        </div>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/read")}>
          ⬅️ Back to Students
        </button>
      </div>

      <div className="row g-4">
        {/* Form Card */}
        <div className="col-md-4">
          <div className="card p-3 shadow-sm border-0">
            <h5 className="fw-bold mb-3">{editingId ? "✏️ Edit Course" : "➕ Add Course"}</h5>
            <form onSubmit={editingId ? handleUpdate : handleAdd}>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  value={editingId ? editingName : courseName}
                  onChange={(e) => editingId ? setEditingName(e.target.value) : setCourseName(e.target.value)}
                  placeholder="Course Name"
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
                  <th>Course Name</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course, index) => (
                  <tr key={course.id}>
                    <td>{index + 1}</td>
                    <td>{course.name}</td>
                    <td className="text-end">
                      <button className="btn btn-warning btn-sm me-2" onClick={() => { setEditingId(course.id); setEditingName(course.name); }}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(course.id, course.name)}>
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

export default CourseMaster;
