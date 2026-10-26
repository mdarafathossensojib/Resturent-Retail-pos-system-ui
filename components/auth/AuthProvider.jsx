"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import apiClient from "../../services/apiClient";

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authTokens, setAuthTokens] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchUserProfile = useCallback(async (accessToken) => {
    const response = await apiClient.get("/auth/users/me/", {
      headers: { Authorization: `JWT ${accessToken}` },
    });
    setUser(response.data);
    return response.data;
  }, []);

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      try {
        const raw = localStorage.getItem("authTokens");
        if (!raw) return;
        const tokens = JSON.parse(raw);
        if (!tokens?.access) {
          localStorage.removeItem("authTokens");
          return;
        }
        if (active) setAuthTokens(tokens);
        const response = await apiClient.get("/auth/users/me/", {
          headers: { Authorization: `JWT ${tokens.access}` },
        });
        if (active) setUser(response.data);
      } catch (error) {
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          localStorage.removeItem("authTokens");
          if (active) { setAuthTokens(null); setUser(null); }
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    restoreSession();
    return () => { active = false; };
  }, []);

  const loginUser = async (credentials) => {
    setErrorMsg("");
    try {
      const { data: tokens } = await apiClient.post("/auth/jwt/create/", credentials);
      if (!tokens?.access) throw new Error("Login response did not include an access token.");
      localStorage.setItem("authTokens", JSON.stringify(tokens));
      setAuthTokens(tokens);
      await fetchUserProfile(tokens.access);
      return { success: true };
    } catch (error) {
      localStorage.removeItem("authTokens");
      setAuthTokens(null);
      setUser(null);
      const data = error?.response?.data;
      const message = data?.detail || Object.values(data || {}).flat().join(" ") || error.message || "Login failed. Please try again.";
      setErrorMsg(message);
      return { success: false, message };
    }
  };

  // Djoser registration payload must match the project's configured UserCreateSerializer.
  const registerUser = async (userData) => {
    setErrorMsg("");
    try {
      await apiClient.post("/auth/users/", userData);
      return { success: true, message: "Registration successful. Follow any activation instructions sent by email." };
    } catch (error) {
      const data = error?.response?.data;
      const message = Object.values(data || {}).flat().join(" ") || "Registration failed. Please check your details.";
      setErrorMsg(message);
      return { success: false, message };
    }
  };

  const logoutUser = () => {
    localStorage.removeItem("authTokens");
    localStorage.removeItem("cartId");
    setAuthTokens(null);
    setUser(null);
    setErrorMsg("");
  };

  return <AuthContext.Provider value={{ user, authTokens, loading, errorMsg, loginUser, registerUser, logoutUser, fetchUserProfile }}>
    {children}
  </AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
