import { useEffect, useState } from "react";
import axios from "axios";
import PlaceImg from "../PlaceImg";
import ErrorBoundary from "../components/ErrorBoundary";
import {
  FaSpinner,
  FaSearch,
  FaMapMarkerAlt,
  FaCalendarAlt,
} from "react-icons/fa";
import { format, formatDistanceToNow, parseISO } from "date-fns";

function PlacesList() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [visiblePlaces, setVisiblePlaces] = useState(10);

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/places", {
        withCredentials: true,
      });

      setPlaces(response.data);
      setFilteredPlaces(response.data);
    } catch (error) {
      console.error("Failed to load places:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert("You are not authorized to view this page");
      } else {
        alert(
          "Failed to load places: " +
            (error.response?.data?.error || error.message)
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const deletePlace = async (id) => {
    try {
      setDeletingId(id);
      await axios.delete(`/api/admin/places/${id}`, {
        withCredentials: true,
      });

      setPlaces((prevPlaces) => prevPlaces.filter((place) => place._id !== id));
      setFilteredPlaces((prevPlaces) =>
        prevPlaces.filter((place) => place._id !== id)
      );
      alert("Place deleted successfully");
    } catch (error) {
      console.error("Failed to delete place:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert("You are not authorized to delete this place");
      } else {
        alert(
          "Failed to delete place: " +
            (error.response?.data?.error || error.message)
        );
      }
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this place?"
    );
    if (confirmDelete) {
      deletePlace(id);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim() === "") {
      setFilteredPlaces(places);
    } else {
      setFilteredPlaces(
        places.filter(
          (place) =>
            place.title.toLowerCase().includes(value.toLowerCase()) ||
            place.address.toLowerCase().includes(value.toLowerCase())
        )
      );
    }
    setVisiblePlaces(10);
  };

  const handleWatchMore = () => {
    setVisiblePlaces((prevVisible) => prevVisible + 10);
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return "No date available";
      const date = parseISO(dateString);
      return {
        formatted: format(date, "MMM dd, yyyy"),
        timeAgo: formatDistanceToNow(date, { addSuffix: true }),
      };
    } catch (error) {
      console.error("Error formatting date:", error);
      return {
        formatted: "Invalid date",
        timeAgo: "Unknown time ago",
      };
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 mb-8 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Property Management</h1>
            <p className="text-white/80">Manage and monitor all listed properties</p>
          </div>
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search properties..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gary-600" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <FaSpinner className="animate-spin text-blue-500 text-3xl" />
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPlaces.slice(0, visiblePlaces).map((place) => (
            <div
              key={place._id}
              className="bg-white rounded-lg shadow-md p-6 flex justify-between items-start"
            >
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <PlaceImg
                    place={place}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                </div>

                <div className="flex flex-col">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {place.title}
                  </h3>
                  <p className="text-gray-600 mt-1">{place.address}</p>
                  <p className="text-lg font-semibold text-blue-600 mt-2">
                    ${place.price}{" "}
                    <span className="text-sm text-gray-500">/night</span>
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <FaCalendarAlt className="text-gray-400" />
                    <div className="flex flex-col">
                      {place.createdAt && (
                        <>
                          <span className="text-sm text-gray-900">
                            Listed {formatDate(place.createdAt).formatted}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(place.createdAt).timeAgo}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Host Information
                    </h4>
                    {place.owner ? (
                      <>
                        <p className="text-gray-700">
                          <span className="font-medium">Name:</span>{" "}
                          {place.owner.name}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium">Email:</span>{" "}
                          {place.owner.email}
                        </p>
                        {place.owner.phone && (
                          <p className="text-gray-700">
                            <span className="font-medium">Phone:</span>{" "}
                            {place.owner.phone}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-500 italic">
                        No owner information available
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => confirmDelete(place._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  disabled={deletingId === place._id}
                >
                  {deletingId === place._id ? (
                    <span className="flex items-center gap-2">
                      <FaSpinner className="animate-spin" />
                      Deleting...
                    </span>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {visiblePlaces < filteredPlaces.length && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleWatchMore}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            Load More Places
          </button>
        </div>
      )}
    </div>
  );
}

function ManagePlacesPage() {
  return (
    <ErrorBoundary>
      <PlacesList />
    </ErrorBoundary>
  );
}

export default ManagePlacesPage;
