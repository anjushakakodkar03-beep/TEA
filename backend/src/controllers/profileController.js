const { pool } = require("../config/db");


// ==========================================
// 1. UPDATE LOGGED-IN USER'S PROFILE
// ==========================================

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
            `SELECT id
             FROM users
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
            `SELECT
                id,
                name,
                username,
                email,
                phoneNo,
                role,
                bio,
                profilePic
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


// ==========================================
// 2. SEARCH USERS BY NAME OR USERNAME
// ==========================================

const searchUsers = async (req, res, next) => {
    try {
        const query = String(req.query.q || "").trim();

        // If search box is empty
        if (!query) {
            return res.json([]);
        }

        // Search anywhere inside name or username
        const searchTerm = `%${query}%`;

        const [users] = await pool.execute(
            `SELECT
                id,
                name,
                username,
                bio,
                profilePic
             FROM users
             WHERE name LIKE ?
                OR username LIKE ?
             ORDER BY
                CASE
                    WHEN username = ? THEN 0
                    WHEN name = ? THEN 1
                    ELSE 2
                END,
                name ASC
             LIMIT 10`,
            [
                searchTerm,
                searchTerm,
                query,
                query,
            ]
        );

        return res.json(users);

    } catch (error) {
        next(error);
    }
};


// ==========================================
// 3. GET PUBLIC PROFILE BY USERNAME
// ==========================================

const getPublicProfile = async (req, res, next) => {
    try {
        const { username } = req.params;

        const [users] = await pool.execute(
            `SELECT
                id,
                name,
                username,
                bio,
                profilePic,
                createdAt
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

        // Get post count
        const [postCount] = await pool.execute(
            `SELECT COUNT(*) AS total
             FROM posts
             WHERE author = ?`,
            [user.id]
        );

        // Get follower count
        const [followerCount] = await pool.execute(
            `SELECT COUNT(*) AS total
             FROM follows
             WHERE following_id = ?`,
            [user.id]
        );

        // Get following count
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
                 WHERE follower_id = ?
                   AND following_id = ?
                 LIMIT 1`,
                [req.user.id, user.id]
            );

            isFollowing = followRows.length > 0;
        }

        // Get user's posts
        const [posts] = await pool.execute(
            `SELECT
                id,
                title,
                subtitle,
                vibeColor,
                blogType,
                imageUrl,
                createdAt
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


// ==========================================
// 4. FOLLOW OR UNFOLLOW A USER
// ==========================================

const toggleFollow = async (req, res, next) => {
    try {
        const followerId = req.user.id;
        const followingId = Number(req.params.id);

        if (
            !Number.isInteger(followingId) ||
            followingId <= 0
        ) {
            return res.status(400).json({
                message: "Invalid user ID.",
            });
        }

        if (followerId === followingId) {
            return res.status(400).json({
                message: "You cannot follow yourself.",
            });
        }

        // Check whether user exists
        const [users] = await pool.execute(
            `SELECT id
             FROM users
             WHERE id = ?
             LIMIT 1`,
            [followingId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        // Check existing follow
        const [existing] = await pool.execute(
            `SELECT id
             FROM follows
             WHERE follower_id = ?
               AND following_id = ?
             LIMIT 1`,
            [followerId, followingId]
        );

        // Unfollow
        if (existing.length > 0) {
            await pool.execute(
                `DELETE FROM follows
                 WHERE follower_id = ?
                   AND following_id = ?`,
                [followerId, followingId]
            );

            return res.json({
                message: "User unfollowed successfully.",
                isFollowing: false,
            });
        }

        // Follow
        await pool.execute(
            `INSERT INTO follows
                (follower_id, following_id)
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


// ==========================================
// 5. GET FOLLOWERS OF A USER
// ==========================================

const getFollowers = async (req, res, next) => {
    try {
        const userId = Number(req.params.id);

        const [users] = await pool.execute(
            `SELECT
                u.id,
                u.name,
                u.username,
                u.bio,
                u.profilePic
             FROM follows f
             JOIN users u
                ON u.id = f.follower_id
             WHERE f.following_id = ?
             ORDER BY f.createdAt DESC`,
            [userId]
        );

        return res.json(users);

    } catch (error) {
        next(error);
    }
};


// ==========================================
// 6. GET USERS FOLLOWED BY A USER
// ==========================================

const getFollowing = async (req, res, next) => {
    try {
        const userId = Number(req.params.id);

        const [users] = await pool.execute(
            `SELECT
                u.id,
                u.name,
                u.username,
                u.bio,
                u.profilePic
             FROM follows f
             JOIN users u
                ON u.id = f.following_id
             WHERE f.follower_id = ?
             ORDER BY f.createdAt DESC`,
            [userId]
        );

        return res.json(users);

    } catch (error) {
        next(error);
    }
};


// ==========================================
// 7. GET SUGGESTED WRITERS
// ==========================================

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


// ==========================================
// EXPORT ALL CONTROLLERS
// ==========================================

module.exports = {
    updateMyProfile,
    searchUsers,
    getPublicProfile,
    getSuggestedWriters,
    toggleFollow,
    getFollowers,
    getFollowing,
};