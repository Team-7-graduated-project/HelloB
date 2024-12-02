const express = require("express");
const app = express();
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const multer = require("multer");
const imageDownloader = require("image-downloader");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();
const crypto = require("crypto");
const axios = require("axios");
const cloudinary = require("cloudinary").v2;
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const nodemailer = require("nodemailer");
// Add after other imports
const WebSocket = require("ws");
const url = require("url");

// Add this import at the top with other imports
const momoPayment = require("./services/momoPayment");

// Create HTTP server
const server = require("http").createServer(app);

// Create WebSocket server attached to HTTP server (change this line)
const wss = new WebSocket.Server({ server }); // Changed from { server: app.listen(3000) }

// Store active connections
const clients = new Map();
// Models
const PaymentOption = require("./models/PaymentOption");
const Voucher = require("./models/Voucher.js");
const Review = require("./models/Review");
const Place = require("./models/Place.js");
const User = require("./models/User.js");
const Booking = require("./models/Booking.js");
const Notification = require("./models/Notification");
const jwtSecret = process.env.JWT_SECRET;
const Report = require("./models/Report");
const Announcement = require("./models/Announcement");

// Add after existing imports
const Chat = mongoose.model("Chat", {
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  messages: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      content: String,
      timestamp: { type: Date, default: Date.now },
      read: { type: Boolean, default: false },
    },
  ],
});

// Middleware setup
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"],
  })
);
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Add security headers middleware
app.use((req, res, next) => {
  // Remove COOP header or set it to same-origin-allow-popups
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");

  // Add other security headers
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");

  next();
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

const authenticateToken = (req, res, next) => {
  // Check for token in cookies or Authorization header
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const verified = jwt.verify(token, jwtSecret);
    req.userData = verified; // Attach the verified user data to the request
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    res.status(401).json({ error: "Invalid token", details: error.message });
  }
};

// Role-based authorization middleware
function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    const { role } = req.userData;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
}

// Routes

// Test route
app.get("/test", (req, res) => {
  res.json("test ok");
});

// Register route for user
app.post("/register", async (req, res) => {
  const {
    name,
    email,
    password,
    confirmPassword,
    phone,
    role = "user",
  } = req.body;

  try {
    // Validate phone number format
    const cleanPhone = phone.replace(/\D/g, "");
    if (!validatePhoneNumber(cleanPhone)) {
      return res.status(400).json({
        error: { phone: "Phone number must be exactly 10 digits" },
      });
    }

    // Check for existing phone
    const existingPhone = await User.findOne({ phone: cleanPhone });
    if (existingPhone) {
      return res.status(422).json({
        error: { phone: "This phone number is already registered" },
      });
    }

    // Check for existing email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(422).json({
        error: { email: "This email is already registered" },
      });
    }

    // Check password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        error: { confirmPassword: "Passwords do not match" },
      });
    }

    // Create user with email verification fields
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
      phone: cleanPhone,
      role,
      emailVerified: false,
      emailVerificationToken: crypto.randomBytes(32).toString("hex"),
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    // Send verification email
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${userDoc.emailVerificationToken}`;
    await transporter.sendMail({
      from: {
        name: "HelloB",
        address: process.env.EMAIL_USER,
      },
      to: userDoc.email,
      subject: "Verify Your Email - HelloB",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Welcome to HelloB!</h1>
          <p>Hi ${userDoc.name},</p>
          <p>Please verify your email address to complete your registration:</p>
          <a href="${verificationUrl}" 
             style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; 
                    color: white; text-decoration: none; border-radius: 5px;">
            Verify Email
          </a>
          <p>Or copy and paste this link in your browser:</p>
          <p>${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
        </div>
      `,
    });

    await createNotification(
      "admin",
      "New User Registration",
      `New user registered: ${userDoc.name}`,
      `/admin/users/${userDoc._id}`
    );

    res.json({
      success: true,
      message:
        "Registration successful. Please check your email to verify your account.",
    });
  } catch (e) {
    if (e.code === 11000) {
      if (e.keyPattern.email) {
        return res.status(422).json({
          error: { email: "This email is already registered" },
        });
      }
      if (e.keyPattern.phone) {
        return res.status(422).json({
          error: { phone: "This phone number is already registered" },
        });
      }
      if (e.keyPattern.name) {
        return res.status(422).json({
          error: { name: "This username is already taken" },
        });
      }
    }
    console.error("Registration error:", e);
    res.status(422).json({ error: e.message });
  }
});

// Register route for hosts

// Login route
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Debug logging
    console.log("Login attempt for email:", email);

    const user = await User.findOne({ email });

    // If no user found
    if (!user) {
      console.log("No user found with email:", email);
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log("User account is deactivated:", email);
      return res.status(401).json({
        error: "Account is deactivated",
        isActive: false,
        reason: user.reason || "Account has been deactivated",
      });
    }

    // Verify password
    const passOK = bcrypt.compareSync(password, user.password);
    if (!passOK) {
      console.log("Invalid password for user:", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        name: user.name,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: "1h" }
    );

    // Send response with cookie
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })
      .json({
        user: {
          ...user.toObject(),
          password: undefined, // Don't send password back
        },
        token,
      });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed. Please try again later." });
  }
});
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ error: "No account with that email exists" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Send email
    await transporter.sendMail({
      from: {
        name: "HelloB",
        address: process.env.EMAIL_USER,
      },
      to: user.email,
      subject: "Password Reset Request - HelloB",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Password Reset Request</h1>
          <p>Hi ${user.name},</p>
          <p>You requested to reset your password. Click the button below to reset it:</p>
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; 
                    color: white; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
          <p>Or copy and paste this link in your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this reset, please ignore this email.</p>
        </div>
      `,
    });

    res.json({
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      error: "Failed to process password reset request",
    });
  }
});

// Reset Password route
app.post("/reset-password/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      passwordResetToken: req.params.token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        error: "Password reset token is invalid or has expired",
      });
    }

    // Set new password
    user.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Send confirmation email
    await transporter.sendMail({
      from: {
        name: "HelloB",
        address: process.env.EMAIL_USER,
      },
      to: user.email,
      subject: "Password Reset Successful - HelloB",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Password Reset Successful</h1>
          <p>Hi ${user.name},</p>
          <p>Your password has been successfully reset.</p>
          <p>If you didn't make this change, please contact our support team immediately.</p>
        </div>
      `,
    });

    res.json({
      message:
        "Password has been reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      error: "Failed to reset password",
    });
  }
});

// Profile route
app.get("/profile", authenticateToken, async (req, res) => {
  try {
    // Since the token is verified in the middleware, you can directly use req.userData
    const userDoc = await User.findById(req.userData.id).select("-password").exec();

    if (!userDoc) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(userDoc); // Send the user data as a response
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/update-profile", authenticateToken, async (req, res) => {
  const { name, email, phone } = req.body;

  try {
    // Find user first
    const user = await User.findById(req.userData.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        error: {
          general: "Name and email are required",
        },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: {
          email: "Invalid email format",
        },
      });
    }

    // Only check for existing email if it's different from current
    if (email !== user.email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: req.userData.id },
      });

      if (existingUser) {
        return res.status(400).json({
          error: {
            email: "This email is already in use",
          },
        });
      }
    }

    // Validate phone if provided
    if (phone) {
      const phoneRegex = /^(\+\d{1,3}\s?)?\d{8,}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
        return res.status(400).json({
          error: {
            phone: "Invalid phone number format",
          },
        });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.userData.id,
      {
        name,
        email,
        phone,
        // Reset email verification if email changed
        ...(email !== user.email
          ? {
              emailVerified: false,
              emailVerificationToken: crypto.randomBytes(32).toString("hex"),
              emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
            }
          : {}),
      },
      { new: true }
    );

    // If email changed, send new verification email
    if (email !== user.email) {
      const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${updatedUser.emailVerificationToken}`;
      await transporter.sendMail({
        from: {
          name: "HelloB",
          address: process.env.EMAIL_USER,
        },
        to: updatedUser.email,
        subject: "Verify Your New Email - HelloB",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Email Verification Required</h1>
            <p>Hi ${updatedUser.name},</p>
            <p>Please verify your new email address:</p>
            <a href="${verificationUrl}" 
               style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; 
                      color: white; text-decoration: none; border-radius: 5px;">
              Verify Email
            </a>
            <p>Or copy and paste this link in your browser:</p>
            <p>${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
          </div>
        `,
      });
    }

    res.json({
      success: true,
      message:
        email !== user.email
          ? "Profile updated successfully. Please verify your new email address."
          : "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      error: {
        general: "Failed to update profile",
      },
    });
  }
});

// Logout route
app.post("/logout", (req, res) => {
  res
    .cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })
    .json({ message: "Logged out successfully" });
});

// Upload by link route
app.post("/upload-by-link", authenticateToken, async (req, res) => {
  const { link } = req.body;

  try {
    const result = await cloudinary.uploader.upload(link, {
      folder: "apartments",
      use_filename: true,
      unique_filename: true,
    });

    res.json(result.secure_url);
  } catch (error) {
    res.status(500).json({ error: "Image upload failed" });
  }
});

// File uploads route
const photosMiddleware = multer({ dest: "uploads/" });
app.post(
  "/uploads",
  authenticateToken,
  photosMiddleware.array("photos", 100),
  async (req, res) => {
    const uploadedFiles = [];
    try {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "apartments",
          use_filename: true,
          unique_filename: true,
        });

        uploadedFiles.push(result.secure_url);
        fs.unlinkSync(file.path);
      }
      res.json(uploadedFiles);
    } catch (error) {
      // Clean up any remaining files
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

// Voucher Routes

// Get all available vouchers for users
app.get("/vouchers", async (req, res) => {
  try {
    const { filter } = req.query;
    // Get token from request if it exists
    const token = req.cookies.token;
    let userId = null;

    // If token exists, verify it to get userId
    if (token) {
      try {
        const verified = jwt.verify(token, jwtSecret);
        userId = verified.id;
      } catch (error) {
        console.log("Invalid token, continuing as guest");
      }
    }

    let query = {
      isDeleted: false,
      active: true,
    };

    // If filtering for claimed vouchers and user is logged in
    if (filter === "claimed" && userId) {
      query["claims.userId"] = userId;
    }

    const vouchers = await Voucher.find(query)
      .populate("claims.userId", "_id name")
      .populate("applicablePlaces", "title")
      .sort({ createdAt: -1 });

    // Add claimed status for each voucher
    const vouchersWithStatus = vouchers.map((voucher) => {
      const voucherObj = voucher.toObject({ virtuals: true });
      voucherObj.isClaimed = userId ? voucher.isClaimedByUser(userId) : false;
      voucherObj.requiresLogin = !userId;
      return voucherObj;
    });

    res.json(vouchersWithStatus);
  } catch (error) {
    console.error("Error fetching vouchers:", error);
    res.status(500).json({ error: "Failed to fetch vouchers" });
  }
});

// Get available vouchers for a specific booking
app.get(
  "/vouchers/available/:bookingId",
  authenticateToken,
  async (req, res) => {
    try {
      const { bookingId } = req.params;
      const userId = req.userData.id;

      // Get booking details to check place
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // Find valid vouchers
      const vouchers = await Voucher.find({
        active: true,
        expirationDate: { $gt: new Date() },
        $or: [
          { applicablePlaces: booking.place },
          { applicablePlaces: { $size: 0 } },
        ],
      })
        .populate("claims.userId")
        .populate("usedBy.userId")
        .populate("applicablePlaces", "title");

      // Format and filter vouchers
      const availableVouchers = vouchers
        .filter((voucher) => voucher.usedCount < voucher.usageLimit)
        .map((voucher) => {
          const hasUsed = voucher.usedBy?.some(
            (use) => use.userId._id.toString() === userId.toString()
          );
          const hasClaimed = voucher.claims?.some(
            (claim) => claim.userId._id.toString() === userId.toString()
          );

          return {
            _id: voucher._id,
            code: voucher.code,
            discount: voucher.discount,
            description: voucher.description,
            expirationDate: voucher.expirationDate,
            applicablePlaces: voucher.applicablePlaces,
            usageLimit: voucher.usageLimit,
            usedCount: voucher.usedCount,
            claimed: hasClaimed,
            used: hasUsed,
            canUse: hasClaimed && !hasUsed,
          };
        });

      res.json(availableVouchers);
    } catch (error) {
      console.error("Error fetching available vouchers:", error);
      res.status(500).json({
        error: "Failed to fetch available vouchers",
        details: error.message,
      });
    }
  }
);
app.post("/vouchers/validate", authenticateToken, async (req, res) => {
  try {
    const { voucherCode, bookingId } = req.body;
    const userId = req.userData.id;

    // Find the voucher
    const voucher = await Voucher.findOne({ code: voucherCode });
    if (!voucher) {
      return res.status(404).json({ error: "Voucher not found" });
    }

    // Get booking details to check place
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    // Validate voucher
    if (!voucher.active) {
      return res.status(400).json({ error: "Voucher is not active" });
    }

    if (voucher.expirationDate < new Date()) {
      return res.status(400).json({ error: "Voucher has expired" });
    }

    if (voucher.usedCount >= voucher.usageLimit) {
      return res.status(400).json({ error: "Voucher usage limit reached" });
    }

    // Check if user has claimed this voucher
    const hasClaimed = voucher.claims?.some(
      (claim) => claim.userId.toString() === userId.toString()
    );
    if (!hasClaimed) {
      return res
        .status(400)
        .json({ error: "You need to claim this voucher first" });
    }

    // Check if voucher is applicable for this place
    const isApplicable =
      voucher.applicablePlaces.length === 0 ||
      voucher.applicablePlaces.includes(booking.place);
    if (!isApplicable) {
      return res
        .status(400)
        .json({ error: "Voucher not applicable for this booking" });
    }

    // Check if voucher has already been used by this user
    const hasUsed = voucher.usedBy?.some(
      (use) => use.userId.toString() === userId.toString()
    );
    if (hasUsed) {
      return res
        .status(400)
        .json({ error: "You have already used this voucher" });
    }

    res.json({
      valid: true,
      discount: voucher.discount,
      description: voucher.description,
    });
  } catch (error) {
    console.error("Error validating voucher:", error);
    res.status(500).json({ error: "Failed to validate voucher" });
  }
});

// Update the claim voucher endpoint
app.post("/vouchers/:id/claim", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userData.id;

    // Find the voucher and populate necessary fields
    const voucher = await Voucher.findById(id);

    if (!voucher) {
      return res.status(404).json({ error: "Voucher not found" });
    }

    // Check if user has already claimed this voucher
    if (voucher.isClaimedByUser(userId)) {
      return res.status(400).json({
        error: "You have already claimed this voucher",
        alreadyClaimed: true,
      });
    }

    // Add the claim
    voucher.claims.push({
      userId,
      claimedAt: new Date(),
    });

    await voucher.save();

    // Return the updated voucher info
    res.json({
      success: true,
      message: "Voucher claimed successfully",
      voucher: {
        _id: voucher._id,
        code: voucher.code,
        discount: voucher.discount,
        description: voucher.description,
        expirationDate: voucher.expirationDate,
        claims: voucher.claims,
        isClaimed: true,
      },
    });
  } catch (error) {
    console.error("Server error while claiming voucher:", error);
    res.status(500).json({ error: "Failed to claim voucher" });
  }
});

// Validate voucher for use
app.post("/vouchers/validate", authenticateToken, async (req, res) => {
  try {
    const { voucherCode, bookingId } = req.body;
    const userId = req.userData.id;

    const voucher = await Voucher.findOne({ code: voucherCode })
      .populate("claims.userId")
      .populate("usedBy.userId");

    if (!voucher) {
      return res.status(404).json({ error: "Voucher not found" });
    }

    // Validate voucher
    if (!voucher.active) {
      return res.status(400).json({ error: "Voucher is not active" });
    }

    if (voucher.expirationDate < new Date()) {
      return res.status(400).json({ error: "Voucher has expired" });
    }

    if (voucher.usedCount >= voucher.usageLimit) {
      return res.status(400).json({ error: "Voucher usage limit reached" });
    }

    // Check if claimed
    const hasClaimed = voucher.claims?.some(
      (claim) => claim.userId._id.toString() === userId.toString()
    );

    if (!hasClaimed) {
      return res.status(400).json({
        error: "You need to claim this voucher first",
        needsClaim: true,
      });
    }

    // Check if already used
    const hasUsed = voucher.usedBy?.some(
      (use) => use.userId._id.toString() === userId.toString()
    );

    if (hasUsed) {
      return res
        .status(400)
        .json({ error: "You have already used this voucher" });
    }

    res.json({
      valid: true,
      discount: voucher.discount,
      description: voucher.description,
      claimed: true,
    });
  } catch (error) {
    console.error("Error validating voucher:", error);
    res.status(500).json({ error: "Failed to validate voucher" });
  }
});

// Claim a voucher
app.post("/vouchers/:id/claim", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userData.id;

    // Find the voucher and populate necessary fields
    const voucher = await Voucher.findById(id);

    if (!voucher) {
      return res.status(404).json({ error: "Voucher not found" });
    }

    // Check if user has already claimed this voucher
    if (voucher.isClaimedByUser(userId)) {
      return res.status(400).json({
        error: "You have already claimed this voucher",
        alreadyClaimed: true,
      });
    }

    // Add the claim
    voucher.claims.push({
      userId,
      claimedAt: new Date(),
    });

    await voucher.save();

    // Return the updated voucher info
    res.json({
      success: true,
      message: "Voucher claimed successfully",
      voucher: {
        _id: voucher._id,
        code: voucher.code,
        discount: voucher.discount,
        description: voucher.description,
        expirationDate: voucher.expirationDate,
        claims: voucher.claims,
        isClaimed: true,
      },
    });
  } catch (error) {
    console.error("Server error while claiming voucher:", error);
    res.status(500).json({ error: "Failed to claim voucher" });
  }
});

// Host voucher management routes
app.post(
  "/host/vouchers",
  authenticateToken,
  authorizeRole("host"),
  async (req, res) => {
    try {
      const { code, discount, description, expirationDate, applicablePlaces } =
        req.body;

      if (applicablePlaces?.length > 0) {
        const places = await Place.find({
          _id: { $in: applicablePlaces },
          owner: req.userData.id,
        });

        if (places.length !== applicablePlaces.length) {
          return res.status(400).json({ error: "Invalid places selected" });
        }
      }

      const voucher = await Voucher.create({
        owner: req.userData.id,
        code,
        discount,
        description,
        expirationDate,
        applicablePlaces,
      });

      const populatedVoucher = await Voucher.findById(voucher._id)
        .populate("applicablePlaces", "title")
        .populate("owner", "name");

      res.status(201).json(populatedVoucher);
    } catch (error) {
      console.error("Error creating voucher:", error);
      res.status(500).json({ error: "Failed to create voucher" });
    }
  }
);

// Get host's vouchers
app.get(
  "/host/vouchers",
  authenticateToken,
  authorizeRole("host"),
  async (req, res) => {
    try {
      const vouchers = await Voucher.find({ owner: req.userData.id })
        .populate("applicablePlaces", "title")
        .sort({ createdAt: -1 });

      res.json(vouchers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vouchers" });
    }
  }
);

// Update host's voucher
app.put(
  "/host/vouchers/:id",
  authenticateToken,
  authorizeRole("host"),
  async (req, res) => {
    try {
      const voucher = await Voucher.findOneAndUpdate(
        { _id: req.params.id, owner: req.userData.id },
        { ...req.body, owner: req.userData.id },
        { new: true, runValidators: true }
      );

      if (!voucher) {
        return res
          .status(404)
          .json({ error: "Voucher not found or you don't have permission" });
      }

      res.json(voucher);
    } catch (error) {
      res.status(500).json({ error: "Failed to update voucher" });
    }
  }
);

// Delete host's voucher
app.delete(
  "/host/vouchers/:id",
  authenticateToken,
  authorizeRole("host"),
  async (req, res) => {
    try {
      const voucher = await Voucher.findOneAndDelete({
        _id: req.params.id,
        owner: req.userData.id,
      });

      if (!voucher) {
        return res
          .status(404)
          .json({ error: "Voucher not found or you don't have permission" });
      }

      res.json({ message: "Voucher deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete voucher" });
    }
  }
);

// Add new place route with authentication
app.post(
  "/host/places",
  authenticateToken,
  authorizeRole("host"),
  async (req, res) => {
    try {
      const {
        title,
        address,
        photos,
        description,
        perks,
        extra_info,
        check_in,
        check_out,
        price,
        max_guests,
        property_type,
        bedrooms,
        beds,
        bathrooms,
        status,
        house_rules,
        cancellation_policy,
        minimum_stay,
        location,
        amenities_description,
      } = req.body;

      // Create new place
      const place = await Place.create({
        owner: req.userData.id,
        title,
        address,
        photos,
        description,
        perks,
        extra_info,
        check_in,
        check_out,
        price,
        max_guests,
        property_type,
        bedrooms,
        beds,
        bathrooms,
        status,
        house_rules,
        cancellation_policy,
        minimum_stay,
        location: {
          type: "Point",
          coordinates: location.coordinates || [0, 0],
        },
        amenities_description,
      });

      await createNotification(
        "place",
        "New Place Added",
        `${req.userData.name} added a new place: ${place.title}`,
        `/admin/places/${place._id}`
      );

      res.status(201).json(place);
    } catch (error) {
      console.error("Error creating place:", error);
      res.status(400).json({
        error: "Failed to create place",
        message: error.message,
      });
    }
  }
);

// Update an existing place
app.put(
  "/host/places/:id",
  authenticateToken,
  authorizeRole("host"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        title,
        address,
        photos,
        description,
        perks,
        extra_info,
        check_in,
        check_out,
        price,
        max_guests,
        property_type,
        bedrooms,
        beds,
        bathrooms,
        status,
        house_rules,
        cancellation_policy,
        minimum_stay,
        location,
        amenities_description,
      } = req.body;

      // Find place and verify ownership
      const place = await Place.findById(id);
      if (!place) {
        return res.status(404).json({ error: "Place not found" });
      }

      if (place.owner.toString() !== req.userData.id) {
        return res
          .status(403)
          .json({ error: "Not authorized to update this place" });
      }

      // Update place
      const updatedPlace = await Place.findByIdAndUpdate(
        id,
        {
          title,
          address,
          photos,
          description,
          perks,
          extra_info,
          check_in,
          check_out,
          price,
          max_guests,
          property_type,
          bedrooms,
          beds,
          bathrooms,
          status,
          house_rules,
          cancellation_policy,
          minimum_stay,
          location: {
            type: "Point",
            coordinates: location.coordinates || [0, 0],
          },
          amenities_description,
        },
        { new: true, runValidators: true }
      );

      res.json(updatedPlace);
    } catch (error) {
      console.error("Error updating place:", error);
      res.status(400).json({
        error: "Failed to update place",
        message: error.message,
      });
    }
  }
);

// Get place by ID for editing
app.get(
  "/host/places/:id",
  authenticateToken,
  authorizeRole("host"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const place = await Place.findById(id);

      if (!place) {
        return res.status(404).json({ error: "Place not found" });
      }

      if (place.owner.toString() !== req.userData.id) {
        return res
          .status(403)
          .json({ error: "Not authorized to view this place" });
      }

      res.json(place);
    } catch (error) {
      console.error("Error fetching place:", error);
      res.status(500).json({
        error: "Failed to fetch place",
        message: error.message,
      });
    }
  }
);

// Get all places for a host
app.get(
  "/host/places",
  authenticateToken,
  authorizeRole("host"),
  async (req, res) => {
    try {
      const places = await Place.find({ owner: req.userData.id });
      res.json(places);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve places" });
    }
  }
);

// Get user's places route
app.get("/host/user-places", authenticateToken, async (req, res) => {
  try {
    const places = await Place.find({ owner: req.userData.id });
    res.json(places);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve places" });
  }
});

// Get a specific place by ID
app.get("/places/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const place = await Place.findById(id)
      .populate({
        path: "owner",
        select: "name email photo phone createdAt avatar languages", // Select the fields you want
      })
      .populate("reviews");

    if (!place) {
      return res.status(404).json({ error: "Place not found" });
    }

    res.json(place);
  } catch (error) {
    console.error("Error fetching place:", error);
    res.status(500).json({ error: "Failed to fetch place details" });
  }
});
app.post("/api/host/announcements", authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday
    const currentDate = today.getDate();

    // Only allow announcements on Sundays or the 1st of each month
    if (currentDay !== 0 && currentDate !== 1) {
      return res.status(403).json({
        error: "Not allowed",
        details:
          "Announcements can only be created on Sundays or the 1st of each month",
      });
    }

    const { type, period, metrics } = req.body;
    const hostId = req.userData._id;

    // Check if announcement already exists for this period
    const existingAnnouncement = await Announcement.findOne({
      host: hostId,
      "period.startDate": new Date(period.startDate),
      "period.endDate": new Date(period.endDate),
    });

    if (existingAnnouncement) {
      return res.status(400).json({
        error: "An announcement for this period already exists",
      });
    }

    const announcement = await Announcement.create({
      host: hostId,
      type,
      period: {
        startDate: new Date(period.startDate),
        endDate: new Date(period.endDate),
      },
      metrics,
      status: "pending",
    });

    res.status(201).json(announcement);
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({
      error: "Failed to create announcement",
      details: error.message,
    });
  }
});

// Get host metrics for a specific period
app.get("/api/host/metrics", authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const hostId = req.userData._id;

    // First get all places owned by this host
    const hostPlaces = await Place.find({ owner: hostId });

    if (!hostPlaces.length) {
      return res.json({
        totalBookings: 0,
        totalRevenue: 0,
        completedBookings: 0,
        cancelledBookings: 0,
      });
    }

    const placeIds = hostPlaces.map((place) => place._id);

    // Find bookings for these places
    const bookings = await Booking.find({
      place: { $in: placeIds },
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    });

    const metrics = {
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce(
        (sum, booking) => sum + (Number(booking.price) || 0),
        0
      ),
      completedBookings: bookings.filter((b) => b.status === "completed")
        .length,
      cancelledBookings: bookings.filter((b) => b.status === "cancelled")
        .length,
    };

    res.json(metrics);
  } catch (error) {
    console.error("Detailed error in metrics endpoint:", {
      message: error.message,
      stack: error.stack,
      userData: req.userData,
      query: req.query,
    });
    res.status(500).json({
      error: "Failed to fetch metrics",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get host announcements
app.get("/api/host/announcements", authenticateToken, async (req, res) => {
  try {
    const hostId = req.userData._id;

    const announcements = await Announcement.find({ host: hostId }).sort(
      "-createdAt"
    );

    res.json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", {
      message: error.message,
      stack: error.stack,
      userData: req.userData,
    });
    res.status(500).json({
      error: "Failed to fetch announcements",
      details: error.message,
    });
  }
});

app.delete("/places/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const place = await Place.findById(id);
  if (!place) {
    return res.status(404).json({ error: "Place not found" });
  }
  if (
    place.owner.toString() !== req.userData.id &&
    req.userData.role !== "admin"
  ) {
    return res
      .status(403)
      .json({ error: "You are not authorized to delete this place" });
  }
  try {
    await Place.findByIdAndDelete(id);
    res.status(200).json({ message: "Place deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete place" });
  }
});

// Route accessible to both 'host' and 'admin' roles
app.post(
  "/host/places",
  authenticateToken,
  authorizeRole("host", "admin"),
  async (req, res) => {
    const { title, address, description, perks, price } = req.body;

    try {
      const placeDoc = await Place.create({
        owner: req.userData.id,
        title,
        address,
        description,
        perks,
        price,
      });
      res.json(placeDoc);
    } catch (error) {
      res.status(500).json({ error: "Failed to create place" });
    }
  }
);

// Update a place with authentication
app.put("/host/places/:id", authenticateToken, async (req, res) => {
  const { id } = req.params; // Ensure you're using `req.params.id`
  const {
    title,
    address,
    addedPhotos,
    description,
    perks,
    extra_info,
    check_in,
    check_out,
    price,
    max_guests,
  } = req.body;

  try {
    const placeDoc = await Place.findById(id); // Ensure this returns the correct document
    if (req.userData.id !== placeDoc.owner.toString())
      return res.status(403).json({ error: "Unauthorized" });

    placeDoc.set({
      title,
      address,
      photos: addedPhotos,
      description,
      perks,
      extra_info,
      check_in,
      check_out,
      price,
      max_guests,
    });

    await placeDoc.save();
    res.json("ok");
  } catch (error) {
    res.status(500).json({ error: "Failed to update place" });
  }
});

// Get all places
app.get("/places", async (req, res) => {
  try {
    const places = await Place.find({
      isActive: true,
      status: "active",
    }).populate("owner");
    res.json(places);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve places" });
  }
});

// Get bookings for a specific place (accessible by host)
app.get("/places/:id/bookings", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    // Check if the user is the owner of the place
    const place = await Place.findById(id);
    if (!place) return res.status(404).json({ error: "Place not found" });

    if (place.owner.toString() !== req.userData.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const bookings = await Booking.find({ place: id }).populate("user", "name");
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve bookings" });
  }
});

// Add this function to check availability

// Modify your booking creation endpoint
app.post("/bookings", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or host
    if (req.userData.role === "admin" || req.userData.role === "host") {
      return res.status(403).json({
        error: "Administrators and hosts are not allowed to make bookings",
      });
    }

    const {
      place: placeId,
      check_in,
      check_out,
      max_guests,
      name,
      phone,
      price,
    } = req.body;

    // Check if user is trying to book their own place
    const place = await Place.findById(placeId);
    if (!place) {
      return res.status(404).json({ error: "Place not found" });
    }

    if (place.owner.toString() === req.userData.id) {
      return res.status(403).json({
        error: "You cannot book your own property",
      });
    }

    // Rest of your existing booking creation code
    const booking = await Booking.create({
      place: placeId,
      user: req.userData.id,
      check_in,
      check_out,
      max_guests,
      name,
      phone,
      price,
      status: "confirmed",
    });

    // Notify host about new booking
    await createNotification(
      "new_booking",
      "New Booking Received",
      `New booking for ${place.title} from ${req.userData.name}`,
      `/host/bookings/${booking._id}`,
      place.owner
    );

    // Notify user about booking confirmation
    await createNotification(
      "booking_confirmed",
      "Booking Confirmed",
      `Your booking for ${place.title} has been confirmed`,
      `/account/bookings/${booking._id}`,
      req.userData.id
    );

    res.json(booking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "Could not create booking" });
  }
});

// Add a new endpoint to check availability
app.get("/places/:id/availability", async (req, res) => {
  const { id } = req.params;
  const { start, end } = req.query;

  try {
    const bookings = await Booking.find({
      place: id,
      status: { $ne: "cancelled" },
      $or: [
        {
          check_in: { $lte: end },
          check_out: { $gte: start },
        },
      ],
    }).select("check_in check_out");

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get bookings for the authenticated user
app.get("/bookings", authenticateToken, async (req, res) => {
  try {
    const userId = req.userData.id;
    const bookings = await Booking.find({ user: userId })
      .populate("place")
      .sort({ createdAt: -1 }); // Sort by newest first

    // Process bookings to ensure they have a status
    const processedBookings = bookings.map((booking) => ({
      ...booking.toObject(),
      status: booking.status || "confirmed",
    }));

    res.json(processedBookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});
// Cancel booking route
app.delete("/bookings/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.user.toString() !== req.userData.id) {
      return res
        .status(403)
        .json({ error: "Unauthorized to cancel this booking" });
    }
    await Booking.findByIdAndDelete(id);
    res.json({ success: "Booking cancelled successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to cancel booking" });
  }
});

// Get reviews for a specific place
app.get("/places/:id/reviews", async (req, res) => {
  const { id } = req.params;

  try {
    const reviews = await Review.find({ place: id, isActive: true })
      .populate({
        path: "user",
        select: "name photo createdAt",
      })
      .sort({ createdAt: -1 });

    // Format the reviews to match the frontend expectations
    const formattedReviews = reviews.map((review) => ({
      _id: review._id,
      rating: review.rating,
      review_text: review.review_text,
      createdAt: review.createdAt,
      user: {
        name: review.user.name,
        photo: review.user.photo,
      },
      // Add category ratings if they exist
      cleanliness: review.cleanliness || 0,
      communication: review.communication || 0,
      checkIn: review.checkIn || 0,
      accuracy: review.accuracy || 0,
      location: review.location || 0,
      value: review.value || 0,
    }));

    res.status(200).json(formattedReviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      error: "Failed to fetch reviews",
      details: error.message,
    });
  }
});
app.post("/reviews", authenticateToken, async (req, res) => {
  const { placeId, rating, reviewText } = req.body;
  if (!rating || !reviewText) {
    return res
      .status(400)
      .json({ error: "Rating and review text are required" });
  }
  try {
    const newReview = new Review({
      user: req.userData.id,
      place: placeId,
      rating,
      review_text: reviewText,
      created_at: new Date(),
    });
    await newReview.save();
    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ error: "Error creating review" });
  }
});

// Get all users (Admin only)

// Route to get all bookings for the host's places
app.get(
  "/host/bookings",
  authenticateToken,
  authorizeRole("host", "admin"),
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const skip = (page - 1) * limit;

      const places = await Place.find({ owner: req.userData.id });
      const placeIds = places.map((place) => place._id);

      const totalBookings = await Booking.countDocuments({
        place: { $in: placeIds },
      });

      const bookings = await Booking.find({ place: { $in: placeIds } })
        .populate("place", "title")
        .populate("user", "name")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      res.json({
        bookings,
        totalPages: Math.ceil(totalBookings / limit),
        currentPage: page,
        totalItems: totalBookings,
      });
    } catch (error) {
      console.error("Failed to fetch host bookings:", error);
      res.status(500).json({ error: "Failed to retrieve bookings" });
    }
  }
);
app.get(
  "/host/places",
  authenticateToken,
  authorizeRole("host"),
  async (req, res) => {
    try {
      const places = await Place.find({ owner: req.userData.id });
      res.json(places);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve places" });
    }
  }
);
app.get(
  "/host/users",
  authenticateToken,
  authorizeRole("host"),
  async (req, res) => {
    try {
      const users = await User.find({ role: "user" });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve users" });
    }
  }
);

// Get all reviews for the host's places (Admin or Host)
app.get(
  "/host/reviews",
  authenticateToken,
  authorizeRole("host", "admin"),
  async (req, res) => {
    try {
      const places = await Place.find({ owner: req.userData.id });
      const placeIds = places.map((place) => place._id);

      const reviews = await Review.find({ place: { $in: placeIds } })
        .populate("user", "name")
        .populate("place", "title");
      res.json(reviews);
    } catch (error) {
      console.error("Failed to fetch host reviews:", error);
      res.status(500).json({ error: "Failed to retrieve reviews" });
    }
  }
);
app.post("/host/register", async (req, res) => {
  const { name, email, password, repassword, phone } = req.body;

  try {
    // Validate phone number format
    const cleanPhone = phone.replace(/\D/g, "");
    if (!validatePhoneNumber(cleanPhone)) {
      return res.status(400).json({
        error: { phone: "Phone number must be exactly 10 digits" },
      });
    }

    // Check for existing phone
    const existingPhone = await User.findOne({ phone: cleanPhone });
    if (existingPhone) {
      return res.status(422).json({
        error: { phone: "This phone number is already registered" },
      });
    }

    // Check for existing email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(422).json({
        error: { email: "This email is already registered" },
      });
    }

    // Check password match
    if (password !== repassword) {
      return res.status(400).json({
        error: { repassword: "Passwords do not match" },
      });
    }

    // Create host user
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
      phone: cleanPhone, // Save cleaned phone number
      role: "host",
    });

    await createNotification(
      "admin",
      "New Host Registration",
      `New host registered: ${userDoc.name}`,
      `/admin/hosts/${userDoc._id}`
    );

    res.json({ success: true, message: "Host registration successful" });
  } catch (e) {
    if (e.code === 11000) {
      if (e.keyPattern.email) {
        return res.status(422).json({
          error: { email: "This email is already registered" },
        });
      }
      if (e.keyPattern.phone) {
        return res.status(422).json({
          error: { phone: "This phone number is already registered" },
        });
      }
      if (e.keyPattern.name) {
        return res.status(422).json({
          error: { name: "This username is already taken" },
        });
      }
    }
    res.status(422).json({ error: e.message });
  }
});
app.get("/places/:id/host-places", async (req, res) => {
  try {
    const { id } = req.params;
    const currentPlace = await Place.findById(id);

    if (!currentPlace) {
      return res.status(404).json({ error: "Place not found" });
    }

    const hostPlaces = await Place.find({
      owner: currentPlace.owner,
      _id: { $ne: id }, // Exclude current place
      isActive: true,
    })
      .limit(3)
      .select("title address photos price rating reviews")
      .exec();

    res.json(hostPlaces);
  } catch (error) {
    console.error("Error fetching host places:", error);
    res.status(500).json({ error: "Failed to fetch host places" });
  }
});

app.post("/payment-options", authenticateToken, async (req, res) => {
  try {
    const {
      bookingId,
      userId,
      amount,
      paymentMethod,
      selectedOption,
      voucherCode,
      discountAmount,
    } = req.body;

    // Validate booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Create payment record
    const paymentOption = new PaymentOption({
      booking: bookingId,
      user: userId,
      method: paymentMethod,
      amount: Number(amount),
      status: paymentMethod === "payLater" ? "pending" : "completed",
      ...(voucherCode && {
        voucherCode,
        discountAmount: Number(discountAmount),
      }),
    });

    await paymentOption.save();

    // Update booking status based on payment method
    const bookingUpdate = {
      paymentStatus: paymentMethod === "payLater" ? "pending" : "paid",
      paymentMethod: paymentMethod,
      paymentId: paymentOption._id,
      status: paymentMethod === "payLater" ? "pending" : "confirmed",
    };

    await Booking.findByIdAndUpdate(bookingId, bookingUpdate);

    // If using voucher and not paying later, update voucher usage
    if (voucherCode && paymentMethod !== "payLater") {
      await Voucher.findOneAndUpdate(
        { code: voucherCode },
        {
          $inc: { usedCount: 1 },
          $push: {
            usedBy: {
              userId: userId,
              bookingId: bookingId,
              usedAt: new Date(),
            },
          },
        }
      );
    }

    await createNotification(
      "payment",
      "Payment Received",
      `Payment of $${amount} received for booking #${bookingId}`,
      `/admin/bookings/${bookingId}`
    );

    res.status(201).json({
      success: true,
      message:
        paymentMethod === "payLater"
          ? "Pay at property option confirmed"
          : "Payment processed successfully",
      payment: {
        id: paymentOption._id,
        status: paymentOption.status,
        method: paymentOption.method,
      },
      booking: {
        id: booking._id,
        paymentStatus: bookingUpdate.paymentStatus,
        paymentMethod: bookingUpdate.paymentMethod,
      },
    });
  } catch (error) {
    console.error("Payment processing error:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: "Failed to process payment request",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});
app.post("/payment-options/momo", authenticateToken, async (req, res) => {
  try {
    const { bookingId, userId, amount } = req.body;

    // Validation checks
    if (!bookingId || !userId || !amount) {
      return res.status(400).json({
        message: "Missing required fields: bookingId, userId, or amount",
      });
    }

    // Create payment record
    const payment = await PaymentOption.create({
      booking: bookingId,
      user: userId,
      method: "momo",
      amount: amount,
      status: "pending",
    });

    try {
      // Initialize MoMo payment
      const momoResponse = await momoPayment.createPayment({
        amount: Number(amount),
        bookingId: bookingId,
        userId: userId,
      });

      if (!momoResponse || !momoResponse.payUrl) {
        throw new Error("Failed to get payment URL from MoMo");
      }

      // Update payment record with orderId
      await PaymentOption.findByIdAndUpdate(payment._id, {
        orderId: momoResponse.orderId || momoResponse.requestId,
      });

      res.json({
        data: momoResponse.payUrl,
        success: true,
      });
    } catch (momoError) {
      // Clean up payment record if MoMo request fails
      await PaymentOption.findByIdAndDelete(payment._id);
      throw momoError;
    }
  } catch (error) {
    console.error("MoMo payment error:", error);
    res.status(400).json({
      message: error.message || "Failed to process MoMo payment",
      success: false,
    });
  }
});

// MoMo Payment Success Callback
app.post("/successPayment", async (req, res) => {
  try {
    const { extraData, orderId } = req.body;
    const decodedData = JSON.parse(Buffer.from(extraData, "base64").toString());

    if (orderId === decodedData.orderId && decodedData.key === "payment") {
      const payment = await PaymentOption.findOne({ orderId });
      if (!payment) {
        throw new Error("Payment not found");
      }

      payment.status = "completed";
      await payment.save();

      await Booking.findByIdAndUpdate(decodedData.bookingId, {
        paymentStatus: "paid",
        paymentMethod: "momo",
      });

      res.status(200).json({
        message: "Payment successful",
      });
    } else {
      throw new Error("Invalid transaction");
    }
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

// MoMo Payment Callback Route
app.post("/payment/momo/notify", async (req, res) => {
  try {
    const { orderId, requestId, amount, resultCode, extraData } = req.body;

    // Decode the extra data
    const decodedData = JSON.parse(
      Buffer.from(extraData, "base64").toString("utf-8")
    );

    // Update payment status
    const payment = await PaymentOption.findById(orderId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    if (resultCode === 0) {
      payment.status = "completed";
      payment.momoTransactionId = requestId;
      await payment.save();

      // Update booking status
      await Booking.findByIdAndUpdate(decodedData.bookingId, {
        paymentStatus: "paid",
        paymentMethod: "momo",
      });

      res.json({ message: "Payment processed successfully" });
    } else {
      payment.status = "failed";
      await payment.save();
      res.status(400).json({ error: "Payment failed" });
    }
  } catch (error) {
    console.error("MoMo callback error:", error);
    res.status(500).json({ error: "Failed to process payment callback" });
  }
});

// MoMo Payment notification handler
app.post("/payment/momo/notify/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const {
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      extraData,
    } = req.body;

    // Decode the extraData to get additional information
    const decodedExtraData = JSON.parse(
      Buffer.from(extraData, "base64").toString()
    );

    if (resultCode === "0") {
      // Payment successful
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: "paid",
        status: "confirmed",
        paymentId: transId,
      });

      // Redirect to the booking page with success status
      res.redirect(
        `${process.env.CLIENT_URL}/account/bookings/${bookingId}?payment=success`
      );
    } else {
      // Payment failed
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: "failed",
        status: "pending",
      });

      // Redirect to the booking page with error status
      res.redirect(
        `${process.env.CLIENT_URL}/account/bookings/${bookingId}?payment=failed`
      );
    }
  } catch (error) {
    console.error("MoMo notification error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.post("/payment-options/card", authenticateToken, async (req, res) => {
  try {
    const {
      bookingId,
      userId,
      amount,
      cardDetails,
      voucherCode,
      discountAmount,
    } = req.body;

    // Validate required fields
    if (!bookingId || !userId || !amount || !cardDetails) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    // Validate card details
    const { cardNumber, cardHolder, expiryDate, cvv } = cardDetails;

    if (!cardNumber || !cardHolder || !expiryDate || !cvv) {
      return res.status(400).json({
        message: "Invalid card details",
      });
    }

    // Basic card validation
    const cardValidation = validateCardDetails(cardDetails);
    if (!cardValidation.isValid) {
      return res.status(400).json({
        message: cardValidation.error,
      });
    }

    // Create payment record
    const payment = await PaymentOption.create({
      booking: bookingId,
      user: userId,
      method: "card",
      amount: Number(amount),
      cardDetails: {
        cardNumber,
        cardHolder,
        expiryDate,
        cvv,
      },
      status: "pending",
      ...(voucherCode && {
        voucherCode,
        discountAmount: Number(discountAmount),
      }),
    });

    // Simulate payment processing
    const isPaymentSuccessful = await processCardPayment(cardDetails, amount);

    if (isPaymentSuccessful) {
      // Update payment status
      payment.status = "completed";
      await payment.save();

      // Update booking status
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: "paid",
        paymentMethod: "card",
        status: "confirmed",
      });

      // Update voucher usage if applicable
      if (voucherCode) {
        await Voucher.findOneAndUpdate(
          { code: voucherCode },
          {
            $inc: { usedCount: 1 },
            $push: {
              usedBy: {
                userId,
                bookingId,
                usedAt: new Date(),
              },
            },
          }
        );
      }

      res.json({
        success: true,
        message: "Payment processed successfully",
        payment: {
          id: payment._id,
          status: "completed",
          method: "card",
          last4: payment.cardDetails.last4,
        },
      });
    } else {
      payment.status = "failed";
      await payment.save();
      throw new Error("Payment processing failed");
    }
  } catch (error) {
    console.error("Card payment error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to process card payment",
    });
  }
});
// Search endpoint for places
app.get("/api/places/search", async (req, res) => {
  try {
    const {
      location,
      checkIn,
      checkOut,
      guests,
      type,
      sort = "createdAt",
      page = 1,
      limit = 12,
    } = req.query;

    // Build the query object
    let query = { isActive: true };

    if (type && type !== "all") {
      query.property_type = type;
    }

    if (location) {
      query.address = { $regex: location, $options: "i" };
    }

    if (guests) {
      query.max_guests = { $gte: parseInt(guests) };
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const totalCount = await Place.countDocuments(query);

    // Determine sort order
    let sortOption = {};
    switch (sort) {
      case "price_low":
        sortOption = { price: 1 };
        break;
      case "price_high":
        sortOption = { price: -1 };
        break;
      case "rating":
        sortOption = { rating: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const places = await Place.find(query)
      .populate("owner", "name email phone photo")
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    res.json({
      places: places || [], // Ensure it's always an array
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit)),
        currentPage: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      error: "Failed to fetch places",
      details: error.message,
    });
  }
});

// Quick search endpoint for autocomplete
app.get("/api/places/quick-search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.json([]);
    }

    const query = {
      isActive: true,
      $or: [
        { title: { $regex: q, $options: "i" } },
        { address: { $regex: q, $options: "i" } },
      ],
    };

    const places = await Place.find(query)
      .select("title address photos")
      .limit(5)
      .exec();

    res.json(places);
  } catch (error) {
    console.error("Quick search error:", error);
    res.status(500).json({
      error: "Failed to fetch suggestions",
      details: error.message,
    });
  }
});

// Get place details
app.get("/api/places/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const place = await Place.findById(id)
      .populate({
        path: "owner",
        select: "name email phone createdAt avatar languages", // Select the fields you want
      })
      .populate("reviews");

    if (!place) {
      return res.status(404).json({ error: "Place not found" });
    }

    res.json(place);
  } catch (error) {
    console.error("Error fetching place:", error);
    res.status(500).json({ error: "Failed to fetch place details" });
  }
});

// MoMo Payment Route

// Get notifications
app.get("/notifications", authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark notification as read
app.put("/notifications/:id/read", authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { status: "read" },
      { new: true }
    );

    res.json(notification);
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

// Create notification helper function
const createNotification = async (
  type,
  title,
  message,
  link = "",
  userId = null
) => {
  try {
    const notification = new Notification({
      type,
      title,
      message,
      link,
      user: userId, // Add user targeting
      status: "unread",
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification");
  }
};

// Start the server

app.get("/places/:id/similar", async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) {
      return res.status(404).json({ error: "Place not found" });
    }

    // Find similar places based on location, property type, and price range
    const similarPlaces = await Place.find({
      _id: { $ne: place._id },
      property_type: place.property_type,
      price: {
        $gte: place.price * 0.7,
        $lte: place.price * 1.3,
      },
      // Add location-based query if you have coordinates
    })
      .limit(3)
      .select("title photos price address rating reviews");

    res.json(similarPlaces);
  } catch (error) {
    console.error("Error fetching similar places:", error);
    res.status(500).json({ error: "Failed to fetch similar places" });
  }
});
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

// Configure Cloudinary

// Add photo upload endpoint
app.post("/api/upload", authenticateToken, async (req, res) => {
  try {
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ error: "No photo URL provided" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(photoUrl, {
      folder: "apartments",
      use_filename: true,
      unique_filename: true,
    });

    res.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload photo" });
  }
});

// Update place creation endpoint
app.post("/api/places", authenticateToken, async (req, res) => {
  try {
    const {
      title,
      address,
      photos, // These should be the Cloudinary URLs
      description,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
      price,
    } = req.body;

    const placeDoc = await Place.create({
      owner: req.userData.id,
      title,
      address,
      photos, // Store the full Cloudinary URLs
      description,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
      price,
    });

    res.json(placeDoc);
  } catch (error) {
    console.error("Error creating place:", error);
    res.status(500).json({ error: "Failed to create place" });
  }
});

// Replace or modify your existing upload endpoint
app.post("/uploads", authenticateToken, async (req, res) => {
  try {
    const { link } = req.body;
    if (!link) {
      return res.status(400).json({ error: "No link provided" });
    }

    // Upload to Cloudinary directly from the provided link
    const result = await cloudinary.uploader.upload(link, {
      folder: "apartments",
      use_filename: true,
      unique_filename: true,
    });

    res.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload photo" });
  }
});

// For file uploads (if you have this endpoint)
app.post("/upload-by-file", authenticateToken, async (req, res) => {
  try {
    const uploadedFiles = [];
    const files = req.files;

    for (let i = 0; i < files.length; i++) {
      const result = await cloudinary.uploader.upload(files[i].path, {
        folder: "apartments",
        use_filename: true,
        unique_filename: true,
      });
      uploadedFiles.push(result.secure_url);
    }

    res.json(uploadedFiles);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload photos" });
  }
});

app.get("/places/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const place = await Place.findById(id);

    res.json(place);
  } catch (error) {
    console.error("Error fetching place:", error);
    res.status(500).json({ error: "Failed to fetch place" });
  }
});

// Debug middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.params);
  next();
});

app.get("/bookings/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate("place")
      .populate("user", "name email");

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Check if user has permission to view this booking
    if (
      booking.user._id.toString() !== req.userData.id &&
      req.userData.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to view this booking" });
    }

    res.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ error: "Failed to fetch booking details" });
  }
});

// Add this new endpoint to index.js
app.get("/bookings/unavailable-dates/:placeId", async (req, res) => {
  try {
    const { placeId } = req.params;

    // Find all bookings for this place that haven't ended yet
    const bookings = await Booking.find(
      {
        place: placeId,
        check_out: { $gte: new Date() },
      },
      {
        check_in: 1,
        check_out: 1,
        _id: 0,
      }
    );

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching unavailable dates:", error);
    res.status(500).json({ error: "Failed to fetch unavailable dates" });
  }
});

// Add this route to get all bookings for a user
app.get("/bookings", authenticateToken, async (req, res) => {
  try {
    const userId = req.userData.id;

    const bookings = await Booking.find({ user: userId })
      .populate({
        path: "place",
        select: "title address photos price",
      })
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("Error in /bookings route:", error);
    res.status(500).json({
      error: "Failed to fetch bookings",
      details: error.message,
    });
  }
});

// Add a route to create bookings
app.post("/bookings", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or host
    if (req.userData.role === "admin" || req.userData.role === "host") {
      return res.status(403).json({
        error: "Administrators and hosts are not allowed to make bookings",
      });
    }

    const {
      place: placeId,
      check_in,
      check_out,
      max_guests,
      name,
      phone,
      price,
    } = req.body;

    // Check if user is trying to book their own place
    const place = await Place.findById(placeId);
    if (!place) {
      return res.status(404).json({ error: "Place not found" });
    }

    if (place.owner.toString() === req.userData.id) {
      return res.status(403).json({
        error: "You cannot book your own property",
      });
    }

    // Rest of your existing booking creation code
    const booking = await Booking.create({
      place: placeId,
      user: req.userData.id,
      check_in,
      check_out,
      max_guests,
      name,
      phone,
      price,
      status: "confirmed",
    });

    res.json(booking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "Could not create booking" });
  }
});

// Add phone validation function
const validatePhoneNumber = (phone) => {
  const cleanPhone = phone.replace(/\D/g, "");
  return /^\d{10}$/.test(cleanPhone);
};

// Add this new route
app.post("/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      console.error("No credential provided");
      return res.status(400).json({ error: "No credential provided" });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // Check if user exists
    let user = await User.findOne({ email: payload.email });

    if (!user) {
      user = await User.create({
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        googleId: payload.sub,
        authProvider: "google",
        isActive: true,
      });
    } else {
      if (user.authProvider !== "google") {
        return res.status(400).json({
          error: "Email already registered with different method",
        });
      }
    }

    // Create JWT token
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        name: user.name,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: "1h" }
    );

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax", // Changed from 'strict' to 'lax' for OAuth redirect
      })
      .json(user);
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({
      error: "Authentication failed",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Host Google Authentication
app.post("/host/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      console.error("No credential provided");
      return res.status(400).json({ error: "No credential provided" });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // Check if user exists
    let user = await User.findOne({ email: payload.email });

    if (!user) {
      // Create new host user
      user = await User.create({
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        googleId: payload.sub,
        authProvider: "google",
        role: "host", // Set role as host
        isActive: true,
      });
    } else {
      // Check if existing user is a host
      if (user.role !== "host") {
        return res.status(400).json({
          error: "Email already registered as a regular user",
        });
      }
      if (user.authProvider !== "google") {
        return res.status(400).json({
          error: "Email already registered with different method",
        });
      }
    }

    // Create JWT token
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        name: user.name,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: "1h" }
    );

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })
      .json(user);
  } catch (error) {
    console.error("Host Google auth error:", error);
    res.status(500).json({
      error: "Authentication failed",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Host login route
app.post("/host/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, role: "host" });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: "Account is deactivated or does not exist",
        isActive: user?.isActive || false,
        reason: user?.reason || "Account has been deactivated",
      });
    }

    const passOK = bcrypt.compareSync(password, user.password);
    if (!passOK) {
      return res.status(422).json({ error: "Invalid password" });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        name: user.name,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: "1h" }
    );

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })
      .json(user);
  } catch (err) {
    console.error("Host login error:", err);
    res.status(500).json({ error: "Login failed. Try again later." });
  }
});

// Add this after the update-profile endpoint
app.put("/change-password", authenticateToken, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  try {
    // Find user
    const user = await User.findById(req.userData.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isPasswordValid = bcrypt.compareSync(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Validate new password
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "New passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    // Update password
    user.password = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// Add these routes after the existing admin routes

// Update user by ID (Admin only)

// Update place status (Host only)
app.put(
  "/host/places/:id/status",
  authenticateToken,
  authorizeRole("host"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive, reason } = req.body;

      // Find place and verify ownership
      const place = await Place.findById(id);

      if (!place) {
        return res.status(404).json({ error: "Place not found" });
      }

      // Verify ownership
      if (place.owner.toString() !== req.userData.id) {
        return res
          .status(403)
          .json({ error: "Not authorized to update this place" });
      }

      // Update the place
      const updatedPlace = await Place.findByIdAndUpdate(
        id,
        {
          isActive: isActive,
          deactivationReason: isActive ? "" : reason,
        },
        { new: true }
      );

      res.json({
        _id: updatedPlace._id,
        isActive: updatedPlace.isActive,
        deactivationReason: updatedPlace.deactivationReason,
      });
    } catch (error) {
      console.error("Error updating place status:", error);
      res.status(500).json({ error: "Failed to update place status" });
    }
  }
);

// Get all reports (Admin only)
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

// Create new report (Authenticated users)
app.post("/api/reports", authenticateToken, async (req, res) => {
  try {
    const { title, description, type, placeId } = req.body;

    const newReport = new Report({
      title,
      description,
      type,
      place: placeId,
      reportedBy: req.userData.id,
      status: "pending",
      createdAt: new Date(),
    });

    await newReport.save();

    // Create notification for new report
    await createNotification(
      "new_report",
      "New Report Submitted",
      `A new ${type} report has been submitted`,
      `/admin/reports`
    );

    res.status(201).json(newReport);
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ error: "Failed to create report" });
  }
});

// Delete report (Admin only)
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

// Create or get chat
app.post("/chats", authenticateToken, async (req, res) => {
  const { recipientId } = req.body;
  try {
    let chat = await Chat.findOne({
      participants: { $all: [req.userData.id, recipientId] },
    }).populate("participants", "name photo");

    if (!chat) {
      chat = await Chat.create({
        participants: [req.userData.id, recipientId],
        messages: [],
      });
      chat = await chat.populate("participants", "name photo");
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: "Failed to create/get chat" });
  }
});

// Send message
app.post("/chats/:chatId/messages", authenticateToken, async (req, res) => {
  const { content } = req.body;
  const { chatId } = req.params;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    chat.messages.push({
      sender: req.userData.id,
      content,
    });

    await chat.save();
    res.json(chat.messages[chat.messages.length - 1]);
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Get user's chats
app.get("/chats", authenticateToken, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.userData.id,
    })
      .populate({
        path: "participants",
        select: "name photo email role",
      })
      .sort({ updatedAt: -1 });

    // Add last message and unread count
    const enhancedChats = chats.map((chat) => {
      const lastMessage = chat.messages[chat.messages.length - 1];
      const unreadCount = chat.messages.filter(
        (msg) => !msg.read && msg.sender.toString() !== req.userData.id
      ).length;

      return {
        ...chat.toObject(),
        lastMessage,
        unreadCount,
      };
    });

    res.json(enhancedChats);
  } catch (error) {
    console.error("Failed to fetch chats:", error);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

// Email verification endpoints
app.post("/send-verification-email", authenticateToken, async (req, res) => {
  try {
    // Find user
    const user = await User.findById(req.userData.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Update user
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Create verification URL
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

    // Send email
    try {
      const info = await transporter.sendMail({
        from: {
          name: "HelloB",
          address: process.env.EMAIL_USER,
        },
        to: user.email,
        subject: "Verify Your Email - HelloB",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Email Verification</h1>
            <p>Hi ${user.name},</p>
            <p>Please click the button below to verify your email address:</p>
            <a href="${verificationUrl}" 
               style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; 
                      color: white; text-decoration: none; border-radius: 5px;">
              Verify Email
            </a>
            <p>Or copy and paste this link in your browser:</p>
            <p>${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't request this verification, please ignore this email.</p>
          </div>
        `,
      });

      res.json({
        message: "Verification email sent successfully",
        messageId: info.messageId,
      });
    } catch (emailError) {
      console.error("Email sending failed:", {
        error: emailError.message,
        code: emailError.code,
        command: emailError.command,
        response: emailError.response,
      });

      return res.status(500).json({
        error: "Failed to send verification email",
        details:
          process.env.NODE_ENV === "development"
            ? emailError.message
            : undefined,
      });
    }
  } catch (error) {
    console.error("Verification process failed:", error);
    res.status(500).json({
      error: "Failed to process verification request",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

app.post("/verify-email/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      emailVerificationToken: req.params.token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        error:
          "Invalid or expired verification link. Please request a new one.",
      });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({
      message: "Your email has been verified successfully! You can now log in.",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      error: "Failed to verify email. Please try again or contact support.",
    });
  }
});

// Add after other requires

// Create transporter for Gmail (add this after all requires but before middleware setup)
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // Add this for development
  },
});

// Test email configuration immediately
transporter.verify((error, success) => {
  if (error) {
    // Critical error, keep this one but simplify it
    console.error("Email setup error");
  }
});

// Host Analytics endpoint
app.get("/host/analytics", authenticateToken, async (req, res) => {
  try {
    const { timeFrame } = req.query;
    const userId = req.userData.id;

    let startDate = new Date();
    let groupBy;

    // Configure date ranges based on timeFrame
    switch (timeFrame) {
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    }

    // First get all places owned by this host
    const hostPlaces = await Place.find({ owner: userId }).select("_id");
    const placeIds = hostPlaces.map((place) => place._id);

    const analytics = await Booking.aggregate([
      {
        $match: {
          place: { $in: placeIds },
          createdAt: { $gte: startDate },
          status: { $in: ["confirmed", "completed"] },
        },
      },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: "$price" },
          bookings: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          date: "$_id",
          revenue: 1,
          bookings: 1,
          _id: 0,
        },
      },
    ]);

    // Fill in missing dates with zero values
    const filledAnalytics = fillMissingDates(
      analytics,
      startDate,
      new Date(),
      timeFrame
    );

    res.json(filledAnalytics);
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ message: "Error fetching analytics data" });
  }
});

// Helper function to fill in missing dates
function fillMissingDates(data, startDate, endDate, timeFrame) {
  const filledData = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    let dateKey;

    switch (timeFrame) {
      case "week":
      case "month":
        dateKey = current.toLocaleDateString("en-CA"); // YYYY-MM-DD format
        break;
      case "year":
        dateKey = `${current.getFullYear()}-${String(
          current.getMonth() + 1
        ).padStart(2, "0")}`;
        break;
      default:
        dateKey = current.toLocaleDateString("en-CA");
    }

    const existingData = data.find((item) => item.date === dateKey);

    filledData.push({
      date: dateKey,
      revenue: existingData ? existingData.revenue : 0,
      bookings: existingData ? existingData.bookings : 0,
    });

    // Increment date based on timeFrame
    switch (timeFrame) {
      case "week":
      case "month":
        current.setDate(current.getDate() + 1);
        break;
      case "year":
        current.setMonth(current.getMonth() + 1);
        break;
      default:
        current.setDate(current.getDate() + 1);
    }
  }

  return filledData;
}

// Update the profile photo endpoint to use Cloudinary
app.put(
  "/update-profile-photo",
  authenticateToken,
  photosMiddleware.single("photo"),
  async (req, res) => {
    try {
      const { path } = req.file;

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(path, {
        folder: "user_photos",
        use_filename: true,
        unique_filename: true,
      });

      // Clean up the local file
      fs.unlinkSync(path);

      // Update user photo in database with Cloudinary URL
      const updatedUser = await User.findByIdAndUpdate(
        req.userData.id,
        { photo: result.secure_url },
        { new: true }
      ).select("-password");

      res.json({
        success: true,
        photo: result.secure_url,
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error updating profile photo:", error);
      res.status(500).json({ error: "Failed to update profile photo" });
    }
  }
);

wss.on("connection", (ws, req) => {
  const { userId, chatId } = url.parse(req.url, true).query;

  // Store client connection
  if (!clients.has(chatId)) {
    clients.set(chatId, new Map());
  }
  clients.get(chatId).set(userId, ws);

  // Handle incoming messages
  ws.on("message", async (message) => {
    const data = JSON.parse(message);

    if (data.type === "chat") {
      // Broadcast to all clients in the chat except sender
      const chatClients = clients.get(data.data.chatId);
      if (chatClients) {
        chatClients.forEach((clientWs, clientId) => {
          if (clientId !== userId && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: "chat",
                data: data.data,
              })
            );
          }
        });
      }
    }
  });

  // Handle client disconnection
  ws.on("close", () => {
    if (clients.has(chatId)) {
      clients.get(chatId).delete(userId);
      if (clients.get(chatId).size === 0) {
        clients.delete(chatId);
      }
    }
  });
});

// Move this to the bottom of your file

app.post("/send-host-email", authenticateToken, async (req, res) => {
  try {
    const { hostEmail, subject, message } = req.body;
    const sender = await User.findById(req.userData.id);

    if (!sender) {
      return res.status(404).json({ error: "Sender not found" });
    }

    const info = await transporter.sendMail({
      from: {
        name: "HelloB",
        address: process.env.EMAIL_USER,
      },
      to: hostEmail,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Message from HelloB User</h2>
          <p><strong>From:</strong> ${sender.name} (${sender.email})</p>
          <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
            ${message.replace(/\n/g, "<br>")}
          </div>
          <p style="color: #666; font-size: 0.9em;">
            This email was sent through HelloB. Please do not reply directly to this email.
          </p>
        </div>
      `,
      replyTo: sender.email,
    });

    res.json({
      success: true,
      message: "Email sent successfully",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Failed to send host email:", error);
    res.status(500).json({
      error: "Failed to send email",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get similar places by the same host

// Forgot Password route

// Function to handle host/user data visibility
const updateUserDataVisibility = async (userId, isActive) => {
  try {
    // Update places visibility
    await Place.updateMany(
      { owner: userId },
      {
        isActive: isActive,
        status: isActive ? "active" : "inactive",
      }
    );

    // Update bookings visibility (both as user and host)
    await Booking.updateMany(
      {
        $or: [
          { user: userId }, // Bookings made by the user
          {
            place: { $in: await Place.find({ owner: userId }).distinct("_id") },
          }, // Bookings for user's places
        ],
      },
      { isActive: isActive }
    );

    // Update reviews visibility (both given and received)
    await Review.updateMany(
      {
        $or: [
          { author: userId }, // Reviews written by the user
          {
            place: { $in: await Place.find({ owner: userId }).distinct("_id") },
          }, // Reviews for user's places
        ],
      },
      { isActive: isActive }
    );

    // Update vouchers visibility
    await Voucher.updateMany({ owner: userId }, { isActive: isActive });

    // Update announcements visibility
    await Announcement.updateMany({ owner: userId }, { isActive: isActive });

    // Update chat messages visibility
    await Message.updateMany(
      {
        $or: [{ sender: userId }, { recipient: userId }],
      },
      { isActive: isActive }
    );

    // Update chat rooms visibility
    await ChatRoom.updateMany(
      {
        $or: [{ user1: userId }, { user2: userId }],
      },
      { isActive: isActive }
    );

    // Update user visibility
    await User.findByIdAndUpdate(userId, {
      isActive: isActive,
      status: isActive ? "active" : "inactive",
    });

    return true;
  } catch (error) {
    console.error("Error updating data visibility:", error);
    return false;
  }
};

// Modified deactivate user/host route
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
            <li>Announcements</li>
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
app.get("/api/admin/announcements", async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate("host", "name email")
      .sort("-createdAt");
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
});

// Update announcement status (admin only)
app.put("/api/admin/announcements/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminComment } = req.body;

    const announcement = await Announcement.findByIdAndUpdate(
      id,
      {
        status,
        ...(adminComment && { adminComment }),
      },
      { new: true }
    );

    res.json(announcement);
  } catch (error) {
    res.status(500).json({ error: "Failed to update announcement" });
  }
});

// Add this route before other routes
app.post("/check-email", async (req, res) => {
  try {
    const { email, userId } = req.body;

    // Basic validation
    if (!email) {
      return res.status(400).json({
        error: "Email is required",
      });
    }

    // Find user with this email, excluding current user
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: userId }, // Exclude current user from check
      isDeleted: { $ne: true }, // Exclude deleted users
    });

    // Return whether email exists
    res.json({
      exists: !!existingUser,
      message: existingUser ? "Email already exists" : "Email is available",
    });
  } catch (error) {
    console.error("Email check error:", error);
    res.status(500).json({
      error: "Failed to check email availability",
    });
  }
});

// Add this new endpoint for checkout confirmation
app.post("/bookings/:id/checkout", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate("place")
      .populate("user", "name email");

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Check if user owns this booking
    if (booking.user._id.toString() !== req.userData.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Check if booking is eligible for checkout
    const now = new Date();
    const checkOutDate = new Date(booking.check_out);
    const oneDayAfterCheckout = new Date(checkOutDate);
    oneDayAfterCheckout.setDate(oneDayAfterCheckout.getDate() + 1);

    if (now < checkOutDate) {
      return res.status(400).json({
        error: "Cannot checkout before the scheduled check-out date",
      });
    }

    if (now > oneDayAfterCheckout) {
      return res.status(400).json({
        error: "Checkout period has expired",
      });
    }

    // Update booking status
    booking.status = "completed";
    await booking.save();

    // Create notification for the host
    await createNotification(
      "booking_completed",
      "Booking Completed",
      `Booking #${booking._id} for ${booking.place.title} has been completed by ${booking.user.name}`,
      `/host/bookings/${booking._id}`,
      booking.place.owner // host's user ID
    );

    // Send confirmation email
    try {
      await transporter.sendMail({
        from: {
          name: "HelloB",
          address: process.env.EMAIL_USER,
        },
        to: booking.user.email,
        subject: "Checkout Confirmation - HelloB",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Checkout Confirmed</h2>
            <p>Your checkout for ${booking.place.title} has been confirmed.</p>
            <p><strong>Booking Details:</strong></p>
            <ul>
              <li>Check-out Date: ${new Date(
                booking.check_out
              ).toLocaleDateString()}</li>
              <li>Booking ID: ${booking._id}</li>
            </ul>
            <p>Thank you for choosing HelloB!</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send checkout confirmation email:", emailError);
      // Continue with the response even if email fails
    }

    res.json({
      message: "Checkout confirmed successfully",
      booking: {
        id: booking._id,
        status: booking.status,
        checkOutDate: booking.check_out,
      },
    });
  } catch (error) {
    console.error("Error confirming checkout:", error);
    res.status(500).json({ error: "Failed to confirm checkout" });
  }
});

// Enhance the auto-complete task
const autoCompleteBookings = async () => {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const bookingsToComplete = await Booking.find({
      status: "confirmed",
      check_out: { $lte: oneDayAgo },
    })
      .populate("place")
      .populate("user", "name email");

    for (const booking of bookingsToComplete) {
      booking.status = "completed";
      await booking.save();

      await createNotification(
        "booking_auto_completed",
        "Booking Auto-Completed",
        `Booking #${booking._id} for ${booking.place.title} has been automatically completed`,
        `/host/bookings/${booking._id}`,
        booking.place.owner
      );

      try {
        await transporter.sendMail({
          from: {
            name: "HelloB",
            address: process.env.EMAIL_USER,
          },
          to: booking.user.email,
          subject: "Booking Auto-Completed - HelloB",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Booking Auto-Completed</h2>
              <p>Your booking for ${
                booking.place.title
              } has been automatically completed.</p>
              <p><strong>Booking Details:</strong></p>
              <ul>
                <li>Check-out Date: ${new Date(
                  booking.check_out
                ).toLocaleDateString()}</li>
                <li>Booking ID: ${booking._id}</li>
              </ul>
              <p>Thank you for choosing HelloB!</p>
            </div>
          `,
        });
      } catch (emailError) {
        // Email sending failed, but booking is still completed
      }
    }
  } catch (error) {
    // Keep track of critical errors only
    console.error("Critical: Auto-complete bookings failed");
  }
};

// Run the auto-complete task every 24 hours
setInterval(autoCompleteBookings, 24 * 60 * 60 * 1000);

// Run it once when the server starts
autoCompleteBookings();

// GET Chat Messages
app.get("/api/chats/:chatId", authenticateToken, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: { $in: [req.user._id] },
    }).populate({
      path: "participants",
      match: { isActive: true, isDeleted: false },
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Filter out inactive/deleted messages
    chat.messages = chat.messages.filter(
      (msg) => msg.isActive && !msg.isDeleted
    );

    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: "Error fetching chat" });
  }
});

// Add this with other admin routes

// Get user by ID
app.get("/users/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("-password") // Exclude password from the response
      .exec();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Error fetching user data" });
  }
});

// Get user's favorites
app.get("/user/favorites", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userData.id).populate({
      path: "favorites",
      select: "_id", // Only get the IDs of favorite places
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return array of favorite place IDs
    const favoriteIds = user.favorites.map((place) => place._id);
    res.json(favoriteIds);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
});

// Toggle favorite place
app.post("/user/favorites/toggle", authenticateToken, async (req, res) => {
  try {
    const { placeId } = req.body;
    const userId = req.userData.id;

    // Validate placeId
    if (!placeId) {
      return res.status(400).json({ error: "Place ID is required" });
    }

    // Check if place exists
    const place = await Place.findById(placeId);
    if (!place) {
      return res.status(404).json({ error: "Place not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if place is already in favorites
    const favoriteIndex = user.favorites.indexOf(placeId);

    if (favoriteIndex === -1) {
      // Add to favorites
      user.favorites.push(placeId);
    } else {
      // Remove from favorites
      user.favorites.splice(favoriteIndex, 1);
    }

    await user.save();

    // Return updated favorites list
    res.json(user.favorites);
  } catch (error) {
    console.error("Error toggling favorite:", error);
    res.status(500).json({ error: "Failed to update favorites" });
  }
});

// Get all favorite places with details
app.get("/user/favorites/places", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userData.id).populate({
      path: "favorites",
      select: "title photos address price rating",
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user.favorites);
  } catch (error) {
    console.error("Error fetching favorite places:", error);
    res.status(500).json({ error: "Failed to fetch favorite places" });
  }
});

// Card Payment Route

// Helper functions
function validateCardDetails(cardDetails) {
  const { cardNumber, cardHolder, expiryDate, cvv } = cardDetails;

  // Remove spaces and non-numeric characters from card number
  const cleanCardNumber = cardNumber.replace(/\D/g, "");

  // Basic Luhn algorithm check for card number
  if (!isValidLuhn(cleanCardNumber)) {
    return { isValid: false, error: "Invalid card number" };
  }

  // Check card number length (13-19 digits)
  if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
    return { isValid: false, error: "Invalid card number length" };
  }

  // Validate expiry date (MM/YY format)
  const [month, year] = expiryDate.split("/");
  const now = new Date();
  const cardDate = new Date(2000 + parseInt(year), parseInt(month) - 1);

  if (cardDate < now) {
    return { isValid: false, error: "Card has expired" };
  }

  // Validate CVV (3-4 digits)
  if (!/^\d{3,4}$/.test(cvv)) {
    return { isValid: false, error: "Invalid CVV" };
  }

  // Validate cardholder name
  if (!/^[a-zA-Z\s]{2,}$/.test(cardHolder)) {
    return { isValid: false, error: "Invalid cardholder name" };
  }

  return { isValid: true };
}

function isValidLuhn(number) {
  let sum = 0;
  let isEven = false;

  // Loop through values starting from the rightmost side
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number.charAt(i));

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

async function processCardPayment(cardDetails, amount) {
  // Simulate payment processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // For testing: approve payments with specific test card numbers
  const testCards = ["4111111111111111", "5555555555554444"];
  return testCards.includes(cardDetails.cardNumber.replace(/\s/g, ""));
}

// Get all announcements (admin only)

// Create new announcement (host only)

// Add this function after your imports

// Middleware for handling host data visibility and deletion
const updateHostDataVisibility = async (
  hostId,
  isActive,
  isDeleted = false
) => {
  try {
    // Update all places owned by the host
    await Place.updateMany(
      { owner: hostId },
      {
        isActive: isActive,
        isDeleted: isDeleted,
        status: isActive ? "active" : "inactive",
      }
    );

    // Get all place IDs owned by the host
    const hostPlaces = await Place.find({ owner: hostId }).distinct("_id");

    // Update all related data
    await Promise.all([
      // Update vouchers
      Voucher.updateMany(
        { owner: hostId },
        { isActive: isActive, isDeleted: isDeleted }
      ),

      // Update announcements
      Announcement.updateMany(
        { host: hostId },
        { isActive: isActive, isDeleted: isDeleted }
      ),

      // Update reviews for host's places
      Review.updateMany(
        { place: { $in: hostPlaces } },
        { isActive: isActive, isDeleted: isDeleted }
      ),

      // Update bookings for host's places
      Booking.updateMany(
        { place: { $in: hostPlaces } },
        { isActive: isActive, isDeleted: isDeleted }
      ),

      // Update reports
      Report.updateMany(
        { place: { $in: hostPlaces } },
        { isActive: isActive, isDeleted: isDeleted }
      ),

      // Update chat messages
      Chat.updateMany(
        { participants: hostId },
        {
          $set: {
            "messages.$[].isActive": isActive,
            "messages.$[].isDeleted": isDeleted,
          },
        }
      ),
    ]);

    return true;
  } catch (error) {
    console.error("Error updating host data:", error);
    return false;
  }
};

// GET Places
app.get("/api/places", async (req, res) => {
  try {
    const places = await Place.find({
      isActive: true,
      isDeleted: false,
    }).populate({
      path: "owner",
      match: { isActive: true, isDeleted: false },
    });

    // Filter out places where owner is inactive/deleted
    const filteredPlaces = places.filter((place) => place.owner);
    res.json(filteredPlaces);
  } catch (error) {
    res.status(500).json({ error: "Error fetching places" });
  }
});

// GET Bookings
app.get("/api/bookings", authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find({
      isActive: true,
      isDeleted: false,
    }).populate([
      {
        path: "place",
        match: { isActive: true, isDeleted: false },
      },
      {
        path: "user",
        match: { isActive: true, isDeleted: false },
      },
    ]);

    const filteredBookings = bookings.filter(
      (booking) => booking.place && booking.user
    );
    res.json(filteredBookings);
  } catch (error) {
    res.status(500).json({ error: "Error fetching bookings" });
  }
});

// GET Reviews
app.get("/api/reviews", async (req, res) => {
  try {
    const reviews = await Review.find({
      isActive: true,
      isDeleted: false,
    }).populate([
      {
        path: "user",
        match: { isActive: true, isDeleted: false },
      },
      {
        path: "place",
        match: { isActive: true, isDeleted: false },
      },
    ]);

    const filteredReviews = reviews.filter(
      (review) => review.user && review.place
    );
    res.json(filteredReviews);
  } catch (error) {
    res.status(500).json({ error: "Error fetching reviews" });
  }
});

// GET Vouchers
app.get("/api/vouchers", authenticateToken, async (req, res) => {
  try {
    const vouchers = await Voucher.find({
      isActive: true,
      isDeleted: false,
      active: true, // This is the voucher-specific active status
    }).populate([
      {
        path: "owner",
        match: { isActive: true, isDeleted: false },
      },
      {
        path: "applicablePlaces",
        match: { isActive: true, isDeleted: false },
      },
    ]);

    const filteredVouchers = vouchers.filter(
      (voucher) => voucher.owner && voucher.applicablePlaces.length > 0
    );
    res.json(filteredVouchers);
  } catch (error) {
    res.status(500).json({ error: "Error fetching vouchers" });
  }
});

// GET Announcements
app.get("/api/announcements", authenticateToken, async (req, res) => {
  try {
    const announcements = await Announcement.find({
      isActive: true,
      isDeleted: false,
    }).populate({
      path: "host",
      match: { isActive: true, isDeleted: false },
    });

    const filteredAnnouncements = announcements.filter(
      (announcement) => announcement.host
    );
    res.json(filteredAnnouncements);
  } catch (error) {
    res.status(500).json({ error: "Error fetching announcements" });
  }
});
app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
