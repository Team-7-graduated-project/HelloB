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
      pattern: "Code can only contain uppercase letters, numbers, hyphens and underscores",
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
    maxLength: 500,
    message: {
      required: "Description is required",
      minLength: "Description must be at least 10 characters",
      maxLength: "Description cannot exceed 500 characters",
    },
  },
  places: {
    required: true,
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
        const response = await axios.get(`/host/vouchers/${id}`);
        const data = response.data;
        
        setCode(data.code || '');
        setDiscount(data.discount || '');
        setDescription(data.description || '');
        setUsageLimit(data.usageLimit || 1);
        setSelectedPlaces(data.applicablePlaces?.map(p => p._id) || []);
        
        if (data.expirationDate) {
          setExpirationDate(new Date(data.expirationDate).toISOString().split('T')[0]);
        }
      } catch (error) {
        console.error('Error fetching voucher:', error);
        setError('Failed to load voucher data');
        navigate('/host/vouchers');
      } finally {
        setLoading(false);
      }
    };

    fetchVoucherData();
  }, [id, navigate]);

  const validateForm = () => {
    const errors = {};

    // Code validation
    if (!code) {
      errors.code = validationRules.code.message.required;
    } else {
      if (code.length < validationRules.code.minLength) {
        errors.code = validationRules.code.message.minLength;
      } else if (code.length > validationRules.code.maxLength) {
        errors.code = validationRules.code.message.maxLength;
      } else if (!validationRules.code.pattern.test(code)) {
        errors.code = validationRules.code.message.pattern;
      }
    }

    // Discount validation
    if (discount === "") {
      errors.discount = validationRules.discount.message.required;
    } else {
      const discountNum = parseFloat(discount);
      if (isNaN(discountNum) || discountNum < validationRules.discount.min || discountNum > validationRules.discount.max) {
        errors.discount = validationRules.discount.message.range;
      }
    }

    // Description validation
    if (!description) {
      errors.description = validationRules.description.message.required;
    } else {
      if (description.length < validationRules.description.minLength) {
        errors.description = validationRules.description.message.minLength;
      } else if (description.length > validationRules.description.maxLength) {
        errors.description = validationRules.description.message.maxLength;
      }
    }

    // Places validation
    if (!selectedPlaces.length) {
      errors.places = validationRules.places.message.required;
    }

    // Expiration date validation
    if (!expirationDate) {
      errors.expirationDate = validationRules.expirationDate.message.required;
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expDate = new Date(expirationDate);
      if (expDate < today) {
        errors.expirationDate = validationRules.expirationDate.message.future;
      }
    }

    // Usage limit validation
    if (!usageLimit) {
      errors.usageLimit = validationRules.usageLimit.message.required;
    } else if (parseInt(usageLimit) < validationRules.usageLimit.min) {
      errors.usageLimit = validationRules.usageLimit.message.min;
    }

    return errors;
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const fieldErrors = validateField(field);
    setFormErrors(prev => ({ ...prev, ...fieldErrors }));
  };

  const validateField = (field) => {
    const errors = {};

    switch (field) {
      case 'code':
        if (!code) {
          errors.code = validationRules.code.message.required;
        } else if (code.length < validationRules.code.minLength) {
          errors.code = validationRules.code.message.minLength;
        } else if (!validationRules.code.pattern.test(code)) {
          errors.code = validationRules.code.message.pattern;
        }
        break;

      case 'discount':
        if (discount === "") {
          errors.discount = validationRules.discount.message.required;
        } else {
          const discountNum = parseFloat(discount);
          if (isNaN(discountNum) || discountNum < validationRules.discount.min || discountNum > validationRules.discount.max) {
            errors.discount = validationRules.discount.message.range;
          }
        }
        break;

      case 'description':
        if (!description) {
          errors.description = validationRules.description.message.required;
        } else if (description.length < validationRules.description.minLength) {
          errors.description = validationRules.description.message.minLength;
        }
        break;

      // Add other field validations as needed
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

    try {
      setLoading(true);
      setError("");

      const voucherData = {
        code: code.toUpperCase(),
        discount: Number(discount),
        description,
        expirationDate,
        usageLimit: Number(usageLimit),
        applicablePlaces: selectedPlaces,
      };

      let response;
      if (id) {
        response = await axios.put(`/host/vouchers/${id}`, voucherData);
        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to update voucher');
        }
      } else {
        response = await axios.post('/host/vouchers', voucherData);
        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to create voucher');
        }
      }

      // Only navigate if successful
      navigate('/host/vouchers');
    } catch (error) {
      console.error('Voucher save error:', error);
      setError(error.response?.data?.error || error.message || 'Failed to save voucher');
      
      // Scroll error into view
      setTimeout(() => {
        const errorElement = document.querySelector('.bg-red-50');
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
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
    <div className="max-w-3xl mx-auto my-8">
      {/* Header Section */}
      <div className="bg-white rounded-t-2xl shadow-sm p-6 border-b">
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => navigate('/host/vouchers')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {id ? 'Edit Voucher' : 'Create New Voucher'}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {id ? 'Update your voucher details' : 'Create a new voucher for your places'}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 mb-4">
            <FaTimes className="flex-shrink-0" />
            <p className="flex-grow">{error}</p>
            <button 
              onClick={() => setError("")} 
              className="flex-shrink-0 hover:bg-red-100 p-1 rounded-full transition-colors"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Form Section */}
      <form onSubmit={saveVoucher} className="bg-white rounded-b-2xl shadow-sm divide-y">
        {/* Voucher Code Section */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Code Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voucher Code
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    if (touched.code) handleBlur("code");
                  }}
                  onBlur={() => handleBlur("code")}
                  placeholder="e.g., SUMMER2024"
                  className={`
                    w-full px-4 py-2.5 rounded-lg border bg-white
                    focus:ring-2 focus:ring-offset-0 transition-all duration-200
                    ${
                      formErrors.code
                        ? "border-red-300 focus:border-red-300 focus:ring-red-200"
                        : touched.code && code
                        ? "border-green-300 focus:border-green-300 focus:ring-green-200"
                        : "border-gray-300 focus:border-primary focus:ring-primary/20"
                    }
                  `}
                  maxLength={20}
                />
                {touched.code && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {formErrors.code ? (
                      <FaTimes className="text-red-500" />
                    ) : code ? (
                      <CheckIcon className="h-5 w-5 text-green-500" />
                    ) : null}
                  </div>
                )}
              </div>
              {formErrors.code && touched.code && (
                <p className="mt-1.5 text-sm text-red-500">{formErrors.code}</p>
              )}
              <p className="mt-1.5 text-sm text-gray-500">
                {code.length}/{validationRules.code.maxLength} characters
              </p>
            </div>

            {/* Discount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Percentage
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => {
                    const value = Math.max(0, Math.min(100, Number(e.target.value)));
                    setDiscount(value);
                    if (touched.discount) handleBlur("discount");
                  }}
                  onBlur={() => handleBlur("discount")}
                  placeholder="Enter discount value"
                  className={`
                    w-full px-4 py-2.5 rounded-lg border bg-white pr-12
                    focus:ring-2 focus:ring-offset-0 transition-all duration-200
                    ${
                      formErrors.discount
                        ? "border-red-300 focus:border-red-300 focus:ring-red-200"
                        : "border-gray-300 focus:border-primary focus:ring-primary/20"
                    }
                  `}
                  min="0"
                  max="100"
                />
                <div className="absolute left-11 top-1/2 -translate-y-1/2 text-gray-500">%</div>
              </div>
              {formErrors.discount && touched.discount && (
                <p className="mt-1.5 text-sm text-red-500">{formErrors.discount}</p>
              )}
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
            <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => handleBlur("description")}
            placeholder="Describe your voucher..."
            rows="3"
            className={`
              w-full px-4 py-2.5 rounded-lg border bg-white
              focus:ring-2 focus:ring-offset-0 transition-all duration-200
              ${
                formErrors.description
                  ? "border-red-300 focus:border-red-300 focus:ring-red-200"
                  : "border-gray-300 focus:border-primary focus:ring-primary/20"
              }
            `}
          />
          {formErrors.description && touched.description && (
            <p className="mt-1.5 text-sm text-red-500">{formErrors.description}</p>
          )}
        </div>

        {/* Places Selection */}
        <div className="p-6">
          <PlaceSelection />
        </div>

        {/* Usage Limit & Expiration */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usage Limit
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="number"
                value={usageLimit}
                onChange={(e) => setUsageLimit(Math.max(1, Number(e.target.value)))}
                min="1"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <p className="mt-1.5 text-sm text-gray-500">
                Maximum number of times this voucher can be used
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiration Date
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="p-6 bg-gray-50 rounded-b-2xl flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-lg border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || Object.keys(formErrors).length > 0}
            className={`
              px-6 py-2.5 rounded-lg font-medium
              transition-all duration-200
              ${
                loading || Object.keys(formErrors).length > 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-primary text-white hover:bg-primary-dark"
              }
            `}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                <span>Saving...</span>
              </div>
            ) : (
              "Save Voucher"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
