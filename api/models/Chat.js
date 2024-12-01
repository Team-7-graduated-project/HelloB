const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
});

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    messages: [messageSchema],
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Add a method to get other participant
chatSchema.methods.getOtherParticipant = function (userId) {
  return this.participants.find((p) => p.toString() !== userId.toString());
};

// Update lastActivity on new messages
messageSchema.pre("save", function (next) {
  this.parent().lastActivity = new Date();
  next();
});

module.exports = mongoose.model("Chat", chatSchema);
