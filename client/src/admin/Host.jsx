import { useEffect, useState } from "react";
import axios from "axios";
import StatusToggle from "./StatusToggle";
import { FaSearch, FaSpinner, FaUserTie, FaEdit } from "react-icons/fa";
const maskPassword = (password) => {
  if (!password) return '';
  if (password.length <= 8) return '••••••';
  return password.slice(0, 2) + '••••' + password.slice(-2);
};

function ManageHostsPage() {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredHosts, setFilteredHosts] = useState([]);
  const [visibleHosts, setVisibleHosts] = useState(10);
  const [editingHost, setEditingHost] = useState(null);

  useEffect(() => {
    fetchHosts();
  }, []);

  const fetchHosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/hosts-with-properties", {
        withCredentials: true,
      });
      setHosts(response.data);
      setFilteredHosts(response.data);
    } catch (error) {
      console.error("Failed to load hosts:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert("You are not authorized to view this page");
      } else {
        alert(
          "Failed to load hosts: " +
            (error.response?.data?.error || error.message)
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim() === "") {
      setFilteredHosts(hosts);
    } else {
      setFilteredHosts(
        hosts.filter(
          (host) =>
            host.name.toLowerCase().includes(value.toLowerCase()) ||
            host.email.toLowerCase().includes(value.toLowerCase())
        )
      );
    }
    setVisibleHosts(10);
  };

  const confirmDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this host?")) {
      setDeletingId(id);
      axios
        .delete(`/admin/hosts/${id}`)
        .then(() => {
          setHosts((prev) => prev.filter((host) => host._id !== id));
          setFilteredHosts((prev) => prev.filter((host) => host._id !== id));
          alert("Host deleted successfully");
        })
        .catch((error) => {
          console.error("Failed to delete host:", error);
          alert("Failed to delete host");
        })
        .finally(() => {
          setDeletingId(null);
        });
    }
  };

  const handleEdit = async (host) => {
    try {
      const response = await axios.put(`/admin/hosts/${host._id}`, {
        name: host.name,
        email: host.email,
        phone: host.phone,
        // Add other fields as needed
      });

      const updatedHosts = hosts.map((h) =>
        h._id === host._id ? response.data : h
      );
      setHosts(updatedHosts);
      setFilteredHosts(updatedHosts);
      setEditingHost(null);
    } catch {
      alert("Failed to update host");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Host Management</h1>
                <p className="text-white/80">Manage and monitor host accounts</p>
              </div>
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search hosts..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
                <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600" />
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <FaSpinner className="animate-spin text-primary text-3xl" />
            </div>
          ) : (
            <>
              {/* Hosts Table */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Host Info
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Properties
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Total Revenue
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredHosts.slice(0, visibleHosts).map((host) => (
                        <tr key={host._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <FaUserTie className="text-primary" /> 
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{host.name}</span>
                                <span className="text-sm text-gray-500">{host.email}</span>
                                {host.phone && (
                                  <span className="text-xs text-gray-400">{host.phone}</span>
                                )}
                                {host.password && (
                                  <span className="text-xs text-gray-400">{maskPassword(host.password)}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {host.properties?.length || 0} properties
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-gray-900">
                                ${Number(host.totalPayments).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </span>
                              {host.totalBookings > 0 && (
                                <div className="text-xs text-gray-500">
                                  {host.totalBookings} bookings · Avg: ${host.averageBookingValue}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusToggle
                              user={host}
                              onStatusChange={(id, newStatus, reason) => {
                                const updatedHosts = hosts.map((h) =>
                                  h._id === id ? { ...h, isActive: newStatus, reason } : h
                                );
                                setHosts(updatedHosts);
                                setFilteredHosts(updatedHosts);
                              }}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setEditingHost(host)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <FaEdit className="mr-1.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => confirmDelete(host._id)}
                                disabled={deletingId === host._id}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                {deletingId === host._id ? (
                                  <>
                                    <FaSpinner className="animate-spin mr-1.5" />
                                    Deleting...
                                  </>
                                ) : (
                                  "Delete"
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Load More Button */}
              {visibleHosts < filteredHosts.length && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setVisibleHosts((prev) => prev + 10)}
            className="bg-black max-w-40 text-white px-6 py-2 rounded-lg   transition-colors  flex items-center gap-2"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {editingHost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">Edit Host</h3>
            <input
              type="text"
              value={editingHost.name}
              onChange={(e) =>
                setEditingHost({ ...editingHost, name: e.target.value })
              }
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="email"
              value={editingHost.email}
              onChange={(e) =>
                setEditingHost({ ...editingHost, email: e.target.value })
              }
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="tel"
              value={editingHost.phone || ""}
              onChange={(e) =>
                setEditingHost({ ...editingHost, phone: e.target.value })
              }
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingHost(null)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEdit(editingHost)}
                className="px-4 py-2 bg-primary text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageHostsPage;
