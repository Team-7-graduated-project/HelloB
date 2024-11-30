import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import { FaCheck, FaArchive, FaComment } from "react-icons/fa";

export default function ManageAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [adminComment, setAdminComment] = useState("");

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/announcements", {
        withCredentials: true,
      });
      setAnnouncements(response.data);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.put(
        `/api/admin/announcements/${id}/status`,
        {
          status,
          adminComment,
        },
        {
          withCredentials: true,
        }
      );
      fetchAnnouncements();
      setSelectedAnnouncement(null);
      setAdminComment("");
    } catch (error) {
      console.error("Error updating announcement:", error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Host Announcements</h2>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      ) : (
        <div className="grid gap-6">
          {announcements.map((announcement) => (
            <div
              key={announcement._id}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">
                    {announcement.host.name}&apos;s {announcement.type} Report
                  </h3>
                  <p className="text-gray-600">
                    Period:{" "}
                    {format(
                      new Date(announcement.period.startDate),
                      "MMM d, yyyy"
                    )}{" "}
                    -
                    {format(
                      new Date(announcement.period.endDate),
                      "MMM d, yyyy"
                    )}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    announcement.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : announcement.status === "reviewed"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {announcement.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-xl font-semibold">
                    {announcement.metrics.totalBookings}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-xl font-semibold">
                    ${announcement.metrics.totalRevenue}
                  </p>
                </div>
              </div>

              {announcement.status === "pending" && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setSelectedAnnouncement(announcement)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    <FaComment /> Add Comment
                  </button>
                  <button
                    onClick={() =>
                      handleStatusUpdate(announcement._id, "reviewed")
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    <FaCheck /> Mark as Reviewed
                  </button>
                  <button
                    onClick={() =>
                      handleStatusUpdate(announcement._id, "archived")
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    <FaArchive /> Archive
                  </button>
                </div>
              )}

              {announcement.adminComment && (
                <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium">Admin Comment:</p>
                  <p className="text-gray-600">{announcement.adminComment}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Comment Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add Comment</h3>
            <textarea
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              className="w-full p-2 border rounded-lg mb-4"
              rows="4"
              placeholder="Enter your comment..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleStatusUpdate(selectedAnnouncement._id, "reviewed")
                }
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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
