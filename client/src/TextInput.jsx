import PropTypes from "prop-types";

export function TextInput({
  type = "text",
  placeholder = "",
  value,
  onChange,
  required,
  ...typeProps
}) {
  return (
    <input
      className="w-full p-2 border border-gray-300 rounded mb-3"
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      {...typeProps}
    />
  );
}

// Define PropTypes for the component
TextInput.propTypes = {
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
};
