const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    description: {
      type: String,
      required: true,
    },
    expirationDate: {
      type: Date,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    applicablePlaces: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Place",
        required: true,
      },
    ],
    usageLimit: {
      type: Number,
      default: 100,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    claims: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        claimedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    usedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        bookingId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Booking",
          required: true,
        },
        usedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
voucherSchema.index({ owner: 1, code: 1 });
voucherSchema.index({ expirationDate: 1 });
voucherSchema.index({ "claims.userId": 1 });
voucherSchema.index({ "usedBy.userId": 1 });
voucherSchema.index({ active: 1, expirationDate: 1 });

// Virtual to check if voucher is expired
voucherSchema.virtual("isExpired").get(function () {
  return this.expirationDate < new Date();
});

// Virtual to check if voucher is still available
voucherSchema.virtual("isAvailable").get(function () {
  return this.active && !this.isExpired && this.usedCount < this.usageLimit;
});

// Add a method to check if a user has claimed the voucher
voucherSchema.methods.isClaimedByUser = function (userId) {
  return this.claims.some(
    (claim) => claim.userId.toString() === userId.toString()
  );
};

// Update the claimedStatus virtual to include more details
voucherSchema.virtual("claimedStatus").get(function () {
  return {
    totalClaims: this.claims.length,
    remainingClaims: this.usageLimit - this.claims.length,
    isExpired: this.expirationDate < new Date(),
    isActive: this.active,
    usedCount: this.usedCount,
    canClaim:
      this.active && !this.isExpired && this.usedCount < this.usageLimit,
  };
});

const Voucher = mongoose.model("Voucher", voucherSchema);
module.exports = Voucher;
