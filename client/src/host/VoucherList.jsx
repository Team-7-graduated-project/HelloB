import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaTimes, FaPlus, FaEdit, FaTrash, FaSpinner, FaTicketAlt } from "react-icons/fa";

export default function VoucherListPage() {
  const [vouchers, setVouchers] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingVoucher, setEditingVoucher] = useState(null);

  // Update fetchVouchers function
  const fetchVouchers = async () => {
    try {
      const response = await axios.get("/host/vouchers", {
        withCredentials: true,
      });
      // Sort vouchers by expiration date (oldest first)
      const sortedVouchers = response.data.sort((a, b) => 
        new Date(b.expirationDate) - new Date(a.expirationDate)
      );
      setVouchers(sortedVouchers);
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

        // Sort vouchers by expiration date (oldest first)
        const sortedVouchers = vouchersRes.data.sort((a, b) => 
          new Date(b.expirationDate) - new Date(a.expirationDate)
        );

        setVouchers(sortedVouchers);
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

  const isExpired = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(date) < today;
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
              onChange={(e) => {
                const value = Math.max(
                  0,
                  Math.min(100, Number(e.target.value))
                );
                setEditingVoucher({
                  ...editingVoucher,
                  discount: value,
                });
              }}
              onKeyDown={(e) => {
                if (e.key === "-" || e.key === "e") {
                  e.preventDefault();
                }
              }}
              className="w-20 p-1 border rounded"
              min="0"
              max="100"
              step="1"
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
      {/* Enhanced Header Section */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 mb-8 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Voucher Management</h1>
            <p className="text-white/80">
              Create and manage discount vouchers for your properties
            </p>
          </div>
          <Link
            to="/host/vouchers/new"
            className="bg-white text-primary px-6 py-3 rounded-xl hover:bg-gray-50 
                     transition-all duration-200 flex items-center gap-2 shadow-lg hover:scale-105"
          >
            <FaPlus />
            Create Voucher
          </Link>
        </div>
      </div>

      {/* Enhanced Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code & Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiration
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Places
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vouchers.map((voucher) => (
                <tr key={voucher._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{voucher.code}</span>
                      <span className={`text-sm ${
                        isExpired(voucher.expirationDate) 
                          ? 'text-red-600'
                          : voucher.active 
                            ? 'text-green-600' 
                            : 'text-red-600'
                      }`}>
                        {isExpired(voucher.expirationDate) 
                          ? 'Expired'
                          : voucher.active 
                            ? 'Active' 
                            : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      isExpired(voucher.expirationDate)
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {voucher.discount}% OFF
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 max-w-xs truncate">
                      {voucher.description}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${
                      isExpired(voucher.expirationDate)
                        ? 'text-red-600 font-medium'
                        : 'text-gray-600'
                    }`}>
                      {new Date(voucher.expirationDate).toLocaleDateString()}
                      {isExpired(voucher.expirationDate) && (
                        <span className="block text-xs text-red-500">Expired</span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {voucher.applicablePlaces?.map((place) => (
                        <span
                          key={place._id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
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
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {!isExpired(voucher.expirationDate) && (
                        <button
                          onClick={() => handleEdit(voucher)}
                          className="inline-flex items-center px-3 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                        >
                          <FaEdit className="mr-1" />
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(voucher._id)}
                        className="inline-flex items-center px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <FaTrash className="mr-1" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {vouchers.length === 0 && !loading && (
          <div className="text-center py-12">
            <FaTicketAlt className="mx-auto text-gray-300 text-5xl mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Vouchers Found</h3>
            <p className="text-gray-500 mb-6">Start by creating your first voucher</p>
            <Link
              to="/host/vouchers/new"
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <FaPlus className="mr-2" />
              Create Voucher
            </Link>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <FaSpinner className="animate-spin text-primary text-3xl" />
          </div>
        )}
      </div>
    </div>
  );
}

