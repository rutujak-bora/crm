import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const GemBidAuthContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api/gem-bid";

export const GemBidAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("gem_bid_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Verify token is still valid
      axios.get(`${API_URL}/bids`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(() => {
        const userData = JSON.parse(localStorage.getItem("gem_bid_user") || "{}");
        setUser(userData);
      })
      .catch(() => {
        logout();
      })
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    const { token: newToken, user: userData } = response.data;
    
    localStorage.setItem("gem_bid_token", newToken);
    localStorage.setItem("gem_bid_user", JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("gem_bid_token");
    localStorage.removeItem("gem_bid_user");
    setToken(null);
    setUser(null);
  };

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${token}` }
  });

  return (
    <GemBidAuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      getAuthHeader,
      isAuthenticated: !!token,
      loading
    }}>
      {children}
    </GemBidAuthContext.Provider>
  );
};

export const useGemBidAuth = () => {
  const context = useContext(GemBidAuthContext);
  if (!context) {
    throw new Error("useGemBidAuth must be used within GemBidAuthProvider");
  }
  return context;
};
