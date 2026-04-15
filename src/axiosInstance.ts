import axios from "axios";

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("healix-admin-token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
