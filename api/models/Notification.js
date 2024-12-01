const mongoose = require("mongoose");
const { Schema } = mongoose;

const notificationSchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ["booking", "place", "user", "payment", "system"],
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["unread", "read"],
    default: "unread",
  },
  link: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
