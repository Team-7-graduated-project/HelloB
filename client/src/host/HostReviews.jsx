import { useEffect, useState } from "react";
import axios from "axios";
import { FaStar, FaHome, FaComments, FaSpinner } from "react-icons/fa";

function HostReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayCount, setDisplayCount] = useState(5);
  const [sortBy, setSortBy] = useState("recent"); // 'recent' or 'rating'

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get("/host/reviews");
        setReviews(response.data);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setError("Error loading reviews, please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Enhanced Header Section */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 mb-8 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Customer Reviews</h1>
            <p className="text-white/80">
              Monitor and manage guest feedback for your properties
            </p>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white/50 text-black border-white/20 rounded-xl px-4 py-2 focus:ring-2 focus:ring-white/20"
          >
            <option value="recent">Most Recent</option>
            <option value="rating">Highest Rating</option>
          </select>
        </div>
      </div>

      {/* Reviews Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <FaSpinner className="animate-spin text-primary text-3xl" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
        </div>
      ) : sortedReviews.length > 0 ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedReviews.slice(0, displayCount).map((review) => (
              <div
                key={review._id}
                className="bg-gray-200 rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                      {review.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold text-gray-900">{review.user.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center bg-yellow-100 px-3 py-1 rounded-full">
                    <FaStar className="text-yellow-400 mr-1" />
                    <span className="font-medium text-yellow-700">{review.rating}</span>
                  </div>
                </div>
                <p className="text-gray-600 mb-3">{review.review_text}</p>
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-500 flex items-center">
                    <FaHome className="mr-2 text-gray-400" />
                    {review.place.title}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {displayCount < sortedReviews.length && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setDisplayCount((prev) => prev + 6)}
                className="px-6 py-3 bg-primary/5 text-primary rounded-xl hover:bg-primary/10 transition-all duration-200"
              >
                Load More Reviews
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <FaComments className="mx-auto text-gray-300 text-5xl mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
          <p className="text-gray-500">
            Reviews will appear here when guests leave feedback
          </p>
        </div>
      )}
    </div>
  );
}

export default HostReviews;
