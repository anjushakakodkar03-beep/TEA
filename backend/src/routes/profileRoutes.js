const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
    updateMyProfile,
    searchUsers,
    getPublicProfile,
    getSuggestedWriters,
    toggleFollow,
    getFollowers,
    getFollowing,
} = require("../controllers/profileController");


// ==========================================
// PROFILE IMAGE UPLOAD DIRECTORY
// ==========================================

const uploadDirectory = path.join(
    __dirname,
    "../../uploads/profilePics"
);

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
        recursive: true,
    });
}


// ==========================================
// MULTER STORAGE
// ==========================================

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, uploadDirectory);
    },

    filename: (req, file, callback) => {
        const extension = path
            .extname(file.originalname)
            .toLowerCase();

        const uniqueName =
            `profile-${req.user.id}-${Date.now()}${extension}`;

        callback(null, uniqueName);
    },
});


// ==========================================
// FILE FILTER
// ==========================================

const fileFilter = (req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
        return callback(
            new Error("Only image files are allowed.")
        );
    }

    callback(null, true);
};


// ==========================================
// MULTER CONFIGURATION
// ==========================================

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});


// ==========================================
// UPDATE MY PROFILE
// ==========================================

router.put(
    "/me",
    protect,
    upload.single("profilePic"),
    updateMyProfile
);


// ==========================================
// SEARCH USERS
// IMPORTANT: This must come BEFORE /:username
// ==========================================

router.get(
    "/search",
    searchUsers
);


// ==========================================
// SUGGESTED WRITERS
// ==========================================

router.get(
    "/suggested",
    protect,
    getSuggestedWriters
);


// ==========================================
// FOLLOW / UNFOLLOW
// ==========================================

router.post(
    "/follow/:id",
    protect,
    toggleFollow
);


// ==========================================
// FOLLOWERS
// ==========================================

router.get(
    "/:id/followers",
    getFollowers
);


// ==========================================
// FOLLOWING
// ==========================================

router.get(
    "/:id/following",
    getFollowing
);


// ==========================================
// PUBLIC PROFILE
// IMPORTANT: Keep this LAST
// ==========================================

router.get(
    "/:username",
    getPublicProfile
);


// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;