const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: false },
    phone: { type: String, required: false },
    photo: { type: String, default: "" },
    role: {
      type: String,
      enum: ["user", "host", "admin"],
      default: "user",
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    reason: { type: String, default: "" },
    googleId: { type: String, sparse: true },
    picture: { type: String },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Place",
      },
    ],
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", UserSchema);
module.exports = UserModel;
