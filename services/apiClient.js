import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "https://resturent-retail-pos-system.vercel.app/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Add the stored access token to authenticated requests in the browser.
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const rawTokens = localStorage.getItem("authTokens");
    if (rawTokens) {
      try {
        const tokens = JSON.parse(rawTokens);
        if (tokens?.access) config.headers.Authorization = `JWT ${tokens.access}`;
      } catch {
        localStorage.removeItem("authTokens");
      }
    }
  }
  return config;
});

export default apiClient;
