import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { previewStudentsExcel } from '../api';
import Swal from 'sweetalert2';

function ImportStudent() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null); // Selected Excel file
  const [loading, setLoading] = useState(false); // Loading status

  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/sample.xlsx';
    link.setAttribute('download', 'sample.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    Swal.fire({
      icon: 'success',
      title: 'Template Downloaded!',
      text: 'Excel sheet downloaded successfully.'
    });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handlePreview = async () => {
    if (!file) {
      Swal.fire({
        icon: 'warning',
        title: 'No File Selected',
        text: 'Please select an Excel file first.'
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await previewStudentsExcel(formData);
      navigate('/import-preview', { state: { excelData: res.data.excelData } });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Preview Failed',
        text: error.response?.data?.error || 'Could not read excel file. Make sure file is valid.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card p-4 mb-4 shadow-sm">
        <h3 className="mb-3">📤 Import Excel File</h3>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <p className="text-muted mb-0">Select an import Excel file</p>
          <button
            onClick={handleDownloadTemplate}
            className="btn btn-sm btn-outline-success fw-medium d-inline-flex align-items-center gap-1"
            style={{ borderRadius: '8px', padding: '6px 12px' }}
          >
            📥 Download Excel Template (sample.xlsx)
          </button>
        </div>

        <input
          type="file"
          className="form-control mb-3"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          disabled={loading}
        />

        <div>
          <button
            className="btn btn-primary me-2"
            onClick={handlePreview}
            disabled={!file || loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Processing...
              </>
            ) : (
              'Preview Data'
            )}
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => navigate('/read')}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportStudent;