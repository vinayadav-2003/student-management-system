import { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import StudentList from './pages/StudentList';
import CreateStudent from './pages/CreateStudent';
import UpdateStudent from './pages/updateStudent';
import ImportStudent from './pages/ImportStudent';
import ImportPreview from './pages/ImportPreview';
import StateMaster from './pages/StateMaster';
import CityMaster from './pages/CityMaster';
import CourseMaster from './pages/CourseMaster';
import DashboardPage from './pages/Dashboard';
import Login from './pages/log_in';
import Otp from './pages/Otp';
import ProtectedRoute from './ProtectedRoute';
import ChangePassword from './pages/ChangePassword';
import UserMaster from './pages/UserMaster';
import PrintStudentId from './pages/PrintStudentId';
import StudentDetails from './pages/StudentDesatis';
import Location from './components/Location';


function App() {
  const navigate = useNavigate();
  const location = useLocation(); // Track routing path
  const isPrintPage = location.pathname.startsWith('/print-student/');
  const [showDropdown, setShowDropdown] = useState(false); // Dropdown visibility

  const isTokenValid = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  };
  const requiresPasswordChange = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return !!payload.requiresPasswordChange;
    } catch {
      return false;
    }
  };
  const [isLoggedIn, setIsLoggedIn] = useState(() => isTokenValid()); // Reactive auth state with expiry check
  const mustChange = isLoggedIn && requiresPasswordChange();

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


  useEffect(() => {
    setShowDropdown(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isTokenValid()) {
      localStorage.removeItem('token');
      setIsLoggedIn(false);
    }
  }, [location]);

  useEffect(() => {
    if (!showDropdown) return;
    const handleClose = (e) => {
      if (e.target.closest('.dropdown')) return;
      setShowDropdown(false);
    };
    document.addEventListener('click', handleClose);
    return () => {
      document.removeEventListener('click', handleClose);
    };
  }, [showDropdown]);

  ///sb

  if (
  isLoggedIn &&
  (location.pathname === "/" ||
    location.pathname === "/login")
) {
  
  if (requiresPasswordChange()) {
    return <Navigate to="/change-password" replace />;
  }

  return <Navigate to="/read" replace />;
}

  
/// log 
  if (!isLoggedIn) {
  if (location.pathname === "/otp") {
    if (!location.state?.email) {
      return <Navigate to="/" replace />;
    }
    return <Otp onLogin={() => setIsLoggedIn(true)} />;
  }

 // 
  if (location.pathname !== "/login" && location.pathname !== "/") {
    sessionStorage.setItem(
      "redirectAfterLogin",
      location.pathname + location.search
    );
  } else {

    sessionStorage.removeItem("redirectAfterLogin");
  }

  return (
    <Login onLogin={() => setIsLoggedIn(true)} />
  );
}

  if (isLoggedIn && requiresPasswordChange() && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return (


    <div className="App">


      {!isPrintPage && (
        <nav className="navbar navbar-expand-lg shadow-sm py-3">
          <div className="container-fluid px-4">


            <span className="navbar-brand d-flex align-items-center gap-2 text-white fw-bold fs-5 mb-0">
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px'
              }}>🎓</div>
              SMS <span className="d-none d-md-inline" style={{ opacity: 0.8, fontWeight: 400, fontSize: '14px' }}>| Student Management</span>
            </span>


            {mustChange ? (
              <div className="ms-auto">
                <button
                  className="btn fw-medium px-3"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    color: '#fff',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}
                  onClick={() => {
                    localStorage.removeItem('token'); // Clear JWT token
                    setIsLoggedIn(false);             // Trigger re-render to show Login
                    navigate('/login');               // Reset route so next login is a fresh one
                  }}
                >
                  Cancel / Logout
                </button>
              </div>
            ) : (
              <>
                <button
                  className="navbar-toggler border-0"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#navMenu"
                  style={{ filter: 'invert(1)' }}
                >
                  <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navMenu">
                  <ul className="navbar-nav ms-auto align-items-center gap-2 mt-3 mt-lg-0">

                    {userRole === "HEADMASTER" && (
                      <li className="nav-item dropdown" style={{ position: 'relative' }}>
                        {(() => {
                          const isMasterActive = ['/states', '/cities', '/courses', '/users'].includes(location.pathname);
                          return (
                            <button
                              className="btn fw-medium px-4 d-flex align-items-center gap-2 dropdown-toggle manage-masters-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDropdown(!showDropdown);
                              }}
                              style={{
                                background: isMasterActive ? '#fff' : 'rgba(255,255,255,0.15)',
                                color: isMasterActive ? '#667eea' : '#fff',
                                borderRadius: '10px',
                                border: '1px solid rgba(255,255,255,0.3)',
                                transition: 'all 0.2s'
                              }}
                            >
                              ⚙️ <span>Manage Masters</span>
                            </button>
                          );
                        })()}
                        <ul className={`dropdown-menu shadow ${showDropdown ? 'show' : ''}`} style={{ position: 'absolute', left: 0, top: '100%', zIndex: 1050, display: showDropdown ? 'block' : 'none' }}>
                          <li>
                            <Link
                              to="/states"
                              className="dropdown-item d-flex align-items-center gap-2 py-2"
                              onClick={(e) => {
                                e.preventDefault();
                                navigate('/states');
                                setShowDropdown(false);
                              }}
                            >
                              🗺️ State Master
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="/cities"
                              className="dropdown-item d-flex align-items-center gap-2 py-2"
                              onClick={(e) => {
                                e.preventDefault();
                                navigate('/cities');
                                setShowDropdown(false);
                              }}
                            >
                              🏙️ City Master
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="/courses"
                              className="dropdown-item d-flex align-items-center gap-2 py-2"
                              onClick={(e) => {
                                e.preventDefault();
                                navigate('/courses');
                                setShowDropdown(false);
                              }}
                            >
                              📘 Course Master
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="/users"
                              className="dropdown-item d-flex align-items-center gap-2 py-2"
                              onClick={(e) => {
                                e.preventDefault();
                                navigate('/users');
                                setShowDropdown(false);
                              }}
                            >
                              👥 User Master
                            </Link>
                          </li>
                        </ul>
                      </li>
                    )}

                    {(userRole === "HEADMASTER" || userRole === "TEACHER") && (
                      <li className="nav-item">
                        <Link to="/create" className="btn fw-medium px-4 d-flex align-items-center gap-2 nav-btn"
                          style={{
                            background: location.pathname === '/create' ? '#fff' : 'rgba(255,255,255,0.15)',
                            color: location.pathname === '/create' ? '#667eea' : '#fff',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.3)',
                            transition: 'all 0.2s'
                          }}>
                          ➕ <span>Create</span>
                        </Link>
                      </li>
                    )}

                    <li className="nav-item">
                       <Link to="/dashboard" className="btn fw-medium px-4 d-flex align-items-center gap-2 nav-btn"
                        style={{
                          background: location.pathname === '/dashboard' ? '#fff' : 'rgba(255,255,255,0.15)',
                          color: location.pathname === '/dashboard' ? '#667eea' : '#fff',
                          borderRadius: '10px',
                          border: '1px solid rgba(255,255,255,0.3)',
                          transition: 'all 0.2s'
                        }}>
                        📊 <span>Dashboard</span>
                      </Link>
                    </li>

                    <li className="nav-item">
                      <Link to="/read" className="btn fw-medium px-4 d-flex align-items-center gap-2 nav-btn"
                        style={{
                          background: location.pathname === '/read' ? '#fff' : 'rgba(255,255,255,0.15)',
                          color: location.pathname === '/read' ? '#667eea' : '#fff',
                          borderRadius: '10px',
                          border: '1px solid rgba(255,255,255,0.3)',
                          transition: 'all 0.2s'
                        }}>
                        📋 <span>Student List</span>
                      </Link>
                    </li>


                    <li className="nav-item">
                      <Link to="/change-password" className="btn fw-medium px-4 d-flex align-items-center gap-2 nav-btn"
                        style={{
                          background: location.pathname === '/change-password' ? '#fff' : 'rgba(255,255,255,0.15)',
                          color: location.pathname === '/change-password' ? '#667eea' : '#fff',
                          borderRadius: '10px',
                          border: '1px solid rgba(255,255,255,0.3)',
                          transition: 'all 0.2s'
                        }}>
                        🔑 <span>Change Password</span>
                      </Link>
                    </li>

                    <li className="nav-item ms-2">
                      <button
                        className="btn fw-medium px-3"
                        style={{
                          background: 'rgba(255,255,255,0.15)',
                          color: '#fff',
                          borderRadius: '10px',
                          border: '1px solid rgba(255,255,255,0.3)',
                        }}
                        onClick={() => {
                          localStorage.removeItem('token'); // Clear JWT token
                          setIsLoggedIn(false);             // Trigger re-render to show Login
                          navigate('/login');               // Reset route so next login is a fresh one
                        }}
                      >
                        Logout
                      </button>
                    </li>

                  </ul>
                </div>
              </>
            )}
          </div>
        </nav>
      )}


      {!isPrintPage && (
        <div style={{ background: '#fff', borderBottom: '1px solid #e8eaff' }}>
          <div className="container-fluid py-2 px-4">
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0" style={{ fontSize: '13px' }}>
                <li className="breadcrumb-item">
                  <span style={{ color: '#667eea' }}>🏠 Home</span>
                </li>
                <li className="breadcrumb-item active text-muted">
                  {mustChange
                    ? 'Change Password'
                    : location.pathname === '/create'
                      ? 'Create Student'
                      : location.pathname === '/import'
                        ? 'Import Excel'
                        : location.pathname.startsWith('/update')
                          ? 'Update Student'
                          : location.pathname === '/states'
                            ? 'State Master'
                            : location.pathname === '/cities'
                              ? 'City Master'
                              : location.pathname === '/courses'
                                ? 'Course Master'
                                : location.pathname === '/users'
                                  ? 'User Master'
                                  : 'Student List'}
                </li>
              </ol>
            </nav>
          </div>
        </div>
      )}



      <div className={isPrintPage ? "" : "container-fluid py-4 px-4"}>
        <Routes>
          <Route path="/" element={<ProtectedRoute><StudentList /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/otp" element={<Otp onLogin={() => setIsLoggedIn(true)} />} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          <Route path="/read" element={<ProtectedRoute><StudentList /></ProtectedRoute>} />
          <Route path="/print-student/:id" element={<ProtectedRoute><PrintStudentId /></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute allowedRoles={["HEADMASTER", "TEACHER"]}><CreateStudent /></ProtectedRoute>} />
          <Route path="/update/:id" element={<ProtectedRoute allowedRoles={["HEADMASTER", "TEACHER"]}><UpdateStudent /></ProtectedRoute>} />
          <Route path="/import" element={<ProtectedRoute allowedRoles={["HEADMASTER", "TEACHER"]}><ImportStudent /></ProtectedRoute>} />
          <Route path="/import-preview" element={<ProtectedRoute allowedRoles={["HEADMASTER", "TEACHER"]}><ImportPreview /></ProtectedRoute>} />
          <Route path="/states" element={<ProtectedRoute allowedRoles={["HEADMASTER"]}><StateMaster /></ProtectedRoute>} />
          <Route path="/cities" element={<ProtectedRoute allowedRoles={["HEADMASTER"]}><CityMaster /></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute allowedRoles={["HEADMASTER"]}><CourseMaster /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute allowedRoles={["HEADMASTER"]}><UserMaster /></ProtectedRoute>} />
          <Route path="/student-details/:id" element={<ProtectedRoute><StudentDetails /></ProtectedRoute>} />
          <Route path="/location" element={<ProtectedRoute><Location /></ProtectedRoute>} />
        </Routes>
      </div>



      {!isPrintPage && (
        <footer className="text-center py-3 mt-4"
          style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
        </footer>
      )}

    </div>
  );
}

export default App;