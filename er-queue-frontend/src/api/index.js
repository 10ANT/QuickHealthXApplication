import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// A Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// So basically an implemenetation of Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors (token expired)
    if (error.response.status === 401 && !originalRequest._retry) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Authentication Services to be passed to laravel breeze
export const authService = {
  register: async (userData) => {
    const response = await api.post('/register', userData);
    return response.data;
  },
  
  login: async (credentials) => {
    const response = await api.post('/login', credentials);
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/logout');
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/user');
    return response.data;
  },
};

// patient Services, pass the patient route in webpp to facilitate crud
export const patientService = {
  getAll: async () => {
    const response = await api.get('/patients');
    return response.data;
  },
  
  get: async (id) => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },
  
  create: async (patientData) => {
    const response = await api.post('/patients', patientData);
    return response.data;
  },
  
  update: async (id, patientData) => {
    const response = await api.put(`/patients/${id}`, patientData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/patients/${id}`);
    return response.data;
  },
  
  search: async (query) => {
    const response = await api.get(`/patients/search?query=${query}`);
    return response.data;
  },
};

// Triage Services
export const triageService = {
  create: async (triageData) => {
    const response = await api.post('/triage', triageData);
    return response.data;
  },
};

// Queue Services
export const queueService = {
  getQueue: async () => {
    const response = await api.get('/queue');
    return response.data;
  },
};


export const doctorService = {
  toggleAvailability: async () => {
    const response = await api.post('/doctor/toggle-availability');
    return response.data;
  },
  // Doctor Services
  assignPatient: async (doctorId) => {
    const response = await api.post('/doctor/assign-patient', { doctor_id: doctorId });
    return response.data;
  },
  
  getCurrentSession: async () => {
    const response = await api.get('/doctor/current-session');
    return response.data;
  },
  
  completeSession: async (sessionId, medicalNotes) => {
    const response = await api.post('/doctor/complete-session', {
      session_id: sessionId,
      medical_notes: medicalNotes,
    });
    return response.data;
  },
};

export default api;