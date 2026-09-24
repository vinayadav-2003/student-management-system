import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudent, updateStudent, getStates, getCities, getCourses } from '../api';
import Swal from 'sweetalert2';
import CameraModal from '../components/CameraModal';
import Location from '../components/Location';


function UpdateStudent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', course: '', age: '', mobile: '', state: '', city: '' });
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [locationData, setLocationData] = useState({
    location: '',
    latlong: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statesRes, coursesRes, studentRes] = await Promise.all([
          getStates(),
          getCourses(),
          getStudent(id)
        ]);

        setStates(statesRes.data);
        setCourses(coursesRes.data);

        const studentData = studentRes.data;
        setForm({
          name: studentData.name || '',
          email: studentData.email || '',
          course: studentData.course || '',
          age: studentData.age || '',
          mobile: studentData.mobile || '',
          state: studentData.state || '',
          city: studentData.city || ''
        });

        if (studentData.photo) {
          setExistingPhoto(studentData.photo);
        }

        if (studentData.location) {
          setLocationData({
            location: studentData.location || '',
            latlong: studentData.latlong || ''
          });
        }

        if (studentData.state) {
          const matchedState = statesRes.data.find(s => s.name === studentData.state);
          if (matchedState) {
            const citiesRes = await getCities(matchedState.id);
            setCities(citiesRes.data);
          }
        }
      } catch (err) {
        console.error("Failed to load initial data for update:", err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load student details.'
        });
      }
    };
    loadData();
  }, [id]);

  const handleStateChange = async (e) => {
    const selectedStateName = e.target.value;
    setForm(prev => ({ ...prev, state: selectedStateName, city: '' }));
    setCities([]);

    if (!selectedStateName) return;

    const matchedState = states.find(s => s.name === selectedStateName);
    if (matchedState) {
      try {
        const citiesRes = await getCities(matchedState.id);
        setCities(citiesRes.data);
      } catch (err) {
        console.error("Failed to load cities for state:", err);
      }
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Name is required' });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(form.email)) {
      Swal.fire({ icon: 'error', title: 'Invalid Email', text: 'Please enter a valid email address' });
      return;
    }

    if (!form.state.trim()) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'State is required' });
      return;
    }

    if (!form.city.trim()) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'City is required' });
      return;
    }

    if (!form.course.trim()) {
      Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Course is required' });
      return;
    }

    if (!/^[0-9]{10}$/.test(form.mobile)) {
      Swal.fire({ icon: 'error', title: 'Invalid Mobile Number', text: 'Mobile number must be 10 digits' });
      return;
    }

    if (!form.age || form.age < 10 || form.age > 100) {
      Swal.fire({ icon: 'error', title: 'Invalid Age', text: 'Age must be between 10 and 100' });
      return;
    }
    if (!photo && !existingPhoto) {
      Swal.fire({ icon: 'error', title: 'No Photo', text: 'Please select a photo' });
      return;
    }

    if (!locationData.location) { 
      Swal.fire({ icon: 'error', title: 'No Location', text: 'Please enter a location' });
      return;
    }


    const result = await Swal.fire({
      title: 'Update Student?',
      text: 'Do you want to save the changes for this student?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Save',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (photo) {
        payload.append('photo', photo);
      }
      payload.append('location', locationData.location);
      payload.append('latlong', locationData.latlong);

      await updateStudent(id, payload);

      await Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Student updated successfully!'
      });

      navigate('/read');

    } catch (error) {
      console.error('Error updating student:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to update student'
      });
    }
  };

  // Location component ko composite string chahiye ("address | Latitude: X | Longitude: Y")
  const locationValue = locationData.location && locationData.latlong
    ? `${locationData.location} | Latitude: ${locationData.latlong.split(',')[0]?.trim()} | Longitude: ${locationData.latlong.split(',')[1]?.trim()}`
    : '';

  return (
    <div className="form-wrapper">
      <div className="form-card">

        <div className="form-header">
          <div className="avatar-circle">✏️</div>
          <h4 className="text-white fw-bold mb-1">Update Student</h4>
          <p className="text-white mb-0" style={{ opacity: 0.8, fontSize: '14px' }}>
            Modify the details of this student record
          </p>
        </div>

        <div className="p-4">

          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <div className="input-group">
              <span className="input-group-text">👤</span>
              <input
                name="name"
                type="text"
                className="form-control"
                placeholder="e.g. Abcd kumar"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <div className="input-group">
              <span className="input-group-text">✉️</span>
              <input
                name="email"
                type="email"
                className="form-control"
                placeholder="e.g. user@gmail.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">State Name</label>
            <div className="input-group" style={{ maxWidth: '280px' }}>
              <span className="input-group-text">🗺️</span>
              <select
                name="state"
                className="form-select"
                onChange={handleStateChange}
                value={form.state}
                required
              >
                <option value="">Select State</option>
                {states.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">City Name</label>
            <div className="input-group" style={{ maxWidth: '280px' }}>
              <span className="input-group-text">🏙️</span>
              <select
                name="city"
                className="form-select"
                onChange={handleChange}
                value={form.city}
                disabled={!form.state}
                required
              >
                <option value="">Select City</option>
                {cities.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Course</label>
            <div className="input-group">
              <span className="input-group-text">📘</span>
              <select
                name="course"
                className="form-select"
                onChange={handleChange}
                value={form.course}
                required
              >
                <option value="">Select Course</option>
                {courses.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Mobile No.</label>
            <div className="input-group" style={{ maxWidth: '280px' }}>
              <span className="input-group-text">📞</span>
              <input
                name="mobile"
                type="number"
                className="form-control"
                placeholder="e.g. 1234567890"
                value={form.mobile}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label">Age</label>
            <div className="input-group" style={{ maxWidth: '180px' }}>
              <span className="input-group-text">🎂</span>
              <input
                name="age"
                type="number"
                className="form-control"
                placeholder="e.g. 1---100 years"
                value={form.age}
                min="10"
                max="100"
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label">Student Photo</label>

            <div className="d-flex gap-2 mb-3">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsCameraOpen(true)}
              >
                📷 Camera
              </button>
            </div>

            {photo ? (
              <div className="mt-2 text-center">
                <img
                  src={URL.createObjectURL(photo)}
                  alt="New Preview"
                  width="120"
                  height="120"
                  style={{
                    objectFit: "cover",
                    borderRadius: "10px",
                    border: "2px solid #ddd"
                  }}
                />
                <small className="d-block text-success mt-2">{photo.name}</small>
              </div>
            ) : existingPhoto ? (
              <div className="mt-2 text-center">
                <img
                  src={existingPhoto}
                  alt="Existing Student"
                  width="120"
                  height="120"
                  style={{
                    objectFit: "cover",
                    borderRadius: "10px",
                    border: "2px solid #ddd"
                  }}
                />
                <small className="d-block text-muted mt-2">Current Photo</small>
              </div>
            ) : null}

            <CameraModal
              isOpen={isCameraOpen}
              onClose={() => setIsCameraOpen(false)}
              onCapture={(file) => setPhoto(file)}
            />
          </div>

        {/* loction */}
        
          <div className="mb-3">
            <Location value={locationValue} onChange={setLocationData} />
          </div>
          

          <div className="d-flex gap-2">
            <button
              className="btn btn-submit text-white w-100"
              onClick={handleSubmit}
            >
              Save Changes
            </button>
            <button className="btn btn-outline-secondary fw-medium"
              style={{ borderRadius: '12px', padding: '12px', minWidth: '100px' }}
              onClick={() => navigate('/read')}>
              ✖ Cancel
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default UpdateStudent;