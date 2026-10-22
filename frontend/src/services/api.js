import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: true,
});

let refreshPromise = null;

api.interceptors.request.use((config) => {
  const token = window.sessionStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const hasSession = window.sessionStorage.getItem("accessToken");
    if (error.response?.status !== 401 || !hasSession || !request || request._retry || request.url?.includes("/user/auth/")) {
      if (error.response?.status === 401 && hasSession) {
        window.sessionStorage.removeItem("accessToken");
        window.dispatchEvent(new Event("auth:expired"));
      }
      return Promise.reject(error);
    }

    request._retry = true;
    try {
      if (!refreshPromise) {
        refreshPromise = axios.post(
          `${api.defaults.baseURL}/user/auth/refreshToken`,
          {},
          { withCredentials: true },
        ).then((response) => {
          const token = response.data?.accessToken;
          if (!response.data?.success || !token) {
            throw new Error(response.data?.message || "Could not refresh the session.");
          }
          window.sessionStorage.setItem("accessToken", token);
          return token;
        }).finally(() => {
          refreshPromise = null;
        });
      }

      const token = await refreshPromise;
      request.headers.Authorization = `Bearer ${token}`;
      return api(request);
    } catch (refreshError) {
      window.sessionStorage.removeItem("accessToken");
      window.dispatchEvent(new Event("auth:expired"));
      return Promise.reject(refreshError);
    }
  },
);

export function getErrorMessage(error) {
  return error.response?.data?.message || error.message || "Something went wrong.";
}

export default api;
