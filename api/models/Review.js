const mongoose = require("mongoose");
const { Schema } = mongoose;

const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  place: { type: mongoose.Schema.Types.ObjectId, ref: "Place", required: true },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    set: (v) => Number(v) || 0,
  },
  review_text: {
    type: String,
    required: true,
  },
  cleanliness: { type: Number, min: 1, max: 5, set: (v) => Number(v) || 0 },
  communication: { type: Number, min: 1, max: 5, set: (v) => Number(v) || 0 },
  checkIn: { type: Number, min: 1, max: 5, set: (v) => Number(v) || 0 },
  accuracy: { type: Number, min: 1, max: 5, set: (v) => Number(v) || 0 },
  location: { type: Number, min: 1, max: 5, set: (v) => Number(v) || 0 },
  value: { type: Number, min: 1, max: 5, set: (v) => Number(v) || 0 },
  created_at: {
    type: Date,
    default: Date.now,
  },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
});

const ReviewModel = mongoose.model("Review", ReviewSchema);

module.exports = ReviewModel;
