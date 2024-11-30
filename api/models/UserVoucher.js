const mongoose = require("mongoose");

const userVoucherSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  voucher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Voucher",
    required: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  usedAt: {
    type: Date,
  },
  claimedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for better query performance
userVoucherSchema.index({ user: 1, voucher: 1 });

const UserVoucher = mongoose.model("UserVoucher", userVoucherSchema);
module.exports = UserVoucher;
