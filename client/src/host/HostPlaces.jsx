import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FaPlus, FaSearch, FaSpinner, FaEdit, FaTrash, FaEye, FaEyeSlash, FaHome, FaMapMarkerAlt, FaDollarSign, FaUsers } from "react-icons/fa";

function HostPlaces() {
  const [places, setPlaces] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayCount, setDisplayCount] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [reason, setReason] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // "newest", "oldest", "price-high", "price-low"

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      const response = await axios.get("/host/places");
      setPlaces(response.data);
    } catch (error) {
      console.error("Error fetching places:", error);
      setError("Error loading places, please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id) => {
    navigate(`/host/places/${id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this place? This action cannot be undone.")) {
      try {
        setLoading(true);
        await axios.delete(`/places/${id}`, {
          withCredentials: true,
        });

        setPlaces((prevPlaces) => prevPlaces.filter((place) => place._id !== id));
        toast.success("Place deleted successfully");
      } catch (error) {
        console.error("Error deleting place:", error);
        toast.error(error.response?.data?.error || "Error deleting place");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStatusToggle = (place) => {
    if (place.isActive) {
      setSelectedPlace(place);
      setShowReasonModal(true);
    } else {
      updatePlaceStatus(place._id, true);
    }
  };

  const updatePlaceStatus = async (placeId, isActive, deactivationReason = "") => {
    try {
      const response = await axios.put(`/host/places/${placeId}/status`, {
        isActive,
        reason: deactivationReason,
      });

      setPlaces(places.map((place) =>
        place._id === placeId
          ? {
              ...place,
              isActive: response.data.isActive,
              deactivationReason: response.data.deactivationReason,
            }
          : place
      ));

      setShowReasonModal(false);
      setSelectedPlace(null);
      setReason("");
      toast.success(`Place ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error("Error updating place status:", error);
      toast.error(error.response?.data?.error || "Failed to update place status");
    }
  };

  const handleReasonSubmit = () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    if (selectedPlace) {
      updatePlaceStatus(selectedPlace._id, false, reason);
    }
  };

  const sortPlaces = (places) => {
    const sortedPlaces = [...places];
    switch (sortBy) {
      case "oldest":
        return sortedPlaces.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case "price-high":
        return sortedPlaces.sort((a, b) => b.price - a.price);
      case "price-low":
        return sortedPlaces.sort((a, b) => a.price - b.price);
      default: // newest
        return sortedPlaces.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  };

  const filteredPlaces = sortPlaces(places).filter((place) =>
    place.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 mb-8 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Property Management</h1>
            <p className="text-white/80">
              Manage and monitor all your listed properties
            </p>
          </div>
          <Link
            to="/host/places/new"
            className="bg-white text-primary px-6 py-3 rounded-xl hover:bg-gray-50 
                     transition-all duration-200 flex items-center gap-2 shadow-lg hover:scale-105"
          >
            <FaPlus />
            Add New Property
          </Link>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative flex-1">
            <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price-high">Price: High to Low</option>
            <option value="price-low">Price: Low to High</option>
          </select>
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <FaSpinner className="animate-spin text-primary text-4xl" />
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-xl text-red-700">{error}</div>
      ) : filteredPlaces.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaces.slice(0, displayCount).map((place) => (
            <div
              key={place._id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col h-full"
            >
              {/* Property Image - Fixed height */}
              <div className="relative h-48 flex-shrink-0">
                <img
                  src={place.photos[0]}
                  alt={place.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => handleStatusToggle(place)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      place.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {place.isActive ? (
                      <span className="flex items-center gap-1">
                        <FaEye /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <FaEyeSlash /> Hidden
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Property Details - Will expand to fill available space */}
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-semibold mb-2">{place.title}</h3>
                <div className="space-y-2 text-gray-600 flex-grow">
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-gray-400" />
                    <span className="text-sm">{place.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaDollarSign className="text-gray-400" />
                    <span className="text-sm">${place.price}/night</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaUsers className="text-gray-400" />
                    <span className="text-sm">Max guests: {place.max_guests}</span>
                  </div>
                </div>

                {!place.isActive && place.deactivationReason && (
                  <div className="mt-4 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                    <strong>Hidden reason:</strong> {place.deactivationReason}
                  </div>
                )}

                {/* Action Buttons - Will stay at bottom */}
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => handleEdit(place._id)}
                    className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaEdit />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(place._id)}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaTrash />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <FaHome className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Properties Yet</h3>
          <p className="text-gray-500 mb-6">Start by adding your first property</p>
          <Link
            to="/host/places/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all duration-200"
          >
            <FaPlus />
            Add Your First Property
          </Link>
        </div>
      )}

      {/* Load More Button */}
      {displayCount < filteredPlaces.length && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setDisplayCount((prev) => prev + 5)}
            className="px-6 py-3 bg-primary/5 text-primary rounded-xl hover:bg-primary/10 transition-all duration-200"
          >
            Load More Properties
          </button>
        </div>
      )}

      {/* Deactivation Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4">Hide Property</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for hiding this property:
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 border rounded-lg mb-4 h-32 focus:ring-2 focus:ring-primary/20"
              placeholder="Enter reason here..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowReasonModal(false);
                  setSelectedPlace(null);
                  setReason("");
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReasonSubmit}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HostPlaces;
