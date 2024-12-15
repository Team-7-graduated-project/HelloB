app.get(
  "/admin/users",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const users = await User.find({ role: "user" });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve users" });
    }
  }
);

// Get all hosts (Admin only)
app.get(
  "/admin/hosts",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const hosts = await User.find({ role: "host" });
      res.json(hosts);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve hosts" });
    }
  }
);

// Delete user by ID (Admin only)
app.delete(
  "/admin/users/:id",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  }
);
app.put(
  "/api/admin/users/:id/status",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    const { id } = req.params;
    const { isActive, reason } = req.body;

    try {
      // Find the user first
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // If user is a host, update related data
      if (user.role === "host") {
        const success = await updateHostDataVisibility(id, isActive);
        if (!success) {
          return res.status(500).json({ error: "Failed to update host data" });
        }
      }

      // Update user status
      const updatedUser = await User.findByIdAndUpdate(
        id,
        {
          isActive,
          reason: isActive ? "" : reason || "Account deactivated by admin",
        },
        { new: true }
      );

      // Send email notification
      try {
        await transporter.sendMail({
          from: {
            name: "HelloB",
            address: process.env.EMAIL_USER,
          },
          to: user.email,
          subject: `Account ${isActive ? "Activated" : "Deactivated"} - HelloB`,
          html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1>Account ${isActive ? "Activated" : "Deactivated"}</h1>
                <p>Dear ${user.name},</p>
                <p>Your account has been ${
                  isActive ? "activated" : "deactivated"
                }.</p>
                ${!isActive && reason ? `<p>Reason: ${reason}</p>` : ""}
                <p>If you have any questions, please contact our support team.</p>
              </div>
            `,
        });
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
        // Continue execution even if email fails
      }

      return res.status(200).json({
        success: true,
        message: `User ${isActive ? "activated" : "deactivated"} successfully`,
        reason: isActive ? "" : reason,
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to update user status",
        details: error.message,
      });
    }
  }
);

// Delete host by ID (Admin only)
app.delete(
  "/admin/hosts/:id",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Host deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete host" });
    }
  }
);
// Get all places for admin
app.get(
  "/admin/places",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const places = await Place.find()
        .populate("owner", "name email phone") // Make sure to populate owner field
        .sort({ createdAt: -1 });

      res.json(places);
    } catch (error) {
      console.error("Error fetching places:", error);
      res.status(500).json({ error: "Failed to fetch places" });
    }
  }
);
app.delete(
  "/admin/users/:id",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    try {
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.role === "host") {
        const success = await updateHostDataVisibility(id, false, true);
        if (!success) {
          return res.status(500).json({ error: "Failed to delete host data" });
        }
      }

      // Update user as deleted
      await User.findByIdAndUpdate(id, {
        isActive: false,
        isDeleted: true,
        reason: reason || "Account deleted by admin",
      });

      // Send notification email
      await transporter.sendMail({
        from: {
          name: "HelloB",
          address: process.env.EMAIL_USER,
        },
        to: user.email,
        subject: "Account Deleted - HelloB",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Account Deleted</h1>
            <p>Dear ${user.name},</p>
            <p>Your account has been deleted from our system.</p>
            ${reason ? `<p>Reason: ${reason}</p>` : ""}
            <p>All your data has been marked as deleted.</p>
            <p>If you believe this was done in error, please contact our support team.</p>
          </div>
        `,
      });

      res.status(200).json({
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  }
);

// Admin Stats Endpoint
app.get("/api/admin/stats", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin using userData from authenticateToken
    if (req.userData.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    // Get all required stats using Promise.all for better performance
    const [totalUsers, totalHosts, totalPlaces, totalBookings, recentBookings] =
      await Promise.all([
        User.countDocuments({ role: "user" }),
        User.countDocuments({ role: "host" }),
        Place.countDocuments(),
        Booking.countDocuments(),
        Booking.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("user", "name email")
          .populate("place", "title")
          .lean(),
      ]);

    // Calculate total payments from bookings
    const totalPayments = await Booking.aggregate([
      {
        $match: { status: { $in: ["confirmed", "checked-out"] } },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$price" },
        },
      },
    ]);

    const stats = {
      totalUsers,
      totalHosts,
      totalPlaces,
      totalBookings,
      totalPayments: totalPayments.length > 0 ? totalPayments[0].total : 0,
      recentActivity: recentBookings.map((booking) => ({
        _id: booking._id.toString(),
        userName: booking.user?.name || "Unknown",
        userEmail: booking.user?.email || "Unknown",
        placeTitle: booking.place?.title || "Unknown",
        price: booking.price || 0,
        status: booking.status,
        createdAt: booking.createdAt,
      })),
    };

    res.json(stats);
  } catch (error) {
    console.error("Error in /api/admin/stats:", error);
    res.status(500).json({
      error: "Failed to fetch statistics",
      message: error.message,
    });
  }
});

// Get all hosts with their properties (Admin only)
app.get(
  "/api/admin/hosts-with-properties",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const hosts = await User.aggregate([
        {
          $match: { role: "host" },
        },
        {
          $lookup: {
            from: "places",
            localField: "_id",
            foreignField: "owner",
            as: "properties",
          },
        },
        {
          $lookup: {
            from: "bookings",
            let: { hostProperties: "$properties._id" },
            pipeline: [
              {
                $match: {
                  $expr: { $in: ["$place", "$$hostProperties"] },
                  status: "confirmed",
                  paymentStatus: "paid",
                },
              },
              {
                $group: {
                  _id: null,
                  totalPayments: { $sum: "$price" },
                },
              },
            ],
            as: "bookings",
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            phone: 1,
            password: 1,
            isActive: 1,
            properties: {
              _id: 1,
              title: 1,
              status: 1,
            },
            totalPayments: {
              $ifNull: [{ $arrayElemAt: ["$bookings.totalPayments", 0] }, 0],
            },
          },
        },
      ]);

      res.json(hosts);
    } catch (error) {
      console.error("Error fetching hosts with properties:", error);
      res.status(500).json({ error: "Failed to retrieve hosts data" });
    }
  }
);

// Analytics endpoint
app.get(
  "/api/admin/analytics",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { timeFrame } = req.query;
      let startDate = new Date();
      let groupBy;

      // Configure date ranges based on timeFrame
      switch (timeFrame) {
        case "week":
          startDate.setDate(startDate.getDate() - 7);
          groupBy = {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          };
          break;
        case "month":
          startDate.setMonth(startDate.getMonth() - 1);
          groupBy = {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          };
          break;
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 1);
          groupBy = {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          };
      }

      // Get analytics data
      const [bookingStats, topPlaces, topHosts] = await Promise.all([
        // Overall booking stats
        Booking.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: groupBy,
              bookings: { $sum: 1 },
              revenue: { $sum: "$price" },
              completed: {
                $sum: {
                  $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
                },
              },
            },
          },
          { $sort: { _id: 1 } },
        ]),

        // Top performing places
        Place.aggregate([
          {
            $lookup: {
              from: "bookings",
              localField: "_id",
              foreignField: "place",
              pipeline: [{ $match: { createdAt: { $gte: startDate } } }],
              as: "bookings",
            },
          },
          {
            $project: {
              title: 1,
              bookings: { $size: "$bookings" },
              revenue: { $sum: "$bookings.price" },
            },
          },
          { $sort: { revenue: -1 } },
          { $limit: 5 },
        ]),

        // Top performing hosts
        User.aggregate([
          { $match: { role: "host" } },
          {
            $lookup: {
              from: "places",
              localField: "_id",
              foreignField: "owner",
              as: "places",
            },
          },
          {
            $lookup: {
              from: "bookings",
              localField: "places._id",
              foreignField: "place",
              pipeline: [{ $match: { createdAt: { $gte: startDate } } }],
              as: "bookings",
            },
          },
          {
            $project: {
              name: 1,
              totalPlaces: { $size: "$places" },
              revenue: { $sum: "$bookings.price" },
            },
          },
          { $sort: { revenue: -1 } },
          { $limit: 5 },
        ]),
      ]);

      // Calculate overview metrics
      const totalBookings = bookingStats.reduce(
        (sum, stat) => sum + stat.bookings,
        0
      );
      const totalRevenue = bookingStats.reduce(
        (sum, stat) => sum + stat.revenue,
        0
      );
      const totalCompleted = bookingStats.reduce(
        (sum, stat) => sum + stat.completed,
        0
      );

      const response = {
        overview: {
          totalBookings,
          totalRevenue,
          averageBookingValue:
            totalBookings > 0 ? totalRevenue / totalBookings : 0,
          bookingCompletionRate:
            totalBookings > 0
              ? ((totalCompleted / totalBookings) * 100).toFixed(1)
              : 0,
        },
        bookingsByPeriod: bookingStats.map((stat) => ({
          date: stat._id,
          bookings: stat.bookings,
        })),
        revenueByPeriod: bookingStats.map((stat) => ({
          date: stat._id,
          revenue: stat.revenue,
        })),
        topPlaces,
        topHosts,
      };

      res.json(response);
    } catch (error) {
      console.error("Admin analytics error:", error);
      res.status(500).json({ message: "Error fetching analytics data" });
    }
  }
);
app.put(
  "/admin/users/:id",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email } = req.body;

      // Validate required fields
      if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
      }

      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return res.status(422).json({ error: "Email is already in use" });
      }

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { name, email },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  }
);

// Update host by ID (Admin only)
app.put(
  "/admin/hosts/:id",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, phone } = req.body;

      // Validate required fields
      if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
      }

      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return res.status(422).json({ error: "Email is already in use" });
      }

      // Check if phone is already taken by another user (if phone is provided)
      if (phone) {
        const existingPhone = await User.findOne({ phone, _id: { $ne: id } });
        if (existingPhone) {
          return res
            .status(422)
            .json({ error: "Phone number is already in use" });
        }
      }

      const updateData = {
        name,
        email,
        ...(phone && { phone }), // Only include phone if it's provided
      };

      const updatedHost = await User.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updatedHost) {
        return res.status(404).json({ error: "Host not found" });
      }

      res.json(updatedHost);
    } catch (error) {
      console.error("Error updating host:", error);
      res.status(500).json({ error: "Failed to update host" });
    }
  }
);

app.get(
  "/api/admin/reports",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const reports = await Report.find()
        .populate("reportedBy", "name email")
        .populate("place", "title address")
        .sort({ createdAt: -1 });
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  }
);

// Update report status (Admin only)
app.put(
  "/api/admin/reports/:id/status",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const report = await Report.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      ).populate("reportedBy", "name email");

      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      // Create notification for status change
      await createNotification(
        "report_update",
        "Report Status Updated",
        `Report #${report._id} has been marked as ${status}`,
        `/reports/${report._id}`
      );

      res.json(report);
    } catch (error) {
      console.error("Error updating report status:", error);
      res.status(500).json({ error: "Failed to update report status" });
    }
  }
);

// Update report (Add admin notes) (Admin only)
app.put(
  "/api/admin/reports/:id",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { adminNotes, status } = req.body;

      const report = await Report.findByIdAndUpdate(
        id,
        {
          adminNotes,
          status,
          updatedAt: new Date(),
        },
        { new: true }
      ).populate("reportedBy", "name email");

      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      // Create notification for report update
      await createNotification(
        "report_update",
        "Report Updated",
        `Admin notes have been added to report #${report._id}`,
        `/reports/${report._id}`
      );

      res.json(report);
    } catch (error) {
      console.error("Error updating report:", error);
      res.status(500).json({ error: "Failed to update report" });
    }
  }
);
app.delete(
  "/api/admin/reports/:id",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const report = await Report.findByIdAndDelete(id);

      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      res.json({ message: "Report deleted successfully" });
    } catch (error) {
      console.error("Error deleting report:", error);
      res.status(500).json({ error: "Failed to delete report" });
    }
  }
);

// Get all places (Admin only)
app.get(
  "/api/admin/places",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const places = await Place.find()
        .populate("owner", "name email phone")
        .sort({ createdAt: -1 });
      res.json(places);
    } catch (error) {
      console.error("Error fetching places:", error);
      res.status(500).json({ error: "Failed to fetch places" });
    }
  }
);

// Delete place (Admin only)
app.delete(
  "/api/admin/places/:id",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if place exists
      const place = await Place.findById(id);
      if (!place) {
        return res.status(404).json({ error: "Place not found" });
      }

      // Delete associated bookings
      await Booking.deleteMany({ place: id });

      // Delete associated reviews
      await Review.deleteMany({ place: id });

      // Delete the place
      await Place.findByIdAndDelete(id);

      res.json({ message: "Place deleted successfully" });
    } catch (error) {
      console.error("Error deleting place:", error);
      res.status(500).json({ error: "Failed to delete place" });
    }
  }
);
app.put(
  "/admin/users/:id/status",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    const { id } = req.params;
    const { isActive, reason } = req.body;

    try {
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update user status and all associated data
      const dataUpdated = await updateUserDataVisibility(id, isActive);
      if (!dataUpdated) {
        return res.status(500).json({
          error: "Failed to update user status and associated data",
        });
      }

      // Update reason if deactivating
      if (!isActive) {
        await User.findByIdAndUpdate(id, { reason: reason });
      }

      // Send notification email
      await transporter.sendMail({
        from: {
          name: "HelloB",
          address: process.env.EMAIL_USER,
        },
        to: user.email,
        subject: `Account ${isActive ? "Activated" : "Deactivated"} - HelloB`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Account ${isActive ? "Activated" : "Deactivated"}</h1>
            <p>Dear ${user.name},</p>
            <p>Your account has been ${
              isActive ? "activated" : "deactivated"
            }.</p>
            ${!isActive ? `<p>Reason: ${reason}</p>` : ""}
            <p>This affects all your data including:</p>
            <ul>
              <li>Places</li>
              <li>Bookings</li>
              <li>Reviews</li>
              <li>Vouchers</li>
       
              <li>Messages</li>
            </ul>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        `,
      });

      res.status(200).json({
        message: `User ${isActive ? "activated" : "deactivated"} successfully`,
        reason: reason,
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ error: "Failed to update user status" });
    }
  }
);

// Modified delete host route
app.delete(
  "/admin/hosts/:id",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "Host not found" });
      }

      // First deactivate all associated data
      await updateUserDataVisibility(req.params.id, false);

      // Then either hard delete or soft delete based on your requirements
      // Option 1: Hard delete (permanently remove data)
      await Promise.all([
        Place.deleteMany({ owner: req.params.id }),
        Review.deleteMany({ author: req.params.id }),
        Voucher.deleteMany({ owner: req.params.id }),
        Booking.deleteMany({ user: req.params.id }),
        User.findByIdAndDelete(req.params.id),
      ]);

      // Send notification email
      await transporter.sendMail({
        from: {
          name: "HelloB",
          address: process.env.EMAIL_USER,
        },
        to: user.email,
        subject: "Account Deleted - HelloB",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Account Deleted</h1>
            <p>Dear ${user.name},</p>
            <p>Your account has been deleted from our system.</p>
            <p>If you believe this was done in error, please contact our support team.</p>
          </div>
        `,
      });

      res
        .status(200)
        .json({ message: "Host and associated data deleted successfully" });
    } catch (error) {
      console.error("Error deleting host:", error);
      res.status(500).json({ error: "Failed to delete host" });
    }
  }
);
const createNotification = async (
  type,
  title,
  message,
  link = "",
  userId = null,
  options = {}
) => {
  try {
    const {
      priority = "normal", // Priority: high, normal, low
      category = "general", // Category: general, user, host, booking, report, system
      expiresAt = null, // Optional expiration date
      actions = [], // Optional actions that can be taken
      metadata = {}, // Additional data
    } = options;

    const notification = new Notification({
      type,
      title,
      message,
      link,
      user: userId,
      status: "unread",
      priority,
      category,
      expiresAt,
      actions,
      metadata,
      createdAt: new Date(),
    });

    await notification.save();

    // If it's a high priority notification, we might want to send additional alerts
    if (priority === "high") {
      // TODO: Implement email/SMS alerts for high priority notifications
      console.log("High priority notification created:", title);
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Admin notification endpoints
app.get(
  "/api/admin/notifications",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const {
        status,
        priority,
        category,
        startDate,
        endDate,
        limit = 50,
        page = 1,
      } = req.query;

      const query = {};

      // Filter by status
      if (status) {
        query.status = status;
      }

      // Filter by priority
      if (priority) {
        query.priority = priority;
      }

      // Filter by category
      if (category) {
        query.category = category;
      }

      // Filter by date range
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
          query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          query.createdAt.$lte = new Date(endDate);
        }
      }

      const skip = (page - 1) * limit;

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1, priority: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("user", "name email");

      const total = await Notification.countDocuments(query);

      res.json({
        notifications,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          limit,
        },
      });
    } catch (error) {
      console.error("Error fetching admin notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  }
);

// Mark notifications as read
app.put(
  "/api/admin/notifications/read",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { notificationIds } = req.body;

      await Notification.updateMany(
        { _id: { $in: notificationIds } },
        { $set: { status: "read", readAt: new Date() } }
      );

      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      res.status(500).json({ error: "Failed to update notifications" });
    }
  }
);

// Delete notifications
app.delete(
  "/api/admin/notifications",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { notificationIds } = req.body;

      await Notification.deleteMany({ _id: { $in: notificationIds } });

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting notifications:", error);
      res.status(500).json({ error: "Failed to delete notifications" });
    }
  }
);

// Example usage in existing endpoints:

// When a report is updated
app.put(
  "/api/admin/reports/:id/status",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const report = await Report.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      ).populate("reportedBy", "name email");

      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      // Create notification with enhanced options
      await createNotification(
        "report_update",
        "Report Status Updated",
        `Report #${report._id} has been marked as ${status}`,
        `/reports/${report._id}`,
        report.reportedBy?._id,
        {
          priority: status === "resolved" ? "normal" : "high",
          category: "report",
          metadata: {
            reportId: report._id,
            previousStatus: report.status,
            newStatus: status,
          },
        }
      );

      res.json(report);
    } catch (error) {
      console.error("Error updating report status:", error);
      res.status(500).json({ error: "Failed to update report status" });
    }
  }
);
