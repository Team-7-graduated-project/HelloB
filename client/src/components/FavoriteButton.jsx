import { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import { FavoritesContext } from "../context/favoritesContextValue";
import { UserContext } from "../UserContext";
import { FaHeart } from "react-icons/fa";
import { toast } from "react-hot-toast";

const FavoriteButton = ({ placeId, initialState = false, className = "" }) => {
  const [isFavorite, setIsFavorite] = useState(initialState);
  const { favorites, addFavorite, removeFavorite } =
    useContext(FavoritesContext);
  const { user } = useContext(UserContext);

  useEffect(() => {
    setIsFavorite(favorites.includes(placeId));
  }, [favorites, placeId]);

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to save favorites");
      return;
    }

    try {
      if (isFavorite) {
        await removeFavorite(placeId);
        toast.success("Removed from favorites");
      } else {
        await addFavorite(placeId);
        toast.success("Added to favorites");
      }
    } catch (error) {
      toast.error(error.message || "Error updating favorites");
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      className={`${className} transition-colors duration-300`}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <FaHeart
        className={`${
          isFavorite ? "text-red-500" : "text-gray-300"
        } hover:text-red-500 text-xl`}
      />
    </button>
  );
};

FavoriteButton.propTypes = {
  placeId: PropTypes.string.isRequired,
  initialState: PropTypes.bool,
  className: PropTypes.string,
};

export default FavoriteButton;
