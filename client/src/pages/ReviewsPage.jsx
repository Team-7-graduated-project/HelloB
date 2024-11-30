import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaStar, FaArrowLeft, FaUser, FaClock } from "react-icons/fa";

export default function ReviewsPage() {
  const { id } = useParams();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [place, setPlace] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reviewsRes, placeRes] = await Promise.all([
          axios.get(`/places/${id}/reviews`),
          axios.get(`/places/${id}`),
        ]);
        setReviews(reviewsRes.data);
        setPlace(placeRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const averageRating = reviews.length
    ? (
        reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
      ).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with Back Button and Title */}
      <div className="mb-8">
        <button
          onClick={() => {
            navigate(-1);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center text-primary hover:text-primary-dark transition-colors mb-6"
        >
          <FaArrowLeft className="mr-2" />
          Back to Property
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {place?.title || "Property Reviews"}
        </h1>

        {/* Rating Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center text-3xl font-bold text-primary">
              <FaStar className="text-yellow-400 mr-2 text-4xl" />
              {averageRating}
            </div>
            <div className="border-l pl-4">
              <div className="text-gray-600">
                {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <div className="text-gray-500 mb-4">No reviews yet</div>
          <button
            onClick={() => navigate(`/place/${id}`)}
            className="text-primary hover:text-primary-dark transition-colors"
          >
            Be the first to review
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {review.user.photo ? (
                    <img
                      src={review.user.photo}
                      alt={review.user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <FaUser className="text-gray-500 text-xl" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {review.user.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FaClock className="text-gray-400" />
                      {new Date(review.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center bg-primary/10 px-3 py-1 rounded-full">
                  <FaStar className="text-primary mr-1" />
                  <span className="font-medium text-primary">
                    {review.rating.toFixed(1)}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {review.review_text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
