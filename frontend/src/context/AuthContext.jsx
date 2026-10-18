
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("taskflow_token");

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/auth/me")
      .then((response) => setUser(response.data.user))
      .catch(() => {
        localStorage.removeItem("taskflow_token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function register(name, email, password) {
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
    });

    localStorage.setItem("taskflow_token", response.data.token);
    setUser(response.data.user);

    return response.data;
  }

  async function login(email, password) {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    localStorage.setItem("taskflow_token", response.data.token);
    setUser(response.data.user);

    return response.data;
  }

  function logout() {
    localStorage.removeItem("taskflow_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, register, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
