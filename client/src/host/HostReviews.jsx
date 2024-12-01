import { useEffect, useState } from "react";
import axios from "axios";

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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Customer Reviews</h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="recent">Most Recent</option>
          <option value="rating">Highest Rating</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-lg text-red-700">{error}</div>
      ) : sortedReviews.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedReviews.slice(0, displayCount).map((review) => (
              <div
                key={review._id}
                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      {review.user.name.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold">{review.user.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-yellow-400">★</span>
                    <span className="ml-1">{review.rating}</span>
                  </div>
                </div>
                <p className="text-gray-600">{review.review_text}</p>
                <p className="mt-2 text-sm text-gray-500">
                  Place: {review.place.title}
                </p>
              </div>
            ))}
          </div>

          {displayCount < sortedReviews.length && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setDisplayCount((prev) => prev + 6)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                Load More Reviews
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" /* ... */ />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No reviews yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Reviews will appear here when customers leave them.
          </p>
        </div>
      )}
    </div>
  );
}

export default HostReviews;
