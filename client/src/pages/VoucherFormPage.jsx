import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { CheckIcon } from "@heroicons/react/24/outline";
import { FaTimes } from "react-icons/fa";

const validationRules = {
  code: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: /^[A-Z0-9-_]+$/,
    message: {
      required: "Voucher code is required",
      minLength: "Code must be at least 3 characters",
      maxLength: "Code cannot exceed 20 characters",
      pattern:
        "Code can only contain uppercase letters, numbers, hyphens and underscores",
    },
  },
  discount: {
    required: true,
    min: 0,
    max: 100,
    message: {
      required: "Discount percentage is required",
      range: "Discount must be between 0 and 100",
    },
  },
  description: {
    required: true,
    minLength: 10,
    message: {
      required: "Description is required",
      minLength: "Description must be at least 10 characters",
    },
  },
  places: {
    required: true,
    minLength: 1,
    message: {
      required: "Please select at least one place",
    },
  },
  expirationDate: {
    required: true,
    future: true,
    message: {
      required: "Expiration date is required",
      future: "Expiration date must be in the future",
    },
  },
  usageLimit: {
    required: true,
    min: 1,
    message: {
      required: "Usage limit is required",
      min: "Usage limit must be at least 1",
    },
  },
};

export default function VoucherFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [description, setDescription] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [usageLimit, setUsageLimit] = useState(1);
  const [places, setPlaces] = useState([]);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchPlace, setSearchPlace] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const response = await axios.get("/host/places");
        setPlaces(response.data);
      } catch (error) {
        console.error("Error fetching places:", error);
        setError("Failed to load places");
      }
    };
    fetchPlaces();
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchVoucherData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/host/vouchers/${id}`, {
          withCredentials: true,
        });
        const data = response.data;
        setCode(data.code || "");
        setDiscount(data.discount || "");
        setDescription(data.description || "");
        setUsageLimit(data.usageLimit || 1);
        setSelectedPlaces(data.applicablePlaces || []);
        if (data.expirationDate) {
          setExpirationDate(
            new Date(data.expirationDate).toISOString().split("T")[0]
          );
        }
      } catch {
        setError("Failed to load voucher data");
      } finally {
        setLoading(false);
      }
    };

    fetchVoucherData();
  }, [id]);

  const validateForm = () => {
    const errors = {};

    // Code validation
    if (!code.trim()) {
      errors.code = validationRules.code.message.required;
    } else if (code.length < validationRules.code.minLength) {
      errors.code = validationRules.code.message.minLength;
    } else if (code.length > validationRules.code.maxLength) {
      errors.code = validationRules.code.message.maxLength;
    } else if (!validationRules.code.pattern.test(code)) {
      errors.code = validationRules.code.message.pattern;
    }

    // Discount validation
    const discountNum = Number(discount);
    if (!discount) {
      errors.discount = validationRules.discount.message.required;
    } else if (isNaN(discountNum) || discountNum < 0 || discountNum > 100) {
      errors.discount = validationRules.discount.message.range;
    }

    // Description validation
    if (!description.trim()) {
      errors.description = validationRules.description.message.required;
    } else if (description.length < validationRules.description.minLength) {
      errors.description = validationRules.description.message.minLength;
    }

    // Places validation
    if (selectedPlaces.length === 0) {
      errors.places = validationRules.places.message.required;
    }

    // Expiration date validation
    if (!expirationDate) {
      errors.expirationDate = validationRules.expirationDate.message.required;
    } else {
      const today = new Date();
      const expDate = new Date(expirationDate);
      if (expDate < today) {
        errors.expirationDate = validationRules.expirationDate.message.future;
      }
    }

    // Usage limit validation
    if (!usageLimit) {
      errors.usageLimit = validationRules.usageLimit.message.required;
    } else if (Number(usageLimit) < validationRules.usageLimit.min) {
      errors.usageLimit = validationRules.usageLimit.message.min;
    }

    return errors;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errors = validateField(field);
    setFormErrors((prev) => ({ ...prev, ...errors }));
  };

  const validateField = (field) => {
    const errors = {};

    switch (field) {
      case "code":
        if (!code.trim()) {
          errors.code = validationRules.code.message.required;
        } else if (code.length < validationRules.code.minLength) {
          errors.code = validationRules.code.message.minLength;
        } else if (!validationRules.code.pattern.test(code)) {
          errors.code = validationRules.code.message.pattern;
        }
        break;
      // Add other field validations...
    }

    return errors;
  };

  const saveVoucher = async (ev) => {
    ev.preventDefault();

    // Touch all fields to show validation
    const allFields = [
      "code",
      "discount",
      "description",
      "places",
      "expirationDate",
      "usageLimit",
    ];
    setTouched(
      allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {})
    );

    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstError = document.querySelector('[data-error="true"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // Define voucherData here
    const voucherData = {
      code: code.toUpperCase().trim(),
      discount: Number(discount),
      description: description.trim(),
      expirationDate: new Date(expirationDate).toISOString(),
      usageLimit: Number(usageLimit),
      applicablePlaces: selectedPlaces,
    };

    setLoading(true);
    try {
      if (id) {
        await axios.put(`/host/vouchers/${id}`, voucherData);
      } else {
        await axios.post("/host/vouchers", voucherData);
      }
      navigate("/host/vouchers");
    } catch (error) {
      setError(error.response?.data?.error || "Failed to save voucher");
    } finally {
      setLoading(false);
    }
  };

  const filteredPlaces = places.filter((place) =>
    place.title.toLowerCase().includes(searchPlace.toLowerCase())
  );

  const PlaceSelection = () => (
    <div>
      <label className="block text-gray-700 font-semibold mb-2">
        Applicable Places
      </label>

      <div className="mb-2">
        <input
          type="text"
          placeholder="Search places..."
          value={searchPlace}
          onChange={(e) => setSearchPlace(e.target.value)}
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-2 flex flex-wrap gap-2">
        {selectedPlaces.map((placeId) => {
          const place = places.find((p) => p._id === placeId);
          if (!place) return null;

          return (
            <span
              key={place._id}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              {place.title}
              <button
                type="button"
                onClick={() =>
                  setSelectedPlaces((prev) =>
                    prev.filter((id) => id !== place._id)
                  )
                }
                className="ml-2 max-w-10 text-blue-600 hover:text-blue-800"
              >
                <FaTimes size={15} />
              </button>
            </span>
          );
        })}
      </div>

      <div className="max-h-60 overflow-y-auto border rounded-lg">
        <div className="grid grid-cols-1 gap-1 p-2">
          {filteredPlaces.map((place) => {
            const isSelected = selectedPlaces.includes(place._id);

            return (
              <button
                key={place._id}
                type="button"
                onClick={() => {
                  setSelectedPlaces((prev) =>
                    isSelected
                      ? prev.filter((id) => id !== place._id)
                      : [...prev, place._id]
                  );
                }}
                className={`
                  flex items-center justify-between p-2 rounded
                  ${
                    isSelected
                      ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      : "hover:bg-gray-50"
                  }
                `}
              >
                <span className="truncate">{place.title}</span>
                {isSelected && <CheckIcon className="h-5 w-5 text-blue-600" />}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-1">
        Click to select/deselect places
      </p>
    </div>
  );

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        Back
      </button>

      <h1 className="text-2xl font-bold mb-6">
        {id ? "Edit Voucher" : "Create New Voucher"}
      </h1>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={saveVoucher} className="space-y-6">
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Voucher Code
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (touched.code) {
                handleBlur("code");
              }
            }}
            onBlur={() => handleBlur("code")}
            placeholder="e.g., SUMMER2024"
            className={`w-full p-2 border rounded-lg transition-all duration-200
              ${
                formErrors.code
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }
              ${
                touched.code && !formErrors.code && code
                  ? "border-green-500 focus:ring-green-500"
                  : ""
              }
            `}
            maxLength={20}
          />
          {formErrors.code && touched.code && (
            <p className="mt-1 text-sm text-red-500 transition-all">
              {formErrors.code}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {code.length}/{validationRules.code.maxLength} characters
          </p>
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Discount Percentage (%)
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              value={discount}
              onChange={(e) => {
                const value = Math.max(
                  0,
                  Math.min(100, Number(e.target.value))
                );
                setDiscount(value);
                if (touched.discount) {
                  handleBlur("discount");
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "-" || e.key === "e") {
                  e.preventDefault();
                }
              }}
              onBlur={() => handleBlur("discount")}
              placeholder="Enter discount percentage"
              className={`w-full p-2 pl-4 pr-8 border rounded-lg transition-all duration-200
                ${
                  formErrors.discount
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }
              `}
              min="0"
              max="100"
              step="1"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              %
            </span>
          </div>
          {formErrors.discount && touched.discount && (
            <p className="mt-1 text-sm text-red-500 transition-all">
              {formErrors.discount}
            </p>
          )}
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter voucher description, e.g., at least 20 characters"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <PlaceSelection />

        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Usage Limit
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="number"
            value={usageLimit}
            onChange={(e) => {
              const value = Math.max(1, Number(e.target.value));
              setUsageLimit(value);
              if (touched.usageLimit) {
                handleBlur("usageLimit");
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e") {
                e.preventDefault();
              }
            }}
            onBlur={() => handleBlur("usageLimit")}
            className={`w-full p-2 border rounded-lg transition-all duration-200
              ${
                formErrors.usageLimit
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }
            `}
            min="1"
            step="1"
            required
          />
          {formErrors.usageLimit && touched.usageLimit && (
            <p className="mt-1 text-sm text-red-500 transition-all">
              {formErrors.usageLimit}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            Maximum number of times this voucher can be used
          </p>
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Expiration Date
          </label>
          <input
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            min={new Date().toISOString().split("T")[0]}
            required
          />
        </div>

        <button
          type="submit"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          disabled={loading || Object.keys(formErrors).length > 0}
          className={`
            w-full py-3 px-6 rounded-lg
            transition-all duration-200
            ${
              loading || Object.keys(formErrors).length > 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 transform hover:scale-[1.02]"
            }
            text-white font-semibold
          `}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg
                className="animate-spin h-5 w-5 mr-3"
                viewBox="0 0 24 24"
                fill="none"
              >
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
            "Save Voucher"
          )}
        </button>
      </form>
    </div>
  );
}
