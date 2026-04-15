import { AuthProvider } from "@refinedev/core";
import axios from "axios";

// URL backend của bạn
export const API_URL = "http://localhost:3000/api/admin";

export const authProvider: AuthProvider = {
  // Logic xử lý Đăng nhập
  login: async ({ email, password }) => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      if (data.success) {
        // Lưu token và thông tin admin vào localStorage
        localStorage.setItem("healix-admin-token", data.token);
        localStorage.setItem("healix-admin-user", JSON.stringify(data.admin));

        return {
          success: true,
          redirectTo: "/",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.response?.data?.message || "Đăng nhập thất bại",
          name: "Invalid Credentials",
        },
      };
    }
    return { success: false };
  },

  // Logic xử lý Đăng xuất
  logout: async () => {
    localStorage.removeItem("healix-admin-token");
    localStorage.removeItem("healix-admin-user");
    return {
      success: true,
      redirectTo: "/login",
    };
  },

  // Kiểm tra xem đã đăng nhập chưa (Refine sẽ dùng cái này để bảo vệ các route)
  check: async () => {
    const token = localStorage.getItem("healix-admin-token");
    if (token) {
      return { authenticated: true };
    }
    return {
      authenticated: false,
      logout: true,
      redirectTo: "/login",
    };
  },

  // Lấy thông tin admin hiện tại để hiển thị lên Header/Avatar
  getIdentity: async () => {
    const user = localStorage.getItem("healix-admin-user");
    if (user) {
      return JSON.parse(user);
    }
    return null;
  },

  // Xử lý khi Token hết hạn (Lỗi 401/403 từ backend)
  onError: async (error) => {
    if (error.status === 401 || error.status === 403) {
      localStorage.removeItem("healix-admin-token");
      return { logout: true };
    }
    return { error };
  },
};
