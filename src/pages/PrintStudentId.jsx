import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudent } from '../api';
import Swal from 'sweetalert2';
import './PrintStudentId.css';
import QRCode from 'react-qr-code';
import html2canvas from "html2canvas";


function PrintStudentId() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await getStudent(id);
        setStudent(response.data);
      } catch (err) {
        console.error('Error fetching student:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading student details...</span>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container text-center py-5">
        <div className="alert alert-danger">Student details could not be loaded.</div>
        <button className="btn btn-primary" onClick={() => navigate('/read')}>
          Go to Student List
        </button>
      </div>
    );
  }

  const displayId =
    student.student_id ||
    student.studentId ||
    `STU${String(student.id).padStart(3, '0')}`;

  const qrValue = `Student Information:
    Name: ${student.name}
    ID: ${displayId}
    Course: ${student.course || 'N/A'}
    Phone: ${student.mobile || student.phone || 'N/A'}
    City: ${student.city || 'N/A'}
    State: ${student.state || 'N/A'}`;

  const downloadJPG = async () => {
    const result = await Swal.fire({
      title: "Download ID Card?",
      text: "Do you want to download this ID Card as JPG?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Download",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true,
        backgroundColor: "#ffffff",
      });

      const image = canvas.toDataURL("image/jpeg", 1.0);

      const link = document.createElement("a");
      link.href = image;
      link.download = `${displayId}.jpg`;
      link.click();

    } catch (error) {
      console.error("Image Download Error:", error);
    }
  };

  return (
    <div className="print-page">
      <div className="no-print buttons">
        <button className="btn btn-success ms-2" onClick={downloadJPG}>
          📥 Download JPG
        </button>
      </div>

      <div className="id-card" ref={cardRef}>
        <div className="id-header">
          <span className="school-tag">Student Identity Card</span>
        </div>

        <div className="id-body">
          <div className="photo-box">
            <div className="photo-label"></div>
            {student.photo ? (
              <img src={student.photo} alt="Student" className="student-photo" />
            ) : (
              <div className="photo-placeholder">👤</div>
            )}
          </div>

          <div className="id-details">
            <h4 className="student-name">{student.name}</h4>

            <div className="details-container">

              <div className="info-grid">
                <div className="info-row">
                  <span>ID : </span>
                  <strong>{displayId}</strong>
                </div>

                <div className="info-row">
                  <span>Course : </span>
                  <strong>{student.course || 'N/A'}</strong>
                </div>

                <div className="info-row">
                  <span>City : </span>
                  <strong>{student.city || 'N/A'}</strong>
                </div>
 
                <div className="info-row">
                  <span>State : </span>
                  <strong>{student.state || 'N/A'}</strong>
                </div>
                <div className="info-row">
                  <span>Phone : </span>
                  <strong>{student.mobile || student.phone || 'N/A'}</strong>
                </div>
                <div className="info-row">
                  <span>Email : </span>
                  <strong>{student.email || 'N/A'}</strong>
                </div>
              </div>

              <div className="qr-box">
                <QRCode
                  value={qrValue}
                  size={70}
                />
                <p>Scan For Info</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrintStudentId;