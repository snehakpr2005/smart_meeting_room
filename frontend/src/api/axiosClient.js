import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle token refresh and format errors
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized for token refresh
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/user/auth/login') &&
      !originalRequest.url.includes('/user/auth/register') &&
      !originalRequest.url.includes('/user/auth/refreshToken')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/user/auth/refreshToken`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data?.accessToken;
        if (newAccessToken) {
          localStorage.setItem('accessToken', newAccessToken);
          axiosClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosClient(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// API Services
export const authApi = {
  login: (credentials) => axiosClient.post('/user/auth/login', credentials),
  register: (userData) => axiosClient.post('/user/auth/register', userData),
  createFacilityManager: (data) => axiosClient.post('/user/auth/createfacilitymanager', data),
  logout: () => axiosClient.post('/user/auth/logout'),
  refreshToken: () => axiosClient.post('/user/auth/refreshToken'),
};

export const roomApi = {
  // Gracefully handles 404 ("no rooms found") by returning empty array
  getAllRooms: async () => {
    try {
      const response = await axiosClient.get('/room/rooms');
      return response.data?.data || [];
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return [];
      }
      throw err;
    }
  },
  getRoomById: (id) => axiosClient.get(`/room/room/${id}`),
  createRoom: (roomData) => axiosClient.post('/room/create', roomData),
  updateRoom: (id, roomData) => axiosClient.put(`/room/room/${id}`, roomData),
  deleteRoom: (id) => axiosClient.delete(`/room/room/${id}`),
};

export const resourceApi = {
  getAllResources: async () => {
    const response = await axiosClient.get('/resource/getResource');
    return Array.isArray(response.data) ? response.data : [];
  },
  getResourceById: (id) => axiosClient.get(`/resource/getResource/${id}`),
  createResource: (resData) => axiosClient.post('/resource/createResource', resData),
  updateResource: (id, resData) => axiosClient.put(`/resource/update/${id}`, resData),
  deleteResource: (id) => axiosClient.put(`/resource/delete/${id}`),
};

export const bookingApi = {
  getAllBookings: async () => {
    const response = await axiosClient.get('/booking');
    return response.data?.data || [];
  },
  getBookingById: (id) => axiosClient.get(`/booking/${id}`),
  createBooking: (bookingData) => axiosClient.post('/booking/create', bookingData),
  cancelBooking: (id) => axiosClient.put(`/booking/cancel/${id}`),
  checkInBooking: (id) => axiosClient.put(`/booking/checkedin/${id}`),
};

export const waitingListApi = {
  getWaitingList: async () => {
    const response = await axiosClient.get('/waiting-list');
    return response.data?.data || [];
  },
  joinWaitingList: (data) => axiosClient.post('/waiting-list/join', data),
  leaveWaitingList: (id) => axiosClient.put(`/waiting-list/leave/${id}`),
};

export default axiosClient;

