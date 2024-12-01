import { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { UserContext } from "../UserContext";
import { FaStar, FaMapMarkerAlt } from "react-icons/fa";
import FavoriteButton from "../components/FavoriteButton";

export default function FavoritesPage() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchFavorites();
  }, [user, navigate]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/user/favorites/places");
      setPlaces(data);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          My Favorite Places
        </h1>

        {places.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              No favorites yet
            </h2>
            <p className="text-gray-500 mb-6">
              Start exploring and save your favorite places!
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              Explore Places
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {places.map((place) => (
              <Link
                key={place._id}
                to={`/place/${place._id}`}
                className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {place.photos?.[0] && (
                    <img
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      src={place.photos[0]}
                      alt={place.title}
                    />
                  )}
                  {place.rating > 0 && (
                    <div className="absolute top-3 right-3 bg-white/95 text-primary px-3 py-1 rounded-full flex items-center gap-1 text-sm font-medium shadow-lg">
                      <FaStar className="text-yellow-400" />
                      <span>{place.rating.toFixed(1)}</span>
                    </div>
                  )}
                  <FavoriteButton
                    placeId={place._id}
                    className="absolute top-3 max-w-9 left-3 p-2 rounded-full"
                  />
                  <div className="absolute bottom-3 left-3 text-white">
                    <div className="flex items-center gap-2 text-sm mb-2 bg-black/40 px-2 py-1 rounded-full">
                      <FaMapMarkerAlt className="text-primary" />
                      <span className="truncate max-w-[200px]">
                        {place.address}
                      </span>
                    </div>
                    <p className="font-bold text-xl shadow-text">
                      ${place.price}
                      <span className="font-normal text-sm opacity-90">
                        {" "}
                        / night
                      </span>
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">
                    {place.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
