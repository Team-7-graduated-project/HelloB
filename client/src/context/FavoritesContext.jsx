import { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { FavoritesContext } from "./favoritesContextValue";
import { UserContext } from "../UserContext";

function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(UserContext);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites([]);
      setLoading(false);
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/user/favorites/places", {
        withCredentials: true,
      });
      setFavorites(response.data || []);
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error("Error fetching favorites:", error);
      }
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const addFavorite = async (placeId) => {
    if (!user) {
      throw new Error("Please login to add favorites");
    }
    try {
      const response = await axios.post(
        "/user/favorites/toggle",
        { placeId },
        { withCredentials: true }
      );
      setFavorites(response.data);
      return response.data;
    } catch (error) {
      console.error("Error adding favorite:", error);
      throw error;
    }
  };

  const removeFavorite = async (placeId) => {
    if (!user) {
      throw new Error("Please login to remove favorites");
    }
    try {
      const response = await axios.post(
        "/user/favorites/toggle",
        { placeId },
        { withCredentials: true }
      );
      setFavorites(response.data);
      return response.data;
    } catch (error) {
      console.error("Error removing favorite:", error);
      throw error;
    }
  };

  const isFavorite = (placeId) => {
    return favorites.includes(placeId);
  };

  const contextValue = {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    loading,
  };

  return (
    <FavoritesContext.Provider value={contextValue}>
      {children}
    </FavoritesContext.Provider>
  );
}

FavoritesProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export { FavoritesProvider };
