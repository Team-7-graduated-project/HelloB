const mongoose = require("mongoose");
const { Schema } = mongoose;

const bookingSchema = new Schema(
  {
    place: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Place",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    check_in: {
      type: Date,
      required: true,
    },
    check_out: {
      type: Date,
      required: true,
    },
    max_guests: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["card", "momo", "payLater", "none"],
      default: "none"
    },
    paymentAmount: {
      type: Number,
      required: true,
      default: 0
    },
    voucherCode: String,
    discountAmount: Number,
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentOption",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    earlyCheckoutFee: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number
    },
    checkoutDate: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ place: 1 });

const BookingModel = mongoose.model("Booking", bookingSchema);

module.exports = BookingModel;
