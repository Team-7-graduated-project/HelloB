import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaTimes } from "react-icons/fa";

export default function VoucherListPage() {
  const [vouchers, setVouchers] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingVoucher, setEditingVoucher] = useState(null);

  // Add fetchVouchers function
  const fetchVouchers = async () => {
    try {
      const response = await axios.get("/host/vouchers", {
        withCredentials: true,
      });
      setVouchers(response.data);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      setError("Failed to fetch vouchers");
    }
  };

  // Fetch vouchers and places from the backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vouchersRes, placesRes] = await Promise.all([
          axios.get("/host/vouchers"),
          axios.get("/host/places"),
        ]);

     

        setVouchers(vouchersRes.data);
        setPlaces(placesRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Error loading data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle edit click - navigate to the edit page
  const handleEdit = (voucher) => {
    setEditingVoucher(voucher);
  };

  const handleSaveEdit = async (voucherId) => {
    try {
      const updatedVoucher = {
        code: editingVoucher.code,
        discount: editingVoucher.discount,
        description: editingVoucher.description,
        expirationDate: editingVoucher.expirationDate,
        active: editingVoucher.active,
        applicablePlaces: editingVoucher.applicablePlaces,
      };

      await axios.put(`/host/vouchers/${voucherId}`, updatedVoucher, {
        withCredentials: true,
      });
      setEditingVoucher(null);
      await fetchVouchers();
    } catch (error) {
      console.error("Error updating voucher:", error);
      setError("Failed to update voucher.");
    }
  };

  const handleCancelEdit = () => {
    setEditingVoucher(null);
  };

  // Handle delete click
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this voucher?")) {
      try {
        await axios.delete(`/host/vouchers/${id}`, {
          withCredentials: true,
        });
        setVouchers((prevVouchers) =>
          prevVouchers.filter((voucher) => voucher._id !== id)
        );
      } catch (error) {
        console.error("Error deleting voucher:", error);
        setError("Error deleting voucher.");
      }
    }
  };

  const renderTableRow = (voucher) => {
    if (editingVoucher && editingVoucher._id === voucher._id) {
      return (
        <tr key={voucher._id} className="bg-blue-50">
          <td className="px-6 py-4 whitespace-nowrap">
            <input
              type="text"
              value={editingVoucher.code}
              onChange={(e) =>
                setEditingVoucher({
                  ...editingVoucher,
                  code: e.target.value.toUpperCase(),
                })
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <input
              type="number"
              value={editingVoucher.discount}
              onChange={(e) =>
                setEditingVoucher({
                  ...editingVoucher,
                  discount: e.target.value,
                })
              }
              className="w-20 p-1 border rounded"
              min="0"
              max="100"
            />
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <input
              type="text"
              value={editingVoucher.description}
              onChange={(e) =>
                setEditingVoucher({
                  ...editingVoucher,
                  description: e.target.value,
                })
              }
              className="w-full p-1 border rounded"
            />
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <input
              type="date"
              value={
                new Date(editingVoucher.expirationDate)
                  .toISOString()
                  .split("T")[0]
              }
              onChange={(e) =>
                setEditingVoucher({
                  ...editingVoucher,
                  expirationDate: e.target.value,
                })
              }
              className="w-full p-1 border rounded"
            />
          </td>
          <td className="px-6 py-4">
            <div className="space-y-2">
              {/* Selected places */}
              <div className="flex flex-wrap gap-1">
                {editingVoucher.applicablePlaces?.map((placeId) => {
                  const place = places.find((p) => p._id === placeId);
                  return place ? (
                    <span
                      key={placeId}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                    >
                      {place.title}
                      <button
                        type="button"
                        onClick={() =>
                          setEditingVoucher({
                            ...editingVoucher,
                            applicablePlaces:
                              editingVoucher.applicablePlaces.filter(
                                (id) => id !== placeId
                              ),
                          })
                        }
                        className="ml-1 max-w-10 text-blue-600 hover:text-blue-800"
                      >
                        <FaTimes size={15} />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>

              {/* Place selection dropdown */}
              <select
                className="w-full p-1 border rounded text-sm"
                onChange={(e) => {
                  const placeId = e.target.value;
                  if (
                    placeId &&
                    !editingVoucher.applicablePlaces?.includes(placeId)
                  ) {
                    setEditingVoucher({
                      ...editingVoucher,
                      applicablePlaces: [
                        ...(editingVoucher.applicablePlaces || []),
                        placeId,
                      ],
                    });
                  }
                }}
                value=""
              >
                <option value="">Add a place...</option>
                {places.map(
                  (place) =>
                    !editingVoucher.applicablePlaces?.includes(place._id) && (
                      <option key={place._id} value={place._id}>
                        {place.title}
                      </option>
                    )
                )}
              </select>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div className="flex space-x-2">
              <button
                onClick={() => handleSaveEdit(voucher._id)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr key={voucher._id} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md">
            {voucher.code}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <span className="font-medium text-green-600">
            {voucher.discount}%
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
          {voucher.description}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {new Date(voucher.expirationDate).toLocaleDateString()}
        </td>
        <td className="px-6 py-4 text-sm text-gray-500">
          <div className="flex flex-wrap gap-1">
            {voucher.applicablePlaces?.map((place) => (
              <span
                key={place._id}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                title={place.title}
              >
                {place.title?.length > 20
                  ? place.title.substring(0, 20) + "..."
                  : place.title || "Unnamed Place"}
              </span>
            ))}
            {(!voucher.applicablePlaces ||
              voucher.applicablePlaces.length === 0) && (
              <span className="text-gray-400 italic text-xs">All places</span>
            )}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex space-x-2">
            <button
              onClick={() => handleEdit(voucher)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(voucher._id)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h3 className="text-3xl font-bold text-gray-900">
            Voucher Management
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage your discount vouchers and promotional offers
          </p>
        </div>
        <Link
          to="/host/vouchers/new"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-5 h-5 mr-2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Voucher
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : vouchers.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Voucher Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Places
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vouchers.map((voucher) => renderTableRow(voucher))}
              </tbody>
            </table>
          </div>
        </div>
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No vouchers
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new voucher.
          </p>
          <div className="mt-6">
            <Link
              to="/host/vouchers/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Create Voucher
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
