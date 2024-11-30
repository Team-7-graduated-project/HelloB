import PropTypes from "prop-types";

export default function PlaceImg({ place, index = 0, className = null }) {
  if (!place.photos?.length) {
    return "";
  }

  if (!className) {
    className = "object-cover";
  }

  // Handle both full URLs and relative paths
  const imageUrl = place.photos[index].startsWith("http")
    ? place.photos[index] // If it's already a full URL
    : `http://localhost:3000/${place.photos[index]}`; // If it's a relative path

  return (
    <div>
      <img
        className={className}
        src={imageUrl}
        alt={place.title || "Place image"}
        loading="lazy"
      />
    </div>
  );
}

// Add PropTypes for validation
PlaceImg.propTypes = {
  place: PropTypes.shape({
    photos: PropTypes.arrayOf(PropTypes.string).isRequired,
    title: PropTypes.string,
  }).isRequired,
  index: PropTypes.number,
  className: PropTypes.string,
};
