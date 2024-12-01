import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaPlus, FaSpinner, FaBullhorn } from "react-icons/fa";
import { format } from "date-fns";

function HostAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canCreateAnnouncement, setCanCreateAnnouncement] = useState(false);
  const [nextAnnouncementDate, setNextAnnouncementDate] = useState(null);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await axios.get("/api/host/announcements");
      setAnnouncements(response.data.announcements || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setError("Failed to fetch announcements");
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAnnouncementAvailability = useCallback(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const currentDate = today.getDate();

    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + (7 - today.getDay()));

    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const canCreate = currentDay === 0 || currentDate === 1;
    setCanCreateAnnouncement(canCreate);
    setNextAnnouncementDate(currentDay === 0 ? nextMonth : nextSunday);
  }, []);

  useEffect(() => {
    checkAnnouncementAvailability();
  }, [checkAnnouncementAvailability]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);
  const handleCreateAnnouncement = () => {
    setLoading;
  };

  return (
    <div className="p-6">
      {canCreateAnnouncement && (
        <button
          onClick={handleCreateAnnouncement}
          className="mb-4 max-w-32 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <FaPlus className="mr-2" /> Create Announcement
        </button>
      )}

      {!canCreateAnnouncement && nextAnnouncementDate && (
        <div className="mb-4 text-md text-red-600 font-bold ">
          Next announcement can be created on:{" "}
          {nextAnnouncementDate.toLocaleDateString()}
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-2xl font-bold mb-4">Your Announcements</h3>
        {loading ? (
          <div className="text-center py-8">
            <FaSpinner className="animate-spin text-4xl text-primary mx-auto" />
            <p className="text-gray-600 mt-2">Loading announcements...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg text-red-700">{error}</div>
        ) : !announcements || announcements.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FaBullhorn className="text-4xl text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No announcements yet</p>
            {canCreateAnnouncement ? (
              <button className="mt-4 text-primary hover:text-primary-dark font-medium">
                Create your first announcement
              </button>
            ) : (
              <p className="mt-4 text-sm text-gray-500">
                You can create your first announcement on{" "}
                {nextAnnouncementDate &&
                  format(nextAnnouncementDate, "MMMM d, yyyy")}
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {announcements.map((announcement) => (
              <div
                key={announcement._id}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-semibold mb-2">
                      {announcement.title}
                    </h4>
                    <p className="text-gray-600">{announcement.content}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {format(new Date(announcement.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HostAnnouncements;
