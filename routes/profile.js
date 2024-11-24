const express = require("express");
const User = require("../models/User");
const Child = require("../models/Child");
const auth = require("../middleware/auth");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const router = express.Router();

// **Cloudinary Configuration**
cloudinary.config({
  cloud_name:'dgmboslsv',
  api_key: '185184138269322',
  api_secret: 'tG0JzLrz7qWG1--RtgddznmLtPU',
});
console.log("Cloudinary configured successfully.");

// **Multer Cloudinary Storage**
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "profile-pictures", // Cloudinary folder where images will be stored
    allowed_formats: ["jpg", "jpeg", "png"], // Allowed image formats
    transformation: [{ width: 300, height: 300, crop: "fill" }], // Resize images to 300x300
  },
});
console.log("Multer storage configured with Cloudinary.");

const upload = multer({ storage }); // Initialize multer with the Cloudinary storage configuration
console.log("Multer initialized with Cloudinary storage.");

// **GET Profile**
router.get("/", auth(), async (req, res) => {
  try {
    console.log("Fetching profile for user ID:", req.user.id);

    // Fetch user and populate children data
    const user = await User.findById(req.user.id).populate(
      "children",
      "name email dateOfBirth grade profilePicture gender additionalDetails"
    );

    if (!user) {
      console.error("User not found.");
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Profile data fetched successfully for user:", user.fullName);
    console.log("Profile data fetched successfully for user:", user.profilePicture );
    console.log("martial status: ",user.maritalStatus );
    // Return all user data including nested children
    res.json({
      fullName: user.fullName || "", // Include fullName in response
      username: user.username || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      address: user.address || {},
      dateOfBirth: user.dateOfBirth || null,
      gender: user.gender || "",
      nationality: user.nationality || "",
      maritalStatus: user.maritalStatus || "",
      occupation: user.occupation || "",
      emergencyContact: user.emergencyContact || {},
      socialMediaLinks: user.socialMediaLinks || {},
      profilePicture: user.profilePicture || null,
      children: user.children.map((child) => ({
        id: child._id || null,
        name: child.name || "",
        email: child.email || "",
        dateOfBirth: child.dateOfBirth || null,
        grade: child.grade || "",
        gender: child.gender || "",
        additionalDetails: child.additionalDetails || {},
        profilePicture: child.profilePicture || null,
      })),
    });
    
    
  } catch (error) {
    console.error("Error fetching profile:", error.message);
    res.status(500).json({ message: "Failed to fetch profile", error: error.message });
  }
});



router.put(
  "/",
  auth(["parent"]),
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "childrenPictures", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      console.log("Incoming request body:", req.body);
      console.log("Incoming files:", req.files);

      const { personalInfo, additionalDetails, children: childrenJSON } = req.body;

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Parse and update personalInfo
      let info = {};
      try {
        info = typeof personalInfo === "string" ? JSON.parse(personalInfo) : personalInfo;
        console.log("Parsed `personalInfo`:", info);
      } catch (err) {
        console.error("Error parsing `personalInfo`:", err.message);
        return res.status(400).json({ message: "Invalid `personalInfo` format", error: err.message });
      }

      user.username = info.username || user.username;
      user.fullName = info.fullName || user.fullName;
      user.email = info.email || user.email;
      user.phoneNumber = info.phone || user.phoneNumber;
      user.dateOfBirth = info.dateOfBirth || user.dateOfBirth;
      user.gender = info.gender || user.gender;
      user.nationality = info.nationality || user.nationality;
      user.occupation = info.occupation || user.occupation;
      user.maritalStatus = info.maritalStatus || user.maritalStatus; // Explicitly update maritalStatus

      if (info.address) {
        user.address = { ...user.address, ...info.address };
      }

      console.log("Updated maritalStatus:", user.maritalStatus);

      // **Handle profile picture**
      if (
        req.files &&
        req.files.profilePicture &&
        req.files.profilePicture.length > 0
      ) {
        const uploadedImage = req.files.profilePicture[0];
        const profilePicUrl = uploadedImage.path; // Cloudinary stores the URL in 'path'
        user.profilePicture = profilePicUrl;
        console.log("Updated user's profile picture URL:", profilePicUrl);
      }

      // Save the user data
      await user.save();

      res.json({ message: "Profile updated successfully", user });
    } catch (error) {
      console.error("Error updating profile:", error.message);
      res.status(500).json({ message: "Failed to update profile", error: error.message });
    }
  }
);


router.get("/get-password", auth(["parent"]), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Note: It's not secure to send the password directly
    // Ideally, you would handle this differently
    return res.status(200).json({ password: user.password });
  } catch (error) {
    console.error("Error fetching password:", error.message);
    res.status(500).json({ message: "An error occurred.", error: error.message });
  }
});
router.put("/change-password", auth(["parent"]), async (req, res) => {
  try {
    const { newPassword } = req.body;

    // Validate input
    if (!newPassword) {
      return res.status(400).json({ message: "New password is required." });
    }

    // Find the user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user's password
    user.password = newPassword;

    // Save the updated user
    await user.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error changing password:", error.message);
    res.status(500).json({ message: "An error occurred while updating the password.", error: error.message });
  }
});





module.exports = router;
