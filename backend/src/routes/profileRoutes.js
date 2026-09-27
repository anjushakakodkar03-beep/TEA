const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
    updateMyProfile,
    getPublicProfile,
    getSuggestedWriters,
    toggleFollow,
    getFollowers,
    getFollowing,
} = require("../controllers/profileController");

const uploadDirectory = path.join(__dirname, "../../uploads/profilePics");
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, callback) => callback(null, uploadDirectory),
    filename: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const uniqueName = `profile-${req.user.id}-${Date.now()}${extension}`;
        callback(null, uniqueName);
    },
});

const fileFilter = (req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
        return callback(new Error("Only image files are allowed."));
    }
    callback(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});

router.put("/me", protect, upload.single("profilePic"), updateMyProfile);

// Keep this route above /:username so "suggested" is not treated as a username.
router.get("/suggested", protect, getSuggestedWriters);

router.post("/follow/:id", protect, toggleFollow);
router.get("/:id/followers", getFollowers);
router.get("/:id/following", getFollowing);
router.get("/:username", getPublicProfile);

module.exports = router;
