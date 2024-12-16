const mongoose = require("mongoose");
const { Schema } = mongoose;

const notificationSchema = new Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['system', 'booking', 'review', 'host', 'admin', 'user', 'property', 'system_error', 'booking_auto_completed'],
    default: 'system'
  },
  link: String,
  status: {
    type: String,
    enum: ['read', 'unread'],
    default: 'unread'
  },
  priority: {
    type: String,
    enum: ['high', 'normal', 'low'],
    default: 'normal'
  },
  category: {
    type: String,
    enum: ['system', 'booking', 'property', 'user', 'general'],
    default: 'general'
  },
  metadata: Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
