import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    const msg = err.response?.data?.message || err.message;
    toast.error(msg);
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data).then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data),
};

export const studentAPI = {
  list: (params) => api.get('/students', { params }).then(r => r.data),
  getById: (id) => api.get(`/students/${id}`).then(r => r.data),
  create: (data) => api.post('/students', data).then(r => r.data),
  update: (id, data) => api.put(`/students/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/students/${id}`).then(r => r.data),
  getStats: () => api.get('/students/stats').then(r => r.data),
};

export const attendanceAPI = {
  getByDate: (date) => api.get('/attendance/by-date', { params: { date } }).then(r => r.data),
  mark: (data) => api.post('/attendance/mark', data).then(r => r.data),
  markBulk: (data) => api.post('/attendance/bulk', data).then(r => r.data),
  getStats: (startDate, endDate) => api.get('/attendance/stats', { params: { startDate, endDate } }).then(r => r.data),
  getStudent: (id, startDate, endDate) => api.get(`/attendance/student/${id}`, { params: { startDate, endDate } }).then(r => r.data),
  getTodayUnmarked: () => api.get('/attendance/today-unmarked').then(r => r.data),
};
