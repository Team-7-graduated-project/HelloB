import { createContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";

export const UserContext = createContext({});

// Configure axios defaults
axios.defaults.baseURL = "http://localhost:3000";
axios.defaults.withCredentials = true;

export function UserContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setReady(true);
          return;
        }

        const { data } = await axios.get("/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(data);
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          setUser(null);
        }
      } finally {
        setReady(true);
      }
    };

    fetchUser();
  }, []);

  // Login function to set user and token
  const login = async (userData, token) => {
    setUser(userData);
    localStorage.setItem("token", token);
  };

  // Logout function to clear user and token
  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        ready,
        login,
        logout,
        userRole: user?.role,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

UserContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
