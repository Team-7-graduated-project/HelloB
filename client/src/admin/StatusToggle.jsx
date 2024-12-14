import { useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { FaCheck, FaSpinner, FaTimes } from "react-icons/fa";

export default function StatusToggle({ user, onStatusChange }) {
  const [isActive, setIsActive] = useState(user.isActive);
  const [reason, setReason] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (isActive) {
      // If deactivating, show modal for reason
      setShowModal(true);
    } else {
      // If activating, proceed directly with null reason
      await updateStatus(true, null);
    }
  };

  const updateStatus = async (newStatus, deactivationReason = null) => {
    try {
      setLoading(true);
      const response = await axios.put(`/api/admin/users/${user._id}/status`, {
        isActive: newStatus,
        reason: newStatus ? "" : deactivationReason,
      });

      if (response.data.success) {
        setIsActive(newStatus);
        if (onStatusChange) {
          onStatusChange(
            user._id,
            newStatus,
            newStatus ? "" : response.data.reason
          );
        }
        setShowModal(false);
        setReason(""); // Clear reason after update
      } else {
        throw new Error(response.data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert(
        error.response?.data?.error ||
          error.message ||
          "Failed to update user status"
      );
      // Revert the toggle state if the update failed
      setIsActive(user.isActive);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`px-4 py-2 max-w-32 rounded-lg text-white transition-all duration-300 flex items-center gap-2 ${
          isActive
            ? "bg-green-500 hover:bg-green-600"
            : "bg-red-500 hover:bg-red-600"
        } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {loading ? (
          <FaSpinner className="animate-spin" />
        ) : isActive ? (
          <>
            <FaCheck className="text-sm" />
            Active
          </>
        ) : (
          <>
            <FaTimes className="text-sm" />
            Inactive
          </>
        )}
      </button>

      {/* Deactivation Reason Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-xl font-semibold mb-4">Deactivation Reason</h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for deactivation..."
              className="w-full p-3 border border-gray-200 rounded-lg mb-4 min-h-[120px] focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setReason("");
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => updateStatus(false, reason)}
                disabled={!reason.trim() || loading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? <FaSpinner className="animate-spin" /> : <FaTimes />}
                {loading ? "Processing..." : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

StatusToggle.propTypes = {
  user: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    isActive: PropTypes.bool.isRequired,
  }).isRequired,
  onStatusChange: PropTypes.func,
};
