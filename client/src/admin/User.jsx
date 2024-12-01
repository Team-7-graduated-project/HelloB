import { useEffect, useState } from "react";
import axios from "axios";
import StatusToggle from "./StatusToggle";
import { FaSearch, FaSpinner, FaUser, FaEdit } from "react-icons/fa";

function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
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

  const deleteUser = (id) => {
    setDeletingId(id);
    axios
      .delete(`/admin/users/${id}`)
      .then(() => {
        alert("User deleted successfully");
        fetchUsers(); // Reload user list
      })
      .catch(() => {
        alert("Failed to delete user");
      })
      .finally(() => {
        setDeletingId(null);
      });
  };

  const confirmDelete = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );
    if (confirmDelete) {
      deleteUser(id);
    }
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
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FaUser className="text-primary" />
        Manage Users
      </h2>

      {/* Search Bar */}
      <div className="relative flex items-center gap-2 mb-6">
        <FaSearch className="" />
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full p-3 pl-10  border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <FaSpinner className="animate-spin text-primary text-3xl" />
        </div>
      ) : (
        <>
          {/* User List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.slice(0, visibleUsers).map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {user.name}
                          </span>
                          <span className="text-sm text-gray-500">
                            {user.email}
                          </span>
                          {user.phone && (
                            <span className="text-sm text-gray-500">
                              {user.phone}
                            </span>
                          )}
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
                      <td className="px-6 py-4 space-x-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="bg-blue-500 max-w-16 text-white px-2 py-2 rounded-md hover:bg-blue-600 mr-2"
                        >
                          <div className="flex items-center gap-2">
                            <FaEdit />
                            Edit
                          </div>
                        </button>
                        <button
                          onClick={() => confirmDelete(user._id)}
                          className="bg-red-500 text-white max-w-16 px-2 py-2 rounded-md hover:bg-red-600"
                          disabled={deletingId === user._id}
                        >
                          {deletingId === user._id ? (
                            <span className="flex items-center gap-2">
                              <FaSpinner className="animate-spin" />
                              Deleting...
                            </span>
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
          {visibleUsers < filteredUsers.length && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleWatchMore}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
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
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEdit(editingUser)}
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

export default ManageUsersPage;
