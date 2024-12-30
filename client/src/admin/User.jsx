import { useEffect, useState } from "react";
import axios from "axios";
import StatusToggle from "./StatusToggle";
import { FaSearch, FaSpinner, FaUser, FaEdit } from "react-icons/fa";
const maskPassword = (password) => {
  if (!password) return "";
  if (password.length <= 8) return "••••••";
  return password.slice(0, 2) + "••••" + password.slice(-2);
};

function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [visibleUsers, setVisibleUsers] = useState(10); // Initial visible limit
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    axios
      .get("/admin/users")
      .then((response) => {
        setUsers(response.data);
        setFilteredUsers(response.data); // Initially, no filtering
      })
      .catch(() => {
        alert("Failed to load users");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim() === "") {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(
        users.filter(
          (user) =>
            user.name.toLowerCase().includes(value.toLowerCase()) ||
            user.email.toLowerCase().includes(value.toLowerCase())
        )
      );
    }
    setVisibleUsers(10); // Reset visible users when searching
  };

  const handleWatchMore = () => {
    setVisibleUsers((prevVisible) => prevVisible + 10);
  };

  const handleEdit = async (user) => {
    try {
      const response = await axios.put(`/admin/users/${user._id}`, {
        name: user.name,
        email: user.email,
        phone: user.phone,
      });

      const updatedUsers = users.map((u) =>
        u._id === user._id ? response.data : u
      );
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
      setEditingUser(null);
    } catch {
      alert("Failed to update user");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 text-white">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">User Management</h1>
              <p className="text-white/80">Manage and monitor user accounts</p>
            </div>
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search users..."
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
            {/* User List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        User Info
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
                    {filteredUsers.slice(0, visibleUsers).map((user) => (
                      <tr
                        key={user._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <FaUser className="text-primary" />
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">
                                {user.name}
                              </span>
                              <span className="text-sm text-gray-500">
                                {user.email}
                              </span>
                              {user.phone && (
                                <span className="text-xs text-gray-400">
                                  {user.phone}
                                </span>
                              )}
                              {user.password && (
                                <span className="text-xs text-gray-400">
                                  {maskPassword(user.password)}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusToggle
                            user={user}
                            onStatusChange={(id, newStatus, reason) => {
                              const updatedUsers = users.map((u) =>
                                u._id === id
                                  ? { ...u, isActive: newStatus, reason }
                                  : u
                              );
                              setUsers(updatedUsers);
                              setFilteredUsers(updatedUsers);
                            }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingUser(user)}
                              className="inline-flex max-w-20 items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <FaEdit className="mr-1.5" />
                              Edit
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
            {visibleUsers < filteredUsers.length && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={handleWatchMore}
                  className="bg-black max-w-40 text-white px-6 py-2 rounded-lg   transition-colors  flex items-center gap-2"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}

        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-lg font-bold mb-4">Edit User</h3>
              <input
                type="text"
                value={editingUser.name}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, name: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="email"
                value={editingUser.email}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, email: e.target.value })
                }
                className="w-full p-2 border rounded mb-4"
              />
              <input
                type="tel"
                value={editingUser.phone || ""}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, phone: e.target.value })
                }
                className="w-full p-2 border rounded mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 font-bold text-white  bg-red-700 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEdit(editingUser)}
                  className="px-4 py-2 bg-yellow-500 font-bold text-white rounded"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageUsersPage;
