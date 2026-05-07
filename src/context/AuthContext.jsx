import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { endpoints } from "../api/axios";
import toast from "react-hot-toast";
import PropTypes from "prop-types";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);

    const handleStorageChange = (e) => {
      if (e.key === "user" && e.newValue === null) {
        setUser(null);
        toast.error("Logged out from another tab or window.");
      }
    };

    globalThis.addEventListener("storage", handleStorageChange);
    return () => globalThis.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      const { data } = await endpoints.auth.login(credentials);
      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.data.user));
        setUser(data.data.user);
        toast.success(`Welcome back, ${data.data.user.fullName}`);
        return true;
      }
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await endpoints.auth.logout();
    } catch (error) {
      console.error("Backend logout failed", error);
    } finally {
      localStorage.removeItem("user");
      setUser(null);
      toast.success("Logged out successfully");
    }
  }, []);

  const updateUser = useCallback((newUserData) => {
    setUser((prevUser) => {
      const updated = { ...prevUser, ...newUserData };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      login,
      logout,
      loading,
      updateUser,
    }),
    [user, login, logout, loading, updateUser],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);
