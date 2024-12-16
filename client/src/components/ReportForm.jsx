import { useState } from "react";
import axios from "axios";
import { FaFlag, FaTimes, FaExclamationCircle } from "react-icons/fa";
import PropTypes from "prop-types";

export default function ReportForm({ placeId, onClose }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "inappropriate_content",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState({
    title: false,
    description: false,
  });

  const reportTypes = [
    { value: "inappropriate_content", label: "Inappropriate Content" },
    { value: "spam", label: "Spam" },
    { value: "scam", label: "Scam" },
    { value: "abuse", label: "Abuse" },
    { value: "offensive_behavior", label: "Offensive Behavior" },
    { value: "other", label: "Other" },
  ];

  // Validation rules
  const validation = {
    title: {
      required: true,
      minLength: 5,
      maxLength: 100,
      validate: (value) => {
        if (!value.trim()) return "Title is required";
        if (value.length < 5) return "Title must be at least 5 characters";
        if (value.length > 100) return "Title must be less than 100 characters";
        return "";
      }
    },
    description: {
      required: true,
      minLength: 20,
      maxLength: 1000,
      validate: (value) => {
        if (!value.trim()) return "Description is required";
        if (value.length < 20) return "Description must be at least 20 characters";
        if (value.length > 1000) return "Description must be less than 1000 characters";
        return "";
      }
    }
  };

  const getFieldError = (field) => {
    if (!touched[field]) return "";
    return validation[field].validate(formData[field]);
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const isFormValid = () => {
    return !getFieldError('title') && !getFieldError('description');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Set all fields as touched to show validation errors
    setTouched({
      title: true,
      description: true,
    });

    if (!isFormValid()) {
      setError("Please fix the validation errors before submitting");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post("/api/reports", {
        ...formData,
        placeId,
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        alert("Report submitted successfully");
        onClose();
      } else {
        throw new Error(response.data.message || "Failed to submit report");
      }
    } catch (error) {
      console.error("Report submission error:", error);
      setError(
        error.response?.data?.error || 
        error.message || 
        "Failed to submit report. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute max-w-9 top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FaTimes size={24} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-50 rounded-lg">
            <FaFlag className="text-red-500" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Report Issue</h2>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
            <FaExclamationCircle />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Issue Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
            <label className="block text-gray-700 font-medium mb-2">
              Title
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              onBlur={() => handleBlur('title')}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                getFieldError('title') ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Brief description of the issue"
            />
            {getFieldError('title') && (
              <p className="mt-1 text-sm text-red-500">{getFieldError('title')}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.title.length}/100 characters
            </p>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Description
              <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              onBlur={() => handleBlur('description')}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent h-32 resize-none transition-all ${
                getFieldError('description') ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Please provide detailed information about the issue"
            />
            {getFieldError('description') && (
              <p className="mt-1 text-sm text-red-500">{getFieldError('description')}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/1000 characters
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className={`flex-1 px-4 py-3 rounded-lg text-white transition-all ${
                loading || !isFormValid()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

ReportForm.propTypes = {
  placeId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};
