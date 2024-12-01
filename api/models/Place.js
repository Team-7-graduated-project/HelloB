const mongoose = require("mongoose");

const PlaceSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    address: { type: String, required: true },
    photos: [{ type: String }],
    description: { type: String, required: true },
    perks: [
      {
        type: String,
        enum: [
          "wifi",
          "tv",
          "kitchen",
          "air-conditioning",
          "heating",
          "washer",
          "dryer",
          "free parking spot",
          "pool",
          "gym",
          "hot-tub",
          "pets",
          "entrance",
          "security-cameras",
          "workspace",
          "breakfast",
          "fireplace",
          "balcony",
          "garden",
          "beach-access",
          "smoking",
          "first-aid",
          "fire-extinguisher",
          "elevator",
        ],
      },
    ],
    amenities_description: {
      type: Map,
      of: String,
      default: {},
    }, // For custom descriptions of perks
    property_type: {
      type: String,
      enum: [
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
      ],
      required: true,
      default: "other",
    },
    extra_info: { type: String },
    check_in: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid time format! Use HH:MM`,
      },
    },
    check_out: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid time format! Use HH:MM`,
      },
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },
    max_guests: {
      type: Number,
      required: true,
      min: [1, "Must accommodate at least 1 guest"],
      max: [50, "Maximum guests exceeded"],
    },
    bedrooms: {
      type: Number,
      required: true,
      min: [1, "Must have at least 1 bedroom"],
    },
    beds: {
      type: Number,
      required: true,
      min: [1, "Must have at least 1 bed"],
    },
    bathrooms: {
      type: Number,
      required: true,
      min: [1, "Must have at least 1 bathroom"],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending", "blocked"],
      default: "active",
    },
    house_rules: [{ type: String }],
    cancellation_policy: {
      type: String,
      enum: ["flexible", "moderate", "strict"],
      default: "moderate",
    },
    minimum_stay: {
      type: Number,
      default: 1,
      min: [1, "Minimum stay must be at least 1 night"],
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    deactivationReason: {
      type: String,
      default: "",
    },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for location-based queries
PlaceSchema.index({ location: "2dsphere" });

PlaceSchema.index({ isActive: 1 });

// Compound index for common search patterns
PlaceSchema.index({ isActive: 1, property_type: 1 });
PlaceSchema.index({ isActive: 1, createdAt: -1 });
PlaceSchema.index({ isActive: 1, rating: -1 });

// Virtual for average rating
PlaceSchema.virtual("averageRating", {
  ref: "Review",
  localField: "_id",
  foreignField: "place",
  justOne: false,
  options: { sort: { createdAt: -1 } },
  get: function (reviews) {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  },
});

// Middleware to ensure coordinates are valid
PlaceSchema.pre("save", function (next) {
  if (this.location.coordinates.length !== 2) {
    next(new Error("Location must have latitude and longitude"));
  }
  const [longitude, latitude] = this.location.coordinates;
  if (longitude < -180 || longitude > 180) {
    next(new Error("Invalid longitude"));
  }
  if (latitude < -90 || latitude > 90) {
    next(new Error("Invalid latitude"));
  }
  next();
});

module.exports = mongoose.model("Place", PlaceSchema);
