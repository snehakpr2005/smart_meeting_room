import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api.js";

const AuthContext = createContext(null);
const supportedRoles = ["employee", "admin", "facility_manager"];

function readClaims(token) {
  try {
    const payload = token.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/");
    if (!payload) return null;
    const claims = JSON.parse(window.atob(payload));
    if (
      !supportedRoles.includes(claims.role) ||
      typeof claims.userId !== "string" ||
      (claims.exp && claims.exp * 1000 <= Date.now())
    ) {
      return null;
    }
    return { userId: claims.userId, role: claims.role };
  } catch {
    return null;
  }
}

function loadSession() {
  const token = window.sessionStorage.getItem("accessToken");
  const claims = token ? readClaims(token) : null;
  if (!token || !claims) {
    window.sessionStorage.removeItem("accessToken");
    return null;
  }
  return { token, ...claims };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession);

  useEffect(() => {
    const expireSession = () => {
      window.sessionStorage.removeItem("accessToken");
      setSession(null);
    };
    window.addEventListener("auth:expired", expireSession);
    return () => window.removeEventListener("auth:expired", expireSession);
  }, []);

  async function login(email, password) {
    const response = await api.post("/user/auth/login", { email, password });
    const token = response.data?.accessToken;
    const claims = typeof token === "string" ? readClaims(token) : null;
    if (!response.data?.success || !claims) {
      throw new Error("Login succeeded without a usable access token and role.");
    }
    window.sessionStorage.setItem("accessToken", token);
    setSession({ token, ...claims });
    return claims.role;
  }

  async function logout() {
    let logoutError;
    try {
      await api.post("/user/auth/logout");
    } catch (error) {
      logoutError = error;
    } finally {
      window.sessionStorage.removeItem("accessToken");
      setSession(null);
    }
    if (logoutError) throw logoutError;
  }

  const value = useMemo(() => ({ session, login, logout }), [session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
