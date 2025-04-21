import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

import { siteConfig } from "@/config/site.ts";

interface Role {
  id: number;
  name: string;
  description: string;
  level: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  login: (token: string) => void;
  logout: () => void;
  fetchWithAuth: <T>(url: string, options?: RequestInit) => Promise<T>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");

    return savedUser ? JSON.parse(savedUser) : null;
  });

  const isAdmin = user?.role.name === "admin";

  const decodeJwt = (token: string) => {
    const payload = token.split('.')[1];
    const decodedPayload = atob(payload);
    return JSON.parse(decodedPayload);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    const decodedToken = decodeJwt(token);
    const currentTime = Math.floor(Date.now() / 1000);

    if (decodedToken.exp < currentTime) {
      console.warn("Токен протерміновано, вихід з акаунту");
      logout();
      return;
    }

    axios
        .get(`${siteConfig.server_api}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          const userData: User = response.data.data;
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        })
        .catch(() => {
          console.warn("Помилка при перевірці користувача, вихід з акаунту");
          logout();
        });
  }, []);



  const login = (token: string) => {
    localStorage.setItem("token", token);

    axios
      .get(`${siteConfig.server_api}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        const userData: User = response.data.data;

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      })
      .catch(() => logout());
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const fetchWithAuth = async <T,>(
    url: string,
    options: RequestInit = {},
  ): Promise<any> => {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Користувач не авторизований");
    }

    try {
      const response = await fetch(`${siteConfig.server_api}${url}`, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 204) {
        return null as T;
      }
      if (!response.ok) {
        if (response.status === 401) {
          logout();
        }
        if (response.status === 404) {
          return null as T;
        }
        throw new Error(`Помилка запиту: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error("fetchWithAuth error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAdmin, login, logout, fetchWithAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
