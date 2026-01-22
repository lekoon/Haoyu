import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add JWT token to requests
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('haoyu-token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor to handle unauthorized errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('haoyu-token');
            // window.location.href = '/login'; // Or handle via history/router
        }
        return Promise.reject(error);
    }
);

export default apiClient;
