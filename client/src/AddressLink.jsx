import PropTypes from "prop-types"; // Import PropTypes

export default function AddressLink({ children, className = null }) {
  if (!className) {
    className = "my-3 block";
  }
  // Adding responsive classes for different screen sizes
  className +=
    " flex gap-1 font-semibold underline text-sm sm:text-base lg:text-lg";

  return (
    <a
      className={className}
      target="_blank"
      rel="noopener noreferrer" // It's a good practice to add this
      href={"https://maps.google.com/?q=" + encodeURIComponent(children)} // Encode children for URL
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" // Responsive icon size
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
        />
      </svg>

      {children}
    </a>
  );
}

// Add PropTypes for validation
AddressLink.propTypes = {
  children: PropTypes.node.isRequired, // children can be any renderable content
  className: PropTypes.string, // className is optional
};
