import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";

import SearchEle from "../SearchEle";
import FavoriteButton from "../components/FavoriteButton";

import {
  FaMapMarkerAlt,
  FaBed,
  FaBath,
  FaUsers,
  FaHome,
  FaBuilding,
  FaWarehouse,
  FaHotel,
  FaUmbrellaBeach,
  FaStar,
  FaHeart,
} from "react-icons/fa";

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState(
    searchParams.get("type") || "all"
  );
  const [sortBy, setSortBy] = useState("recommended");

  // Initialize pagination with default values
  const [pagination, setPagination] = useState({
    currentPage: parseInt(searchParams.get("page")) || 1,
    total: 0,
    pages: 0,
    limit: 12,
  });

  // Define propertyTypes array
  const propertyTypes = [
    { type: "all", label: "All", icon: FaHome },
    { type: "apartment", label: "Apartment", icon: FaBuilding },
    { type: "house", label: "House", icon: FaHome },
    { type: "villa", label: "Villa", icon: FaWarehouse },
    { type: "hotel", label: "Hotel", icon: FaHotel },
    { type: "resort", label: "Resort", icon: FaUmbrellaBeach },
  ];

  const sortOptions = [
    { value: "recommended", label: "Recommended" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
    { value: "rating", label: "Top Rated" },
  ];

  // Define handleTypeSelect function
  const handleTypeSelect = (type) => {
    setSelectedType(type);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("type", type);
    setSearchParams(newSearchParams);
  };

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        location: searchParams.get("location") || "",
        checkIn: searchParams.get("checkIn") || "",
        checkOut: searchParams.get("checkOut") || "",
        guests: searchParams.get("guests") || "",
        type: selectedType === "all" ? "" : selectedType,
        sort: sortBy,
        page: pagination.currentPage,
        limit: pagination.limit,
      };

      const response = await axios.get("/api/places/search", { params });

      if (response.data) {
        setResults(response.data.places);
        setPagination((prev) => ({
          ...prev,
          ...response.data.pagination,
        }));
      }
    } catch (error) {
      console.error("Search error:", error);
      setError(
        error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Failed to fetch search results"
      );
    } finally {
      setLoading(false);
    }
  }, [
    searchParams,
    selectedType,
    sortBy,
    pagination.currentPage,
    pagination.limit,
  ]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handlePageChange = (newPage) => {
    // Update URL params
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("page", newPage);
    setSearchParams(newSearchParams);

    // Update pagination state
    setPagination((prev) => ({
      ...prev,
      currentPage: newPage,
    }));

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Add this before the return statement
  const renderPagination = () => {
    if (pagination.pages <= 1) return null;

    return (
      <div className="flex justify-center items-center gap-2 mt-8">
        {/* Previous button */}
        <button
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={pagination.currentPage === 1}
          className={`px-4 py-2 rounded-lg ${
            pagination.currentPage === 1
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-white text-primary border border-primary hover:bg-primary hover:text-white transition-colors"
          }`}
        >
          Previous
        </button>

        {/* Page numbers */}
        <div className="flex gap-2">
          {[...Array(pagination.pages)].map((_, i) => {
            const pageNumber = i + 1;
            // Show first page, last page, current page, and pages around current page
            if (
              pageNumber === 1 ||
              pageNumber === pagination.pages ||
              (pageNumber >= pagination.currentPage - 1 &&
                pageNumber <= pagination.currentPage + 1)
            ) {
              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`w-10 h-10 rounded-lg ${
                    pagination.currentPage === pageNumber
                      ? "bg-primary text-white"
                      : "bg-white text-primary border border-primary hover:bg-primary hover:text-white"
                  } transition-colors`}
                >
                  {pageNumber}
                </button>
              );
            } else if (
              pageNumber === pagination.currentPage - 2 ||
              pageNumber === pagination.currentPage + 2
            ) {
              return (
                <span key={pageNumber} className="px-1">
                  ...
                </span>
              );
            }
            return null;
          })}
        </div>

        {/* Next button */}
        <button
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={pagination.currentPage === pagination.pages}
          className={`px-4 py-2 rounded-lg ${
            pagination.currentPage === pagination.pages
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-white text-primary border border-primary hover:bg-primary hover:text-white transition-colors"
          }`}
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Bar with Animation */}
      <div className="py-6 sticky top-0 z-10 bg-white shadow-md transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4">
          <SearchEle
            initialLocation={searchParams.get("location") || ""}
            initialDates={{
              checkIn: searchParams.get("checkIn") || "",
              checkOut: searchParams.get("checkOut") || "",
            }}
            initialGuests={Number(searchParams.get("guests")) || 1}
          />

          {/* Filters and Sort Section */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            {/* Property Type Filter with Horizontal Scroll */}
            <div className="flex-1 overflow-x-auto hide-scrollbar">
              <div className="flex items-center gap-3 pb-2">
                {propertyTypes.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => handleTypeSelect(type)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
                      selectedType === type
                        ? "bg-primary text-white shadow-lg"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="text-lg" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sort and Filter Buttons */}
            <div className="flex gap-2 shrink-0">
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 rounded-full bg-white border border-gray-200 hover:border-primary transition-colors appearance-none cursor-pointer"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section with Animations */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Loading State with Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="animate-pulse bg-white rounded-xl overflow-hidden"
              >
                <div className="h-48 bg-gray-200" />
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State with Animation */}
        {error && (
          <div className="text-center p-8 animate-fadeIn">
            <div className="bg-red-50 rounded-lg p-6 inline-block">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  window.location.reload();
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Results Header with Animation */}
        {!loading && !error && (
          <div className="mb-6 animate-fadeIn">
            <h1 className="text-2xl font-bold flex items-center gap-2 flex-wrap">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">
                {results.length} places found
              </span>
              {searchParams.get("location") && (
                <span className="flex items-center gap-2 text-gray-600 text-lg">
                  <FaMapMarkerAlt className="text-primary" />
                  {searchParams.get("location")}
                </span>
              )}
            </h1>
          </div>
        )}

        {/* Results Grid with Stagger Animation */}
        {!loading && !error && results.length > 0 && (
          <>
            <Link
              to={`/place/${results[0]._id}`}
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {results.map((place, index) => (
                <div
                  key={place._id}
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="animate-fadeIn h-full"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    opacity: 0,
                  }}
                >
                  <div className="h-full bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                    {/* Image Container with Fixed Aspect Ratio */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {place.photos?.[0] && (
                        <img
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                          src={place.photos[0]}
                          alt={place.title}
                          loading="lazy"
                        />
                      )}
                      {place.rating && (
                        <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                          <FaStar className="text-yellow-500" />
                          <span className="font-medium">{place.rating}</span>
                        </div>
                      )}
                      <FavoriteButton
                        placeId={place._id}
                        className="absolute max-w-9 top-3 left-3 p-2 rounded-full"
                      />
                    </div>

                    {/* Content Container */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">
                        {place.title}
                      </h3>
                      <p className="text-gray-500 text-sm mb-3 line-clamp-1">
                        {place.address}
                      </p>

                      {/* Details */}
                      <div className="flex gap-4 text-gray-500 text-sm mb-3">
                        <span className="flex items-center gap-1">
                          <FaUsers className="text-primary" />
                          <span>{place.max_guests} guests</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <FaBed className="text-primary" />
                          <span>{place.bedrooms} bed</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <FaBath className="text-primary" />
                          <span>{place.bathrooms} bath</span>
                        </span>
                      </div>

                      {/* Price */}
                      <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-100">
                        <div>
                          <span className="font-bold text-lg">
                            ${place.price}
                          </span>
                          <span className="text-gray-500 text-sm">
                            {" "}
                            / night
                          </span>
                        </div>
                        <div>
                          <button
                            className="text-primary hover:text-primary-dark transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              // Add to favorites or other action
                            }}
                          >
                            <FaHeart />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Link>
            {/* Add pagination */}
            {renderPagination()}
          </>
        )}

        {/* No Results State with Animation */}
        {!loading && !error && results.length === 0 && (
          <div className="text-center py-12 animate-fadeIn">
            <div className="bg-gray-50 rounded-lg p-8 inline-block">
              <h2 className="text-2xl font-semibold mb-4">No places found</h2>
              <p className="text-gray-500">
                Try adjusting your search criteria
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
