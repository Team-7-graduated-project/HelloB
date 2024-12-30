import { useState, useEffect, useCallback } from "react";
import { FaChevronLeft, FaChevronRight, FaStar } from "react-icons/fa";
import PropTypes from "prop-types";

export default function HomeCarousel({ places }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [randomizedPlaces, setRandomizedPlaces] = useState([]);

  // Function to shuffle array using Fisher-Yates algorithm
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Initialize and update randomized places every 24 hours
  useEffect(() => {
    const initializeRandomPlaces = () => {
      const lastShuffleTime = localStorage.getItem("lastShuffleTime");
      const savedRandomPlaces = localStorage.getItem("randomizedPlaces");

      const now = new Date().getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      if (
        !savedRandomPlaces ||
        !places.length ||
        now - parseInt(lastShuffleTime) > twentyFourHours
      ) {
        // Shuffle places and save to localStorage
        const shuffled = shuffleArray(places);
        localStorage.setItem("randomizedPlaces", JSON.stringify(shuffled));
        localStorage.setItem("lastShuffleTime", now.toString());
        setRandomizedPlaces(shuffled);
      } else {
        try {
          const parsedPlaces = JSON.parse(savedRandomPlaces);
          setRandomizedPlaces(parsedPlaces);
        } catch (error) {
          console.error(
            "Error parsing randomizedPlaces from localStorage",
            error
          );
        }
      }
    };

    if (places.length > 0) {
      initializeRandomPlaces();
    }
  }, [places]);

  // Memoize nextSlide function to prevent re-creating on every render
  const nextSlide = useCallback(() => {
    if (!isAnimating && randomizedPlaces.length > 0) {
      setIsAnimating(true);
      setCurrentSlide((prev) => (prev + 1) % randomizedPlaces.length);
      setTimeout(() => setIsAnimating(false), 500);
    }
  }, [isAnimating, randomizedPlaces]);

  const prevSlide = () => {
    if (!isAnimating && randomizedPlaces.length > 0) {
      setIsAnimating(true);
      setCurrentSlide(
        (prev) => (prev - 1 + randomizedPlaces.length) % randomizedPlaces.length
      );
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]); // Dependency on the memoized nextSlide function

  if (!randomizedPlaces || randomizedPlaces.length === 0) return null;

  return (
    <div className="relative h-[80vh] overflow-hidden rounded-t-3xl shadow-2xl">
      {/* Slides */}
      {randomizedPlaces.map((place, index) => (
        <div
          key={place._id}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            currentSlide === index
              ? "opacity-100 translate-x-0"
              : index > currentSlide
              ? "opacity-0 translate-x-full"
              : "opacity-0 -translate-x-full"
          }`}
        >
          <img
            src={place.photos[0]}
            alt={place.title}
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-start justify-between">
                <div className="max-w-2xl">
                  <h2 className="text-3xl md:text-4xl font-bold mb-3 animate-fadeIn">
                    {place.title}
                  </h2>
                  <p className="text-lg md:text-xl mb-4 opacity-90 line-clamp-2 animate-fadeInDelay">
                    {place.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm animate-fadeInUp">
                    <span className="flex items-center gap-1">
                      <FaStar className="text-yellow-400" />
                      {place.rating || "New"}
                    </span>
                    <span>•</span>
                    <span>{place.address}</span>
                  </div>
                </div>
                <div className="text-right flex ">
                  <div className="text-2xl font-bold">${place.price}</div>
                  <div className="text-xl ">/</div>
                  <div className="text-xl opacity-75"> per night</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Buttons */}
      <div className="absolute bottom-8 w-full px-4 flex justify-between items-center z-20">
        <button
          onClick={prevSlide}
          className="max-w-12 bg-black/30 hover:bg-black/50 text-white rounded-full p-3 backdrop-blur-sm transition-all transform hover:scale-110"
        >
          <FaChevronLeft size={20} />
        </button>

        <div className="flex gap-2">
          {randomizedPlaces.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1 rounded-full transition-all duration-300 ${
                currentSlide === index ? "w-8 bg-white" : "w-4 bg-white/50"
              }`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          className="max-w-12 bg-black/30 hover:bg-black/50 text-white rounded-full p-3 backdrop-blur-sm transition-all transform hover:scale-110"
        >
          <FaChevronRight size={20} />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
    </div>
  );
}

HomeCarousel.propTypes = {
  places: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      photos: PropTypes.arrayOf(PropTypes.string).isRequired,
      price: PropTypes.number.isRequired,
      rating: PropTypes.number,
      address: PropTypes.string.isRequired,
    })
  ).isRequired,
};
