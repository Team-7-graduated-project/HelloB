import { useState } from "react";
import axios from "axios";
import { FaFlag, FaTimes } from "react-icons/fa";
import PropTypes from "prop-types";

export default function ReportForm({ placeId, onClose }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "inappropriate_content",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reportTypes = [
    { value: "inappropriate_content", label: "Inappropriate Content" },
    { value: "spam", label: "Spam" },
    { value: "scam", label: "Scam" },
    { value: "offensive_behavior", label: "Offensive Behavior" },
    { value: "other", label: "Other" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await axios.post("/api/reports", {
        ...formData,
        placeId,
      });

      alert("Report submitted successfully");
      onClose();
    } catch (error) {
      setError(error.response?.data?.error || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute max-w-8  top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <FaTimes size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FaFlag className="text-red-500" />
          Report Issue
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Issue Type</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary"
              required
            >
              {reportTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary"
              placeholder="Brief description of the issue"
              required
              minLength={5}
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary h-32"
              placeholder="Please provide detailed information about the issue"
              required
              minLength={20}
              maxLength={1000}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </form>
      </div>
    </div>
  );
}

ReportForm.propTypes = {
  placeId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};
