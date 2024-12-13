const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['revenue', 'bookings'],
    required: true
  },
  period: {
    type: String,
    enum: ['week', 'month'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  metrics: {
    total: Number,
    percentageChange: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Add method to check if host can create new announcemente
announcementSchema.statics.canCreateAnnouncement = async function(hostId, period) {
  const lastAnnouncement = await this.findOne({
    host: hostId,
    period: period,
    createdAt: {
      $gte: period === 'week' 
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }
  }).sort({ createdAt: -1 });

  return !lastAnnouncement;
};

const Announcement = mongoose.model('Announcement', announcementSchema);
module.exports = Announcement; 
