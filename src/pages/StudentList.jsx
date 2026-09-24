import { useCallback, useEffect, useState } from "react";
import { getStudents, deleteStudent, exportStudentsExcel, getStates, getCities, getCourses } from "../api";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";


function StudentList() {
  const navigate = useNavigate();

  const getUserRole = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role) return payload.role.toUpperCase();
      return 'HEADMASTER';
    } catch {
      return null;
    }
  };
  const userRole = getUserRole();



  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");


  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || ''; // Search query from URL

  const limit = 10; // Items per page
  const totalPages = Math.ceil(total / limit) || 1; // Calculate total pages

  const fetchStudents = useCallback(async (pageNumber, query, state, city, course) => {
    try {
      const res = await getStudents(pageNumber, limit, query, state, city, course);
      setStudents(res.data.students);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    }
  }, [limit]); // Only limit is stable — all other args passed directly

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [statesRes, coursesRes] = await Promise.all([getStates(), getCourses()]);
        setStates(statesRes.data);
        setCourses(coursesRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    void loadFilters();
  }, []);

  useEffect(() => {
    const loadCities = async () => {
      setSelectedCity("");
      setCities([]);
      if (!selectedState) return;

      const matchedState = states.find(s => s.name === selectedState);
      if (matchedState) {
        try {
          const citiesRes = await getCities(matchedState.id);
          setCities(citiesRes.data);
        } catch (err) {
          console.error(err);
        }
      }
    };
    void loadCities();
  }, [selectedState, states]);

  useEffect(() => {
    fetchStudents(page, searchQuery, selectedState, selectedCity, selectedCourse);
  }, [page, searchQuery, selectedState, selectedCity, selectedCourse, fetchStudents]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedState, selectedCity, selectedCourse]);

  const getCurrentUserId = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch {
      return null;
    }
  };
  const currentUserId = getCurrentUserId();

  const [filterEnteredByMe, setFilterEnteredByMe] = useState(false);
  const [filterPendingDetails, setFilterPendingDetails] = useState(false);

  const handleExportExcel = async () => {
    try {
      const response = await exportStudentsExcel();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'students.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      Swal.fire({
        icon: 'success',
        title: 'Export Successful',
        text: 'Student records downloaded successfully as Excel.'
      });
    } catch (error) {
      console.error('Export error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'An error occurred while exporting data.'
      });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Student?",
      icon: "warning",
      showCancelButton: true
    });

    if (!result.isConfirmed) return; // Exit if cancelled

    await deleteStudent(id);
    Swal.fire("Deleted!", "", "success");
    fetchStudents(page, searchQuery, selectedState, selectedCity, selectedCourse); // Refresh list
    window.dispatchEvent(new Event('studentCountChanged')); // Update count in header
  };

  const handleUpdate = (id) => {
    const student = students.find((s) => s.id === id);
    navigate(`/update/${id}`, { state: { student } });
  };

  const printStudent = (student) => {
    window.open(`/print-student/${student.id}`, '_blank', 'width=600,height=800,toolbar=no,menubar=no,scrollbars=yes,resizable=yes');
  };


  const displayedStudents = students.filter(student => {
    if (filterEnteredByMe) {
      return student.createdBy !== undefined && student.createdBy !== null && Number(student.createdBy) === Number(currentUserId);
    }

    if (filterPendingDetails) {
      return (
        student.latest_request_status === 'Pending' ||
        student.latest_request_status === 'Forwarded' ||
        student.latest_request_status === 'Returned' ||
        student.latest_request_status === null
      );
    }

    return true;
  });


  return (
    <div className="container-fluid mt-4">


      <div className="card shadow-sm border-0 p-4 rounded-3 mb-4" style={{ background: '#fff' }}>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3>Student List</h3>

          <div className="d-flex align-items-center gap-2">
            <button
              className={`btn btn-outline-primary rounded-pill px-4 ${(!filterEnteredByMe && !filterPendingDetails) ? "active" : ""}`}
              onClick={() => {
                setFilterEnteredByMe(false);
                setFilterPendingDetails(false);
              }}
            >
              📚 All Students
            </button>
            <button
              className={`btn btn-outline-primary rounded-pill px-4 ${filterEnteredByMe ? "active" : ""}`}
              onClick={() => {
                setFilterEnteredByMe(!filterEnteredByMe);
                setFilterPendingDetails(false);
              }}
            >
              👤 Enterby me
            </button>

            <button
              className={`btn btn-outline-warning rounded-pill px-4 ${filterPendingDetails ? "active" : ""}`}
              onClick={() => {
                setFilterPendingDetails(!filterPendingDetails);
                setFilterEnteredByMe(false);
              }}
            >
              ⚠️ Pending details
            </button>
          </div>

          <div className="d-flex align-items-center gap-2">
            {userRole !== 'STUDENT' && (
              <button
                className="btn btn-success"
                onClick={() => navigate("/import")}
              >
                📥 Import Excel
              </button>
            )}

            <button
              className="btn btn-primary"
              onClick={handleExportExcel}
            >
              📤 Export Excel
            </button>
          </div>
        </div>

        {/* State, City, and Course filters */}
        <div className="row g-2 mb-3 align-items-center">
          <div className="col-md-3 col-6">
            <select className="form-select" value={selectedState} onChange={(e) => setSelectedState(e.target.value)}>
              <option value="">All States</option>
              {states.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {selectedState && (
            <div className="col-md-3 col-6">
              <select
                className="form-select"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                <option value="">All Cities</option>
                {cities.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="col-md-3 col-6">
            <select className="form-select" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
              <option value="">All Courses</option>
              {courses.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {(selectedState || selectedCity || selectedCourse) && (
            <div className="col-md-2 col-12">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSelectedState("");
                  setSelectedCity("");
                  setSelectedCourse("");
                }}
              >
                🧹 Clear
              </button>
            </div>
          )}
        </div>

        {/* Table to show the student list with pagination and action buttons */}
        <div className="table-responsive">
          <table className="table table-bordered table-striped align-middle mb-0" style={{ minWidth: "1350px" }}>
            <thead>
              {filterPendingDetails ? (
                <tr>
                  <th>S.No</th>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Course</th>
                  <th>Status</th>
                  <th className="text-nowrap" style={{ width: "250px", minWidth: "250px" }}>Action</th>
                </tr>
              ) : (
                <tr>
                  <th className="text-nowrap">S.No</th>
                  <th className="text-nowrap">Student ID</th>
                  <th className="text-nowrap">Name</th>
                  <th className="text-nowrap">Email</th>
                  <th className="text-nowrap">Course</th>
                  <th className="text-nowrap">State</th>
                  <th className="text-nowrap">City</th>
                  <th className="text-nowrap">Mobile</th>
                  <th className="text-nowrap">Age</th>
                  <th className="text-nowrap" style={{ width: "250px", minWidth: "250px" }}>Action</th>
                </tr>
              )}
            </thead>

            <tbody>
              {displayedStudents.map((student, index) => {
                return (
                  <tr key={student.id}>
                    <td className="text-nowrap">{(page - 1) * limit + index + 1}</td>
                    <td className="text-nowrap" style={{ fontFamily: "monospace", fontWeight: "700", color: "#4f46e5" }}>
                      {student.student_id || student.studentId || (student.id ? `STU${String(student.id).padStart(3, '0')}` : 'N/A')}
                    </td>
                    <td className="text-nowrap">{student.name}</td>
                    {filterPendingDetails ? (
                      <>
                        <td className="text-nowrap">{student.course}</td>
                        <td className="text-nowrap">{student.latest_request_status || "Pending"}</td>
                        <td>
                          <button
                            className="btn btn-info btn-sm"
                            onClick={() => navigate(`/student-details/${student.id}`)}
                          >
                            👁 Details
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="text-nowrap">{student.email}</td>

                        <td
                          className="text-nowrap"
                          onClick={() => student.course && setSelectedCourse(student.course)}
                          style={{
                            cursor: "pointer",
                            color: "#667eea",
                            fontWeight: "600",
                          }}
                        >
                          {student.course}
                        </td>

                        <td className="text-nowrap">{student.state}</td>
                        <td className="text-nowrap">{student.city}</td>
                        <td className="text-nowrap">{student.mobile}</td>
                        <td className="text-nowrap">{student.age}</td>
                      </>
                    )}

                    <td className="text-nowrap">
                      {!filterPendingDetails && (
                        <div className="d-flex gap-1 align-items-center">
                          <button
                            className="btn btn-info btn-sm text-white text-nowrap"
                            onClick={() => printStudent(student)}
                            style={{ fontWeight: "500" }}
                          >
                            🖨️ Print ID
                          </button>
                          {userRole !== 'STUDENT' && (
                            <>
                              <button
                                className="btn btn-warning btn-sm text-nowrap"
                                onClick={() => handleUpdate(student.id)}
                              >
                                ✏️ Update
                              </button>
                              <button
                                className="btn btn-danger btn-sm text-nowrap"
                                onClick={() => handleDelete(student.id)}
                              >
                                🗑️ Delete
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-center mt-4">
          <div className="pagination-container">
            <button
              className="btn btn-secondary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              ← Previous
            </button>

            <span>
              Page {page} of {totalPages}
            </span>

            <button
              className="btn btn-secondary"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next →
            </button>
          </div>
        </div>

        <h5 className="mt-3">
          Total Students: {total}
        </h5>
      </div>
    </div>
  );
}

export default StudentList;