import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { FaStar, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useState } from "react";

export default function PlaceCard({ place, details }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === place.photos.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === 0 ? place.photos.length - 1 : prev - 1
    );
  };

  return (
    <Link
      to={`/place/${place._id}`}
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className="block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
    >
      {/* Image Carousel */}
      <div className="relative aspect-video">
        {place.photos?.length > 0 && (
          <>
            <img
              className="object-cover w-full h-full transition-opacity duration-300"
              src={place.photos[currentImageIndex]}
              alt={`${place.title} - Image ${currentImageIndex + 1}`}
              loading="lazy"
            />
            {place.photos.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white p-2 rounded-full shadow-md transition-all"
                >
                  <FaChevronLeft className="text-gray-800" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white p-2 rounded-full shadow-md transition-all"
                >
                  <FaChevronRight className="text-gray-800" />
                </button>
                {/* Image Indicators */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {place.photos.map((_, index) => (
                    <div
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        index === currentImageIndex
                          ? "bg-white w-3"
                          : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
        {place.rating && (
          <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
            <FaStar className="text-yellow-500" />
            <span>{place.rating}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          {place.title}
        </h3>
        <p className="text-gray-500 text-sm mb-2">{place.address}</p>

        {/* Description Preview */}
        {place.description && (
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
            {place.description}
          </p>
        )}

        {/* Price */}
        <div className="flex justify-between items-center">
          <div>
            <span className="font-bold text-lg">${place.price}</span>
            <span className="text-gray-500"> / night</span>
          </div>
        </div>

        {/* Additional Details */}
        {details && <div>{details}</div>}
      </div>
    </Link>
  );
}

PlaceCard.propTypes = {
  place: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    description: PropTypes.string,
    photos: PropTypes.arrayOf(PropTypes.string),
    price: PropTypes.number.isRequired,
    rating: PropTypes.string,
  }).isRequired,
  details: PropTypes.node,
};
