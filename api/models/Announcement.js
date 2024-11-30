const mongoose = require("mongoose");
const { Schema } = mongoose;

const AnnouncementSchema = new Schema({
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["weekly", "monthly"],
    required: true,
  },
  period: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  metrics: {
    totalBookings: { type: Number, required: true, min: 0 },
    totalRevenue: { type: Number, required: true, min: 0 },
    completedBookings: { type: Number, required: true, min: 0 },
    cancelledBookings: { type: Number, required: true, min: 0 },
  },
  status: {
    type: String,
    enum: ["pending", "reviewed", "archived"],
    default: "pending",
  },
  adminComment: String,
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Announcement", AnnouncementSchema);
