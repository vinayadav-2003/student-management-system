import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { importStudentsBulk } from '../api';
import Swal from 'sweetalert2';

function ImportPreview() {
  const navigate = useNavigate();
  const location = useLocation();

  const [students, setStudents] = useState(() => 
    location.state?.excelData || []
  );
  const [loading, setLoading] = useState(false); // Loading status

  const handleRemove = (indexToRemove) => {
    setStudents(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleImport = async () => {
    const importable = students.filter(s => s.status === 'Ready');
    if (importable.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Nothing to Import',
        text: 'There are no valid records ready to import.'
      });
      return;
    }

    const confirmRes = await Swal.fire({
      title: 'Import Students?',
      text: `Do you want to import ${importable.length} ready record(s) to the database?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Import',
      cancelButtonText: 'Cancel'
    });

    if (!confirmRes.isConfirmed) return;

    setLoading(true);
    try {
      const res = await importStudentsBulk(importable);

      Swal.fire({
        icon: 'success',
        title: 'Import Successful',
        text: `${res.data.imported} records imported successfully!`
      });

      navigate('/read'); // Redirect on success
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Import Failed',
        text: error.response?.data?.error || 'An error occurred during import.'
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="container mt-4">
      <div className="card p-4 shadow-sm mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h3 className="mb-1">Excel Preview Data</h3>
            <p className="text-muted mb-0">
               student records before save to the database.
            </p>
          </div>
          <span className="badge bg-primary p-2 fs-6">
            Total Records: {students.length}
          </span>
        </div>

        <div className="table-responsive border rounded mb-3" style={{ maxHeight: '450px', overflowY: 'auto' }}>
          <table className="table table-bordered table-striped table-hover align-middle mb-0">
            <thead className="table-dark sticky-top">
              <tr>
                <th>S.No.</th>
                <th>Name</th>
                <th>Email</th>
                <th>Course</th>
                <th>State</th>
                <th>City</th>
                <th>Mobile</th>
                <th>Age</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, index) => {
                let rowClass = 'table-info-subtle';
                let badge = <span className="badge bg-info text-dark text-wrap">Ready to Import</span>;

                if (s.status === 'Duplicate') {
                  rowClass = 'table-danger text-danger-emphasis';
                  badge = <span className="badge bg-danger text-wrap">Duplicate Email</span>;
                } else if (s.status === 'Missing Email') {
                  rowClass = 'table-warning text-warning-emphasis';
                  badge = <span className="badge bg-warning text-dark text-wrap">Missing Email</span>;
                }

                return (
                  <tr key={index} className={rowClass}>
                    <td className="fw-bold text-center">{index + 1}</td>
                    <td>{s.Name || <em className="text-muted">N/A</em>}</td>
                    <td>{s.Email || <em className="text-muted">N/A</em>}</td>
                    <td>{s.Course || <em className="text-muted">N/A</em>}</td>
                    <td>{s.State || <em className="text-muted">N/A</em>}</td>
                    <td>{s.City || <em className="text-muted">N/A</em>}</td>
                    <td>{s.Mobile || <em className="text-muted">N/A</em>}</td>
                    <td>{s.Age !== null && s.Age !== undefined ? s.Age : <em className="text-muted">N/A</em>}</td>
                    <td className="text-center">{badge}</td>
                    <td className="text-center">
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemove(index)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-end">
          <button
            className="btn btn-secondary me-2 px-4"
            onClick={() => navigate('/import')}
            disabled={loading}
          >
            Back
          </button>
          <button
            className="btn btn-success px-4"
            onClick={handleImport}
            disabled={loading || students.filter(s => s.status === 'Ready').length === 0}
          >
            {loading ? 'Importing...' : 'Import Data'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportPreview;
