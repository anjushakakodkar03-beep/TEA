
const { pool } = require("../config/db");

// 1. Update logged-in user's profile
const updateMyProfile = async (req, res, next) => {
    try {
        const { name, username, bio } = req.body;

        const updatedName = name ?? req.user.name;
        const updatedUsername = username ?? req.user.username;
        const updatedBio = bio ?? req.user.bio;

        const updatedProfilePic = req.file
            ? `/uploads/profilePics/${req.file.filename}`
            : req.body.profilePic ?? req.user.profilePic;

        // Check whether another user already has this username
        const [existingUsers] = await pool.execute(
            `SELECT id FROM users
             WHERE username = ? AND id != ?
             LIMIT 1`,
            [updatedUsername, req.user.id]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "This username is already taken.",
            });
        }

        // Update profile
        await pool.execute(
            `UPDATE users
             SET name = ?,
                 username = ?,
                 bio = ?,
                 profilePic = ?
             WHERE id = ?`,
            [
                updatedName,
                updatedUsername,
                updatedBio,
                updatedProfilePic,
                req.user.id,
            ]
        );

        // Fetch updated profile
        const [users] = await pool.execute(
            `SELECT id, name, username, email, phoneNo,
                    role, bio, profilePic
             FROM users
             WHERE id = ?
             LIMIT 1`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        return res.json({
            message: "Profile updated successfully.",
            user: users[0],
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "This username is already taken.",
            });
        }

        next(error);
    }
};

// 2. Get public profile by username
const getPublicProfile = async (req, res, next) => {
    try {
        const { username } = req.params;

        const [users] = await pool.execute(
            `SELECT id, name, username, bio, profilePic, createdAt
             FROM users
             WHERE username = ?
             LIMIT 1`,
            [username]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        const user = users[0];

        const [postCount] = await pool.execute(
            "SELECT COUNT(*) AS total FROM posts WHERE author = ?",
            [user.id]
        );

        const [followerCount] = await pool.execute(
            `SELECT COUNT(*) AS total
             FROM follows
             WHERE following_id = ?`,
            [user.id]
        );

        const [followingCount] = await pool.execute(
            `SELECT COUNT(*) AS total
             FROM follows
             WHERE follower_id = ?`,
            [user.id]
        );

        let isFollowing = false;

        if (req.user && req.user.id !== user.id) {
            const [followRows] = await pool.execute(
                `SELECT id
                 FROM follows
                 WHERE follower_id = ? AND following_id = ?
                 LIMIT 1`,
                [req.user.id, user.id]
            );

            isFollowing = followRows.length > 0;
        }

        const [posts] = await pool.execute(
            `SELECT id, title, subtitle, vibeColor, blogType,
                    imageUrl, createdAt
             FROM posts
             WHERE author = ?
             ORDER BY createdAt DESC`,
            [user.id]
        );

        return res.json({
            user,
            stats: {
                posts: postCount[0].total,
                followers: followerCount[0].total,
                following: followingCount[0].total,
            },
            isFollowing,
            posts,
        });
    } catch (error) {
        next(error);
    }
};

// 3. Follow or unfollow a user
const toggleFollow = async (req, res, next) => {
    try {
        const followerId = req.user.id;
        const followingId = Number(req.params.id);

        if (!Number.isInteger(followingId) || followingId <= 0) {
            return res.status(400).json({
                message: "Invalid user ID.",
            });
        }

        if (followerId === followingId) {
            return res.status(400).json({
                message: "You cannot follow yourself.",
            });
        }

        const [users] = await pool.execute(
            "SELECT id FROM users WHERE id = ? LIMIT 1",
            [followingId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        const [existing] = await pool.execute(
            `SELECT id
             FROM follows
             WHERE follower_id = ? AND following_id = ?
             LIMIT 1`,
            [followerId, followingId]
        );

        if (existing.length > 0) {
            await pool.execute(
                `DELETE FROM follows
                 WHERE follower_id = ? AND following_id = ?`,
                [followerId, followingId]
            );

            return res.json({
                message: "User unfollowed successfully.",
                isFollowing: false,
            });
        }

        await pool.execute(
            `INSERT INTO follows (follower_id, following_id)
             VALUES (?, ?)`,
            [followerId, followingId]
        );

        return res.json({
            message: "User followed successfully.",
            isFollowing: true,
        });
    } catch (error) {
        next(error);
    }
};

// 4. Get followers of a user
const getFollowers = async (req, res, next) => {
    try {
        const userId = Number(req.params.id);

        const [users] = await pool.execute(
            `SELECT u.id, u.name, u.username, u.bio, u.profilePic
             FROM follows f
             JOIN users u ON u.id = f.follower_id
             WHERE f.following_id = ?
             ORDER BY f.createdAt DESC`,
            [userId]
        );

        return res.json(users);
    } catch (error) {
        next(error);
    }
};

// 5. Get users followed by a user
const getFollowing = async (req, res, next) => {
    try {
        const userId = Number(req.params.id);

        const [users] = await pool.execute(
            `SELECT u.id, u.name, u.username, u.bio, u.profilePic
             FROM follows f
             JOIN users u ON u.id = f.following_id
             WHERE f.follower_id = ?
             ORDER BY f.createdAt DESC`,
            [userId]
        );

        return res.json(users);
    } catch (error) {
        next(error);
    }
};

// 6. Get suggested writers for the logged-in user
const getSuggestedWriters = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const [writers] = await pool.execute(
            `SELECT
                u.id,
                u.name,
                u.username,
                u.bio,
                u.profilePic,
                (
                    SELECT COUNT(*)
                    FROM posts p
                    WHERE p.author = u.id
                ) AS postCount
             FROM users u
             WHERE u.id != ?
             AND NOT EXISTS (
                 SELECT 1
                 FROM follows f
                 WHERE f.follower_id = ?
                 AND f.following_id = u.id
             )
             ORDER BY postCount DESC, u.id DESC
             LIMIT 8`,
            [userId, userId]
        );

        return res.json(writers);
    } catch (error) {
        next(error);
    }
};

// Export all controller functions
module.exports = {
    updateMyProfile,
    getPublicProfile,
    getSuggestedWriters,
    toggleFollow,
    getFollowers,
    getFollowing,
};