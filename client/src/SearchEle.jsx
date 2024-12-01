import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import { FaSearch, FaBed, FaWalking, FaHome } from "react-icons/fa";
import PropTypes from "prop-types";

// Update TabButton to use default parameters

// Update SearchEle to use default parameters
export default function SearchEle({
  initialLocation = "",
  initialDates = { checkIn: "", checkOut: "" },
  initialGuests = 1,
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [searchParams, setSearchParams] = useState({
    location: initialLocation,
    checkIn: initialDates.checkIn,
    checkOut: initialDates.checkOut,
    guests: initialGuests,
    type: "all",
  });
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Handle search input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "location") {
      // Clear previous timeout
      if (searchTimeout) clearTimeout(searchTimeout);

      // Set new timeout
      const newTimeout = setTimeout(() => {
        handleLocationSearch(value);
      }, 300); // 300ms delay

      setSearchTimeout(newTimeout);
    }
  };

  // Handle location search
  const handleLocationSearch = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await axios.get(`/api/places/quick-search`, {
        params: {
          q: query,
          isActive: true, // Only fetch active places
        },
      });

      setSearchResults(response.data);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search submission
  const handleSearch = () => {
    // Validate and format parameters
    const params = {
      location: searchParams.location?.trim() || "",
      checkIn: searchParams.checkIn || "",
      checkOut: searchParams.checkOut || "",
      guests: searchParams.guests?.toString() || "1",
      type: activeTab,
    };

    // Build query string
    const queryString = new URLSearchParams(params).toString();

    // Navigate to search results
    navigate(`/search?${queryString}`);
  };

  return (
    <div className="relative w-full  mx-auto px-4">
      {/* Tabs */}
      <div className="flex justify-center items-center gap-4 mb-6">
        <TabButton
          active={activeTab === "all"}
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            setActiveTab("all");
          }}
          icon={<FaHome />}
          text="All"
        />
        <TabButton
          active={activeTab === "Accommodations"}
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            setActiveTab("Accommodations");
          }}
          icon={<FaBed />}
          text="Accommodations"
        />
        <TabButton
          active={activeTab === "Experience"}
          onClick={() => setActiveTab("Experience")}
          icon={<FaWalking />}
          text="Experience"
        />
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-full shadow-md hover:shadow-lg transition-all p-1.5 flex flex-col md:flex-row items-center gap-2 max-w-4xl mx-auto">
        {/* Location */}
        <div className="relative flex-1 min-w-[180px]">
          <div className="relative">
            <input
              type="text"
              name="location"
              value={searchParams.location}
              onChange={handleInputChange}
              placeholder="Where are you going?"
              className="w-full p-3 rounded-full bg-gray-50 focus:bg-white transition-all text-sm"
            />
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            )}
          </div>

          {/* Location Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
              {searchResults.map((result) => (
                <div
                  key={result._id}
                  className="p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    setSearchParams((prev) => ({
                      ...prev,
                      location: result.address,
                    }));
                    setSearchResults([]);
                  }}
                >
                  <div className="font-medium">{result.title}</div>
                  <div className="text-sm text-gray-500">{result.address}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dates */}
        {activeTab === "Accommodations" ? (
          <>
            <input
              type="date"
              name="checkIn"
              value={searchParams.checkIn}
              min={format(new Date(), "yyyy-MM-dd")}
              onChange={handleInputChange}
              className="p-3 rounded-full bg-gray-50 focus:bg-white transition-all text-sm w-auto"
            />
            <input
              type="date"
              name="checkOut"
              value={searchParams.checkOut}
              min={searchParams.checkIn || format(new Date(), "yyyy-MM-dd")}
              onChange={handleInputChange}
              className="p-3 rounded-full bg-gray-50 focus:bg-white transition-all text-sm w-auto"
            />
          </>
        ) : (
          <input
            type="date"
            name="day"
            value={searchParams.day}
            min={format(new Date(), "yyyy-MM-dd")}
            onChange={handleInputChange}
            className="p-3 rounded-full bg-gray-50 focus:bg-white transition-all text-sm w-auto"
          />
        )}

        {/* Guests */}
        <div className="relative">
          <button
            onClick={() => setShowGuestDropdown(!showGuestDropdown)}
            className="p-3 rounded-full bg-gray-50 hover:bg-white transition-all text-sm"
          >
            {searchParams.guests} Guest{searchParams.guests !== 1 ? "s" : ""}
          </button>

          {showGuestDropdown && (
            <div className="absolute top-full right-0 mt-2 bg-gray-300 rounded-lg shadow-xl z-50 p-4 min-w-[200px]">
              <div className="flex items-center justify-between gap-4">
                <span>Guests</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setSearchParams((prev) => ({
                        ...prev,
                        guests: Math.max(1, prev.guests - 1),
                      }))
                    }
                    className="p-2 rounded-full hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span>{searchParams.guests}</span>
                  <button
                    onClick={() =>
                      setSearchParams((prev) => ({
                        ...prev,
                        guests: prev.guests + 1,
                      }))
                    }
                    className="p-2 rounded-full hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="p-3 bg-primary max-w-16 text-white rounded-full hover:bg-primary-dark transition-all flex items-center gap-2 min-w-[90px]"
        >
          <FaSearch size={14} />
          <span className="hidden md:inline text-sm">Search</span>
        </button>
      </div>
    </div>
  );
}
function TabButton({ active = false, onClick, icon, text }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1 px-6 py-3 rounded-full transition-all w-36
        ${
          active
            ? "bg-primary text-white shadow-lg scale-105"
            : "bg-white text-gray-600 hover:bg-gray-50"
        }
      `}
    >
      {icon}
      <span className="text-sm truncate">{text}</span>
    </button>
  );
}

TabButton.propTypes = {
  active: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.element.isRequired,
  text: PropTypes.string.isRequired,
};

SearchEle.propTypes = {
  initialLocation: PropTypes.string,
  initialDates: PropTypes.shape({
    checkIn: PropTypes.string,
    checkOut: PropTypes.string,
  }),
  initialGuests: PropTypes.number,
  onSearch: PropTypes.func,
};
