import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createStudent, getStates, getCities, getCourses } from '../api';
import Swal from 'sweetalert2';
import CameraModal from '../components/CameraModal';
import Location from '../components/Location';


function CreateStudent() {
  const [form, setForm] = useState({ name: '', email: '', course: '', age: '', mobile: '', state: '', city: '' });
  const [states, setStates] = useState([]); // States dropdown options
  const [cities, setCities] = useState([]); // Cities dropdown options (filtered by state)
  const [courses, setCourses] = useState([]); // Courses dropdown options (independent)
  const [photo, setPhoto] = useState(null); // Selected photo file object
  const [isCameraOpen, setIsCameraOpen] = useState(false); // Camera modal state
  const [locationData, setLocationData] = useState({
    location: '',
    latlong: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statesRes, coursesRes] = await Promise.all([getStates(), getCourses()]);
        setStates(statesRes.data);
        setCourses(coursesRes.data);
      } catch (err) {
        console.error("Failed to load states/courses:", err);
      }
    };
    void loadData();
  }, []);

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
    if (!photo) {
      Swal.fire({ icon: 'error', title: 'No Photo', text: 'Please select a photo' });
      return;
    }
    if (!location) {
      Swal.fire({ icon: 'error', title: 'No Location', text: 'Please enter a location' });
      return;
    }



    const result = await Swal.fire({
      title: 'Add Student?',
      text: 'Do you want to save this student record?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Save',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return; // Exit if cancelled

    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (photo) {
        payload.append('photo', photo);
      }
      payload.append('location', locationData.location);
      payload.append('latlong', locationData.latlong);

      const response = await createStudent(payload); // API call
      const student = response.data;

      if (student.emailSent) {
        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Student added successfully & Welcome Email sent!'
        });
      } else {
        await Swal.fire({
          icon: 'warning',
          title: 'Registered with Email Error',
          text: `Student added successfully, but Welcome Email could not be sent. Error: ${student.emailError || 'Unknown Error'}`
        });
      }

      navigate('/read'); // Redirect to list

    } catch (error) {
      console.error('Error saving student:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to save student'
      });
    }
  };

  const locationValue = locationData.location && locationData.latlong
    ? `${locationData.location} | Latitude: ${locationData.latlong.split(',')[0]?.trim()} | Longitude: ${locationData.latlong.split(',')[1]?.trim()}`
    : '';

  return (
    <div className="form-wrapper">
      <div className="form-card">

        {/* Header */}
        <div className="form-header">
          <div className="avatar-circle">👤</div>
          <h4 className="text-white fw-bold ">Add New Student</h4>
          <p className="text-white" style={{ opacity: 0.8 }}>
            Fill in the details below to register
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
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* State Dropdown */}
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

          {/* City Dropdown */}
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

          {/* Course Dropdown (Independent) */}
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
                min="10"
                max="100"
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Student Photo</label>

            <div className="d-flex gap-2">

              {/* Camera Button */}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsCameraOpen(true)}
              >
                📷 Camera
              </button>

            </div>

            {/* Preview */}
            {photo && (
              <div className="mt-3 text-center">
                <img
                  src={URL.createObjectURL(photo)}
                  alt="Preview"
                  width="120"
                  height="120"
                  style={{
                    objectFit: "cover",
                    borderRadius: "10px",
                    border: "2px solid #ddd"
                  }}
                />

                <p className="mt-2 text-success">
                  {photo.name}
                </p>
              </div>
            )}

            {/* Camera Modal */}
            <CameraModal
              isOpen={isCameraOpen}
              onClose={() => setIsCameraOpen(false)}
              onCapture={(file) => setPhoto(file)}
            />
          </div>

          {/* location */}
          <div className="mb-3">
            <label className="form-label">
              <Location value={locationValue} onChange={setLocationData} />
            </label>
          </div>


          <div className="d-flex gap-2">
            <button
              className="btn btn-submit text-white w-100"
              onClick={handleSubmit}
            >
              Register Student
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

export default CreateStudent;
