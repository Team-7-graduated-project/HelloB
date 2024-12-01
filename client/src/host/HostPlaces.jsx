import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FaPlus } from "react-icons/fa";

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
    if (window.confirm("Are you sure you want to delete this place?")) {
      try {
        setLoading(true);
        await axios.delete(`/places/${id}`, {
          withCredentials: true,
        });

        setPlaces((prevPlaces) =>
          prevPlaces.filter((place) => place._id !== id)
        );
        alert("Place deleted successfully");
      } catch (error) {
        console.error("Error deleting place:", error);
        if (error.response?.status === 403) {
          alert("You are not authorized to delete this place");
        } else {
          alert(
            error.response?.data?.error ||
              "Error deleting place, please try again later."
          );
        }
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

  const updatePlaceStatus = async (
    placeId,
    isActive,
    deactivationReason = ""
  ) => {
    try {
      const response = await axios.put(`/host/places/${placeId}/status`, {
        isActive,
        reason: deactivationReason,
      });

      setPlaces(
        places.map((place) =>
          place._id === placeId
            ? {
                ...place,
                isActive: response.data.isActive,
                deactivationReason: response.data.deactivationReason,
              }
            : place
        )
      );

      setShowReasonModal(false);
      setSelectedPlace(null);
      setReason("");
    } catch (error) {
      console.error("Error updating place status:", error);
      alert(error.response?.data?.error || "Failed to update place status");
    }
  };

  const handleReasonSubmit = () => {
    if (!reason.trim()) {
      alert("Please provide a reason");
      return;
    }
    if (selectedPlace) {
      updatePlaceStatus(selectedPlace._id, false, reason);
    }
  };

  const filteredPlaces = places.filter((place) =>
    place.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Your Places</h3>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search places..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" /* ... */
            />
          </div>
          <Link
            to="/host/places/new"
            className="inline-flex gap-2 items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <FaPlus />
            Add Place
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-lg text-red-700">{error}</div>
      ) : places.length > 0 ? (
        <>
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Place Title
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Guests
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPlaces.slice(0, displayCount).map((place) => (
                  <tr
                    key={place._id}
                    className="border-b last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-6 py-3 text-sm">{place.title}</td>
                    <td className="px-6 py-3 text-sm">{place.address}</td>
                    <td className="px-6 py-3 text-sm">{place.price}$</td>
                    <td className="px-6 py-3 text-sm">{place.max_guests}</td>
                    <td className="px-6 py-3 text-sm">
                      <button
                        onClick={() => handleStatusToggle(place)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          place.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {place.isActive ? "Active" : "Hidden"}
                      </button>
                      {!place.isActive && place.deactivationReason && (
                        <div className="text-xs text-gray-500 mt-1">
                          Reason: {place.deactivationReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3 flex gap-1">
                      <button
                        onClick={() => handleEdit(place._id)}
                        className="max-w-16 rounded-xl bg-yellow-500 text-white px-4 py-1 mr-2 hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(place._id)}
                        className=" max-w-20 rounded-xl bg-red-500 text-white px-4 py-1 hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {displayCount < filteredPlaces.length && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setDisplayCount((prev) => prev + 5)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                Load More Places
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No places</h3>
          <p className="mt-1 text-sm text-gray-500">
            No places have been added yet.
          </p>
        </div>
      )}

      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">Hide Place</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for hiding this place:
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border rounded mb-4 h-32"
              placeholder="Enter reason here..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowReasonModal(false);
                  setSelectedPlace(null);
                  setReason("");
                }}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleReasonSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
