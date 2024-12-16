import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FaPlus, FaSpinner, FaTrash, FaEdit } from "react-icons/fa";

export default function VoucherListPage() {
  const [vouchers, setVouchers] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
                      <Link
                        to={`vouchers/edit/${voucher._id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <FaEdit className="mr-1" />
                        Edit
                      </Link>
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

