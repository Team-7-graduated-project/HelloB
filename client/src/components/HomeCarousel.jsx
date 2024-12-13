
import { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight, FaStar } from "react-icons/fa";
import PropTypes from "prop-types";

export default function HomeCarousel({ places }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const nextSlide = () => {
    if (!isAnimating && places.length > 0) {
      setIsAnimating(true);
      setCurrentSlide((prev) => (prev + 1) % places.length);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const prevSlide = () => {
    if (!isAnimating && places.length > 0) {
      setIsAnimating(true);
      setCurrentSlide((prev) => (prev - 1 + places.length) % places.length);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [places]);

  if (!places || places.length === 0) return null;

  return (
    <div className="relative h-[80vh] overflow-hidden rounded-t-3xl shadow-2xl">
      {/* Slides */}
      {places.map((place, index) => (
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
          {/* Image */}
          <img
            src={place.photos[0]}
            alt={place.title}
            className="w-full h-full object-cover"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Content */}
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
                <div className="text-right">
                  <div className="text-2xl font-bold">${place.price}</div>
                  <div className="text-sm opacity-75">per night</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Buttons - Repositioned and restyled */}
      <div className="absolute bottom-8 w-full px-4 flex justify-between items-center z-20">
        <button
          onClick={prevSlide}
          className="max-w-12 bg-black/30 hover:bg-black/50 text-white rounded-full p-3 backdrop-blur-sm transition-all transform hover:scale-110"
        >
          <FaChevronLeft size={20} />
        </button>

        {/* Progress Indicators - Moved between buttons */}
        <div className="flex gap-2">
          {places.map((_, index) => (
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

      {/* Content Gradient */}
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
