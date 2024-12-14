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
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Host Info
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Properties
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Revenue
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredHosts.slice(0, visibleHosts).map((host) => (
                        <tr key={host._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">
                                {host.name}
                              </span>
                              <span className="text-sm text-gray-500">
                                {host.email}
                              </span>
                              {host.phone && (
                                <span className="text-sm text-gray-500">
                                  {host.phone}
                                </span>
                              )}
                              {host.password && (
                                <span className="text-sm text-gray-500">
                                  {maskPassword(host.password)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {host.properties?.length || 0}
                              </span>
                              <span className="text-sm text-gray-500">
                                {host.properties?.length === 1
                                  ? "property"
                                  : "properties"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-gray-900">
                              ${host.totalPayments?.toLocaleString() || "0"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <StatusToggle
                              user={host}
                              onStatusChange={(id, newStatus, reason) => {
                                const updatedHosts = hosts.map((h) =>
                                  h._id === id
                                    ? { ...h, isActive: newStatus, reason }
                                    : h
                                );
                                setHosts(updatedHosts);
                                setFilteredHosts(updatedHosts);
                              }}
                            />
                          </td>
                          <td className="px-6 py-4 space-x-2">
                            <button
                              onClick={() => setEditingHost(host)}
                              className="bg-blue-500 max-w-16 text-white px-2 py-2 rounded-md hover:bg-blue-600 mr-2"
                            >
                              <div className="flex items-center gap-2">
                                <FaEdit />
                                Edit
                              </div>
                            </button>
                            <button
                              onClick={() => confirmDelete(host._id)}
                              className="bg-red-500 text-white max-w-16 px-2 py-2 rounded-md hover:bg-red-600"
                              disabled={deletingId === host._id}
                            >
                              {deletingId === host._id ? (
                                <>
                                  <FaSpinner className="animate-spin" />
                                  <span>Deleting...</span>
                                </>
                              ) : (
                                "Delete"
                              )}
                            </button>
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
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
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
