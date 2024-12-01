import PropTypes from "prop-types";

export default function Perks({ selected, onChange }) {
  function handleCbClick(ev) {
    const { checked, name } = ev.target;
    if (checked) {
      onChange([...selected, name]);
    } else {
      onChange([...selected.filter((selectedName) => selectedName !== name)]);
    }
  }

  const perks = [
    { name: "wifi", label: "WiFi", icon: "📶" },
    { name: "tv", label: "TV", icon: "📺" },
    { name: "kitchen", label: "Kitchen", icon: "🍳" },
    { name: "air-conditioning", label: "Air Conditioning", icon: "❄️" },
    { name: "heating", label: "Heating", icon: "🔥" },
    { name: "washer", label: "Washer", icon: "🧺" },
    { name: "dryer", label: "Dryer", icon: "👕" },
    { name: "free parking spot", label: "Free Parking", icon: "🅿️" },
    { name: "pool", label: "Pool", icon: "🏊‍♂️" },
    { name: "gym", label: "Gym", icon: "💪" },
    { name: "hot-tub", label: "Hot Tub", icon: "🛀" },
    { name: "pets", label: "Pets Allowed", icon: "🐾" },
    { name: "entrance", label: "Private Entrance", icon: "🚪" },
    { name: "security-cameras", label: "Security Cameras", icon: "📷" },
    { name: "workspace", label: "Workspace", icon: "💻" },
    { name: "breakfast", label: "Breakfast", icon: "🍳" },
    { name: "fireplace", label: "Fireplace", icon: "🔥" },
    { name: "balcony", label: "Balcony", icon: "🏠" },
    { name: "garden", label: "Garden View", icon: "🌳" },
    { name: "beach-access", label: "Beach Access", icon: "🏖️" },
    { name: "smoking", label: "Smoking Allowed", icon: "🚬" },
    { name: "first-aid", label: "First Aid Kit", icon: "🏥" },
    { name: "fire-extinguisher", label: "Fire Extinguisher", icon: "🧯" },
    { name: "elevator", label: "Elevator", icon: "🛗" },
  ];

  return (
    <div>
      <div className="grid mt-2 gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {perks.map((perk) => (
          <label
            key={perk.name}
            className="border p-4 flex rounded-2xl gap-2 items-center cursor-pointer hover:border-primary transition-all"
          >
            <input
              type="checkbox"
              checked={selected.includes(perk.name)}
              name={perk.name}
              onChange={handleCbClick}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="flex items-center gap-1">
              <span className="text-xl">{perk.icon}</span>
              <span className="text-sm">{perk.label}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

Perks.propTypes = {
  selected: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
};
