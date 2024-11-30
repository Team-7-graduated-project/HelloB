import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { FaStar } from "react-icons/fa";

export default function PlaceCard({ place, details }) {
  return (
    <Link
      to={`/place/${place._id}`}
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className="block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
    >
      {/* Image */}
      <div className="relative aspect-video">
        {place.photos?.[0] && (
          <img
            className="object-cover w-full h-full"
            src={place.photos[0]}
            alt={place.title}
            loading="lazy"
          />
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
    photos: PropTypes.arrayOf(PropTypes.string),
    price: PropTypes.number.isRequired,
    rating: PropTypes.string,
  }).isRequired,
  details: PropTypes.node,
};
