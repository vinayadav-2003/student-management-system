import axios from 'axios';

const api = axios.create({ baseURL: '/api' }); // Relative URL → Vite proxy → localhost:5000

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.reload(); // App re-reads localStorage → shows Login
    }
    return Promise.reject(err);
  }
);

export default api;

export const getStudent = (id) => api.get(`/students/${id}`);
export const createStudent = (data) => api.post('/students', data);
export const updateStudent = (id, data) => api.put(`/students/${id}`, data);
export const deleteStudent = (id) => api.delete(`/students/${id}`);

export const getStudents = (page, limit, search = '', state = '', city = '', course = '') =>
  api.get('/students', { params: { page, limit, search, state, city, course } });

export const exportStudentsExcel = () => api.get('/export/students/excel', { responseType: 'blob' });
export const previewStudentsExcel = (formData) => api.post('/upload/students/excel/preview', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const importStudentsBulk = (students) => api.post('/upload/students/excel/import', { students });

export const getStates = () => api.get('/states');
export const createState = (data) => api.post('/states', data);
export const updateState = (id, data) => api.put(`/states/${id}`, data);
export const deleteState = (id) => api.delete(`/states/${id}`);

export const getCities = (stateId) => api.get('/cities', { params: { stateId } });
export const createCity = (data) => api.post('/cities', data);
export const updateCity = (id, data) => api.put(`/cities/${id}`, data);
export const deleteCity = (id) => api.delete(`/cities/${id}`);

export const getCourses = () => api.get('/courses');
export const createCourse = (data) => api.post('/courses', data);
export const updateCourse = (id, data) => api.put(`/courses/${id}`, data);
export const deleteCourse = (id) => api.delete(`/courses/${id}`);

export const getDashboardStats = () => api.get('/dashboard/stats');

export const getUsers = () => api.get('/users');
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);

export const getStudentsAggregates = () => api.get('/students/aggregates');

export const approveStudent = (id, data) => api.post(`/students/${id}/approval`, data);







