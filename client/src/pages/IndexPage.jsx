import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  FaClock,
  FaFire,
  FaStar,
  FaMapMarkerAlt,
  FaTags,
  FaHome,
  FaBuilding,
  FaWarehouse,
  FaHotel,
  FaUmbrellaBeach,
} from "react-icons/fa";
import PropTypes from "prop-types";
import BackToTop from "../BackToTop";
import SearchEle from "../SearchEle";
import FavoriteButton from "../components/FavoriteButton";

// Define Place PropType shape
const PlaceType = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  address: PropTypes.string.isRequired,
  photos: PropTypes.arrayOf(PropTypes.string),
  perks: PropTypes.arrayOf(PropTypes.string),
  price: PropTypes.number.isRequired,
  rating: PropTypes.number,
  property_type: PropTypes.string.isRequired,
  max_guests: PropTypes.number.isRequired,
  bedrooms: PropTypes.number,
  beds: PropTypes.number,
  bathrooms: PropTypes.number,
  check_in: PropTypes.string,
  check_out: PropTypes.string,
  minimum_stay: PropTypes.number,
  house_rules: PropTypes.arrayOf(PropTypes.string),
  cancellation_policy: PropTypes.string,
  extra_info: PropTypes.string,
  createdAt: PropTypes.string,
  updatedAt: PropTypes.string,
  owner: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
  }),
});

export default function IndexPage({
  initialPlaces = [],
  initialPopularPlaces = [],
}) {
  const [places, setPlaces] = useState(initialPlaces);
  const [popularPlaces, setPopularPlaces] = useState(initialPopularPlaces);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState("all");
  const navigate = useNavigate();

  const propertyTypes = [
    { type: "all", label: "All", icon: FaHome },
    { type: "apartment", label: "Apartment", icon: FaBuilding },
    { type: "house", label: "House", icon: FaHome },
    { type: "villa", label: "Villa", icon: FaWarehouse },
    { type: "hotel", label: "Hotel", icon: FaHotel },
    { type: "resort", label: "Resort", icon: FaUmbrellaBeach },
  ];

  const fetchPlaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [allPlacesResponse, popularPlacesResponse] = await Promise.all([
        axios.get("/api/places/search", {
          params: {
            limit: 12,
            sort: "createdAt",
            type: selectedType === "all" ? undefined : selectedType,
            isActive: true,
          },
        }),
        axios.get("/api/places/search", {
          params: {
            limit: 4,
            sort: "rating",
            isActive: true,
          },
        }),
      ]);

      if (!allPlacesResponse.data || !popularPlacesResponse.data) {
        throw new Error("Invalid response data");
      }

      setPlaces(allPlacesResponse.data.places || []);
      setPopularPlaces(popularPlacesResponse.data.places || []);
    } catch (error) {
      console.error("Fetch error:", error);
      setError(
        error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Failed to load places"
      );
    } finally {
      setLoading(false);
    }
  }, [selectedType]);

  const PlaceCard = ({ place, index }) => {
    return (
      <Link
        to={`/place/${place._id}`}
        key={place._id}
        onClick={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        style={{
          animation: `fadeInUp 0.6s ease-out forwards ${index * 0.1}s`,
          opacity: 0,
        }}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          {place.photos?.[0] && (
            <img
              loading="lazy"
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
            className="absolute max-w-9 top-3 left-3 p-2 rounded-full"
          />
          <div className="absolute bottom-3 left-3 text-white">
            <div className="flex items-center gap-2 text-sm mb-2 bg-black/40 px-2 py-1 rounded-full">
              <FaMapMarkerAlt className="text-primary" />
              <span className="truncate max-w-[200px]">{place.address}</span>
            </div>
            <p className="font-bold text-xl shadow-text">
              ${place.price}
              <span className="font-normal text-sm opacity-90"> / night</span>
            </p>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-1">
            {place.title}
          </h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-primary font-medium">
              {place.property_type}
            </span>
            <span className="text-gray-600">
              {place.max_guests} guest{place.max_guests !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </Link>
    );
  };

  PlaceCard.propTypes = {
    place: PlaceType.isRequired,
    index: PropTypes.number.isRequired,
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    navigate(`/search?type=${type}`);
  };

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <button
          onClick={() => {
            window.location.reload();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] mb-16">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1571896349842-33c89424de2d"
            alt="Hero background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60"></div>
        </div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
          <h1 className="text-5xl md:text-7xl text-white font-bold text-center mb-6 animate-fadeIn">
            Find Your Perfect Stay
          </h1>
          <p className="text-xl md:text-2xl text-white text-center mb-12 max-w-2xl animate-fadeInDelay opacity-90">
            Discover unique places to stay and unforgettable experiences
          </p>

          <div className="w-full max-w-5xl animate-fadeInUp">
            <SearchEle />
          </div>
        </div>
      </section>

      {/* Property Type Filter */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-3 px-4 overflow-x-auto pb-2 hide-scrollbar">
          {propertyTypes.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => {
                handleTypeSelect(type);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 ${
                selectedType === type
                  ? "bg-primary text-white shadow-md"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon className="text-lg" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex items-center justify-center mb-10">
        <div className="text-lg font-medium text-primary text-center">
          🌟 Discover special deals just for you! 🌟
        </div>

        <div className="absolute right-[100px]">
          <Link
            to="/vouchers"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 shadow-lg"
          >
            <FaTags />
            Deals and Discounts
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 space-y-20">
        {/* Popular Places */}
        <section>
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3 group">
              <FaFire className="text-primary max-w-8 group-hover:scale-110 transition-transform" />
              Trending Destinations
            </h2>
            <Link
              to="/search"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors"
            >
              View all
              <span className="text-xl">→</span>
            </Link>
          </div>

          {popularPlaces.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {popularPlaces.map((place, index) => (
                <PlaceCard key={place._id} place={place} index={index} />
              ))}
            </div>
          ) : (
            <p>No trending destinations available at the moment.</p>
          )}
        </section>

        {/* Recently Added */}
        <section className="pb-16">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3 group">
              <FaClock className="text-primary group-hover:scale-110 transition-transform" />
              New on HelloB
            </h2>
            <Link
              to="/search?sort=newest"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors"
            >
              View all
              <span className="text-xl">→</span>
            </Link>
          </div>

          {places.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {places.map((place, index) => (
                <PlaceCard key={place._id} place={place} index={index} />
              ))}
            </div>
          ) : (
            <p>No new places available at the moment.</p>
          )}
        </section>
      </div>

      <BackToTop />
    </div>
  );
}

IndexPage.propTypes = {
  initialPlaces: PropTypes.arrayOf(PlaceType),
  initialPopularPlaces: PropTypes.arrayOf(PlaceType),
};
