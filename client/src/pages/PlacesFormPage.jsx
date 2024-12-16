import { useEffect, useState } from "react";
import PhotosUploader from "../PhotosUploader";
import Perks from "../Perks";
import axios from "axios";
import { Navigate, useParams, useNavigate } from "react-router-dom";

const validateForm = (data) => {
  const errors = {};

  if (!data.title?.trim()) {
    errors.title = "Title is required";
  }

  if (!data.address?.trim()) {
    errors.address = "Address is required";
  }

  if (!data.photos?.length) {
    errors.photos = "At least one photo is required";
  }

  if (!data.description?.trim()) {
    errors.description = "Description is required";
  }

  if (data.max_guests < 1) {
    errors.maxGuests = "Must accommodate at least 1 guest";
  }

  if (data.bedrooms < 1) {
    errors.bedrooms = "Must have at least 1 bedroom";
  }

  if (data.beds < 1) {
    errors.beds = "Must have at least 1 bed";
  }

  if (data.bathrooms < 1) {
    errors.bathrooms = "Must have at least 1 bathroom";
  }

  return errors;
};

export default function PlacesFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [addedPhotos, setAddedPhotos] = useState([]);
  const [description, setDescription] = useState("");
  const [perks, setPerks] = useState([]);
  const [extraInfo, setExtraInfo] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [maxGuests, setMaxGuests] = useState(1);
  const [price, setPrice] = useState(100);
  const [propertyType, setPropertyType] = useState("other");
  const [bedrooms, setBedrooms] = useState(1);
  const [beds, setBeds] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [status, setStatus] = useState("active");
  const [houseRules, setHouseRules] = useState([]);
  const [cancellationPolicy, setCancellationPolicy] = useState("moderate");
  const [minimumStay, setMinimumStay] = useState(1);
  const [location, setLocation] = useState({ coordinates: [0, 0] });
  const [amenitiesDescription, setAmenitiesDescription] = useState({});

  const [redirect, setRedirect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const propertyTypes = [
    "house",
    "apartment",
    "guesthouse",
    "hotel",
    "villa",
    "cottage",
    "bungalow",
    "cabin",
    "resort",
    "other",
  ];

  const cancellationPolicies = ["flexible", "moderate", "strict"];

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/places/${id}`);
        const data = response.data;
        setTitle(data.title || "");
        setAddress(data.address || "");
        setAddedPhotos(data.photos || []);
        setDescription(data.description || "");
        setPerks(data.perks || []);
        setExtraInfo(data.extra_info || "");
        setCheckIn(data.check_in || "");
        setCheckOut(data.check_out || "");
        setMaxGuests(data.max_guests || 1);
        setPrice(data.price || 100);
        setPropertyType(data.property_type || "other");
        setBedrooms(data.bedrooms || 1);
        setBeds(data.beds || 1);
        setBathrooms(data.bathrooms || 1);
        setStatus(data.status || "active");
        setHouseRules(data.house_rules || []);
        setCancellationPolicy(data.cancellation_policy || "moderate");
        setMinimumStay(data.minimum_stay || 1);
        setLocation(data.location || { coordinates: [0, 0] });
        setAmenitiesDescription(data.amenities_description || {});
      } catch (error) {
        console.error("Failed to fetch place data:", error);
        setError("Failed to load place data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const savePlace = async (ev) => {
    ev.preventDefault();

    const placeData = {
      title,
      address,
      photos: addedPhotos,
      description,
      perks,
      extra_info: extraInfo,
      check_in: checkIn,
      check_out: checkOut,
      price: Number(price),
      max_guests: Number(maxGuests),
      property_type: propertyType,
      bedrooms: Number(bedrooms),
      beds: Number(beds),
      bathrooms: Number(bathrooms),
      status,
      house_rules: houseRules,
      cancellation_policy: cancellationPolicy,
      minimum_stay: Number(minimumStay),
      location,
      amenities_description: amenitiesDescription,
    };

    // Validate form
    const errors = validateForm(placeData);
    setFormErrors(errors);

    // If there are errors, don't submit
    if (Object.keys(errors).length > 0) {
      const firstErrorField = document.querySelector('[data-error="true"]');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (id) {
        await axios.put(`/host/places/${id}`, placeData);
      } else {
        await axios.post("/host/places", placeData);
      }
      setRedirect(true);
    } catch (error) {
      console.error("Failed to save place:", error);
      setError(error.response?.data?.message || "Failed to save the place.");
    } finally {
      setLoading(false);
    }
  };

  if (redirect) {
    return <Navigate to="/host/places" />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center max-w-24 font-bold text-white bg-blue-600 py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-5 h-5 mr-2"
        >
          <path
            fillRule="evenodd"
            d="M15.293 6.707a1 1 0 0 1 0 1.414L10.414 12H16a1 1 0 1 1 0 2H9a1 1 0 0 1-.707-.293L3.707 9.707a1 1 0 0 1 0-1.414L8.586 3H3a1 1 0 0 1 0-2h7a1 1 0 0 1 .707.293l5.586 5.586z"
            clipRule="evenodd"
          />
        </svg>
        Back
      </button>

      <form onSubmit={savePlace} className="space-y-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm  font-medium text-gray-700">
                Property Type
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="mt-1 block max-w-40 w-full rounded-md border-gray-300 shadow-sm"
              >
                {propertyTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                type="text"
                placeholder="My lovely apartment"
                className={`mt-1 block w-full rounded-md shadow-sm
                  ${formErrors.title ? "border-red-500" : "border-gray-300"}`}
                data-error={!!formErrors.title}
              />
              {formErrors.title && (
                <p className="mt-1 text-sm text-red-500">{formErrors.title}</p>
              )}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Location</h2>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            type="text"
            placeholder="Address"
            className={`mt-1 block w-full rounded-md shadow-sm
              ${formErrors.address ? "border-red-500" : "border-gray-300"}`}
            data-error={!!formErrors.address}
          />
          {formErrors.address && (
            <p className="mt-1 text-sm text-red-500">{formErrors.address}</p>
          )}
        </div>

        {/* Photos */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Photos</h2>
          <PhotosUploader addedPhotos={addedPhotos} onChange={setAddedPhotos} />
          {formErrors.photos && (
            <p className="mt-1 text-sm text-red-500">{formErrors.photos}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Description</h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm
              ${formErrors.description ? "border-red-500" : "border-gray-300"}`}
            data-error={!!formErrors.description}
            rows={5}
          />
          {formErrors.description && (
            <p className="mt-1 text-sm text-red-500">
              {formErrors.description}
            </p>
          )}
        </div>

        {/* Perks and Amenities */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Perks and Amenities</h2>
          <Perks selected={perks} onChange={setPerks} />
        </div>

        {/* Property Details */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Property Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Bedrooms
              </label>
              <input
                type="number"
                value={bedrooms}
                onChange={(e) => setBedrooms(Number(e.target.value))}
                min="1"
                className={`mt-1 block w-full rounded-md shadow-sm
                  ${
                    formErrors.bedrooms ? "border-red-500" : "border-gray-300"
                  }`}
                data-error={!!formErrors.bedrooms}
              />
              {formErrors.bedrooms && (
                <p className="mt-1 text-sm text-red-500">
                  {formErrors.bedrooms}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Beds
              </label>
              <input
                type="number"
                value={beds}
                onChange={(e) => setBeds(Number(e.target.value))}
                min="1"
                className={`mt-1 block w-full rounded-md shadow-sm
                  ${formErrors.beds ? "border-red-500" : "border-gray-300"}`}
                data-error={!!formErrors.beds}
              />
              {formErrors.beds && (
                <p className="mt-1 text-sm text-red-500">{formErrors.beds}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Bathrooms
              </label>
              <input
                type="number"
                value={bathrooms}
                onChange={(e) => setBathrooms(Number(e.target.value))}
                min="1"
                className={`mt-1 block w-full rounded-md shadow-sm
                  ${
                    formErrors.bathrooms ? "border-red-500" : "border-gray-300"
                  }`}
                data-error={!!formErrors.bathrooms}
              />
              {formErrors.bathrooms && (
                <p className="mt-1 text-sm text-red-500">
                  {formErrors.bathrooms}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Max Guests
              </label>
              <input
                type="number"
                value={maxGuests}
                onChange={(e) => setMaxGuests(Number(e.target.value))}
                min="1"
                className={`mt-1 block w-full rounded-md shadow-sm
                  ${
                    formErrors.maxGuests ? "border-red-500" : "border-gray-300"
                  }`}
                data-error={!!formErrors.maxGuests}
              />
              {formErrors.maxGuests && (
                <p className="mt-1 text-sm text-red-500">
                  {formErrors.maxGuests}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Booking Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Check In Time
              </label>
              <input
                type="time"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className={`mt-1 block w-full rounded-md shadow-sm
                  ${formErrors.checkIn ? "border-red-500" : "border-gray-300"}`}
                data-error={!!formErrors.checkIn}
              />
              {formErrors.checkIn && (
                <p className="mt-1 text-sm text-red-500">
                  {formErrors.checkIn}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Check Out Time
              </label>
              <input
                type="time"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className={`mt-1 block w-full rounded-md shadow-sm
                  ${
                    formErrors.checkOut ? "border-red-500" : "border-gray-300"
                  }`}
                data-error={!!formErrors.checkOut}
              />
              {formErrors.checkOut && (
                <p className="mt-1 text-sm text-red-500">
                  {formErrors.checkOut}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Minimum Stay (nights)
              </label>
              <input
                type="number"
                value={minimumStay}
                onChange={(e) => setMinimumStay(Number(e.target.value))}
                min="1"
                className={`mt-1 block w-full rounded-md shadow-sm
                  ${
                    formErrors.minimumStay
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                data-error={!!formErrors.minimumStay}
              />
              {formErrors.minimumStay && (
                <p className="mt-1 text-sm text-red-500">
                  {formErrors.minimumStay}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Price per night
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min="0"
                className={`mt-1 block w-full rounded-md shadow-sm
                  ${formErrors.price ? "border-red-500" : "border-gray-300"}`}
                data-error={!!formErrors.price}
              />
              {formErrors.price && (
                <p className="mt-1 text-sm text-red-500">{formErrors.price}</p>
              )}
            </div>
          </div>
        </div>

        {/* Policies */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Policies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cancellation Policy
              </label>
              <select
                value={cancellationPolicy}
                onChange={(e) => setCancellationPolicy(e.target.value)}
                className="mt-1 block max-w-40 w-full rounded-md border-gray-300 shadow-sm"
              >
                {cancellationPolicies.map((policy) => (
                  <option key={policy} value={policy}>
                    {policy.charAt(0).toUpperCase() + policy.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block max-w-40 w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Additional Information</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              House Rules
            </label>
            <textarea
              value={houseRules.join("\n")}
              onChange={(e) =>
                setHouseRules(
                  e.target.value.split("\n").filter((rule) => rule.trim())
                )
              }
              placeholder="Enter each rule on a new line"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Extra Information
            </label>
            <textarea
              value={extraInfo}
              onChange={(e) => setExtraInfo(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              rows={4}
            />
          </div>
        </div>

        <button
          type="submit"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          disabled={loading}
          className={`w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            </div>
          ) : (
            "Save Place"
          )}
        </button>
      </form>
    </div>
  );
}
