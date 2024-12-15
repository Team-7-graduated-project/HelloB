const mongoose = require("mongoose");
const { Schema } = mongoose;

const PaymentOptionSchema = new Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  method: {
    type: String,
    required: true,
    enum: ["card", "momo", "payLater"],
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  cardDetails: {
    cardNumber: String,
    cardHolder: String,
    expiryDate: String,
    cvv: String,
    last4: String, // Store only last 4 digits for reference
  },
  voucherCode: String,
  discountAmount: Number,
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  orderId: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add pre-save middleware to mask card number
PaymentOptionSchema.pre("save", function (next) {
  if (this.cardDetails && this.cardDetails.cardNumber) {
    this.cardDetails.last4 = this.cardDetails.cardNumber.slice(-4);
    this.cardDetails.cardNumber = undefined; // Don't store full card number
    this.cardDetails.cvv = undefined; // Don't store CVV
  }
  next();
});

const PaymentOption = mongoose.model("PaymentOption", PaymentOptionSchema);

module.exports = PaymentOption;
