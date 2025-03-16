import axios from "/node_modules/.vite/deps/axios.js?v=243b787d";

const API_URL = 'http://localhost:8000';

// Create a function to get the Laravel CSRF token from cookie
function getCSRFToken() {
  // Create a temporary XMLHttpRequest to get cookies
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `${API_URL}/sanctum/csrf-cookie`, false);  // Synchronous request
  xhr.withCredentials = true;
  try {
    xhr.send();
  } catch(e) {
    console.error("Failed to fetch CSRF token", e);
  }
  
  // Extract XSRF-TOKEN from cookies
  let token = '';
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith('XSRF-TOKEN=')) {
      token = decodeURIComponent(cookie.substring('XSRF-TOKEN='.length));
      break;
    }
  }
  return token;
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add Bearer token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // For non-GET requests, add X-XSRF-TOKEN header
    if (config.method !== 'get') {
      config.headers['X-XSRF-TOKEN'] = getCSRFToken();
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth services
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
    const response = await api.get('/api/user');
    return response.data;
  },
};

// Keep the rest of your services as they are...
export const patientService = { /* ... */ };
export const triageService = { /* ... */ };
export const queueService = { /* ... */ };
export const doctorService = { /* ... */ };

export default api;