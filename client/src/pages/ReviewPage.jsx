import { useState, useContext } from "react";
import PropTypes from "prop-types";
import { UserContext } from "../UserContext";
import { useParams } from "react-router-dom";
import axios from "axios";
import { FaStar } from "react-icons/fa";

// Add validation rules at the top
const validationRules = {
  rating: {
    required: true,
    min: 1,
    max: 5,
    message: {
      required: "Please select a rating",
      range: "Rating must be between 1 and 5 stars",
    },
  },
  reviewText: {
    required: true,
    minLength: 10,
    maxLength: 500,
    message: {
      required: "Review text is required",
      minLength: "Review must be at least 10 characters",
      maxLength: "Review cannot exceed 500 characters",
    },
  },
};

export default function ReviewPage({
  rating,
  setRating,
  placeId: propPlaceId,
}) {
  const [localRating, setLocalRating] = useState(0);
  const { id: routeId } = useParams();
  const [hoverRating, setHoverRating] = useState(0);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useContext(UserContext);
  const [formErrors, setFormErrors] = useState({});

  const currentRating = rating ?? localRating;
  const handleRatingChange = setRating ?? setLocalRating;
  const effectivePlaceId = propPlaceId ?? routeId;

  // Add validation function
  const validateReview = () => {
    const errors = {};

    // Rating validation
    if (!currentRating) {
      errors.rating = validationRules.rating.message.required;
    } else if (currentRating < 1 || currentRating > 5) {
      errors.rating = validationRules.rating.message.range;
    }

    // Review text validation
    if (!reviewText.trim()) {
      errors.reviewText = validationRules.reviewText.message.required;
    } else if (reviewText.length < validationRules.reviewText.minLength) {
      errors.reviewText = validationRules.reviewText.message.minLength;
    } else if (reviewText.length > validationRules.reviewText.maxLength) {
      errors.reviewText = validationRules.reviewText.message.maxLength;
    }

    return errors;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();

    if (!user) {
      alert("Please log in to submit a review.");
      return;
    }

    const errors = validateReview();
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        "/reviews",
        {
          placeId: effectivePlaceId,
          rating: currentRating,
          reviewText,
        },
        {
          withCredentials: true,
        }
      );

      if (response.status === 201) {
        setReviewText("");
        setIsFormVisible(false);
        handleRatingChange(0);
        alert("Review submitted successfully!");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      setFormErrors({ submit: "Failed to submit review. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button
        onClick={() => setIsFormVisible(!isFormVisible)}
        className="w-full bg-primary text-white py-3 px-6 rounded-xl font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
      >
        <FaStar className={isFormVisible ? "text-yellow-400" : ""} />
        {isFormVisible ? "Cancel Review" : "Write a Review"}
      </button>

      {isFormVisible && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 bg-white rounded-xl p-6 shadow-lg"
        >
          {formErrors.rating && (
            <div className="text-red-500 text-sm mb-2">{formErrors.rating}</div>
          )}

          <div className="flex justify-center mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-1 transition-transform hover:scale-110"
                onClick={() => handleRatingChange(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                <FaStar
                  className={`w-8 h-8 ${
                    star <= (hoverRating || currentRating)
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="relative">
            <textarea
              placeholder="Share your experience..."
              className={`w-full p-4 border rounded-lg transition-all ${
                formErrors.reviewText
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-200 focus:ring-primary"
              }`}
              rows="4"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              required
            />
            {formErrors.reviewText && (
              <div className="text-red-500 text-sm mt-1">
                {formErrors.reviewText}
              </div>
            )}
            <div className="text-gray-400 text-sm mt-1">
              {reviewText.length}/{validationRules.reviewText.maxLength}{" "}
              characters
            </div>
          </div>

          {formErrors.submit && (
            <div className="text-red-500 text-sm mt-2">{formErrors.submit}</div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`w-full mt-4 py-3 px-6 rounded-lg font-medium transition-all ${
              isSubmitting
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary-dark"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      )}
    </div>
  );
}

ReviewPage.propTypes = {
  rating: PropTypes.number,
  setRating: PropTypes.func,
  placeId: PropTypes.string,
};
