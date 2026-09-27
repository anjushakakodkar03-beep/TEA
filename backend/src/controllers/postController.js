const { pool } = require('../config/db');

const parseJsonField = (value, fallback = []) => {
    if (value === null || value === undefined) {
        return fallback;
    }

    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }

    return value;
};


const createPost = async (req, res, next) => {
    try {
        const {
            title,
            subtitle,
            vibeColor,
            blogType,
            alignment,
            imageUrl,
            contentJson,
            overlays,
        } = req.body;

        if (!title) {
            return res.status(400).json({
                message: 'title is required'
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO posts
            (author, title, subtitle, vibeColor, blogType, alignment, imageUrl, contentJson, overlays)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                title,
                subtitle || null,
                vibeColor || '#ffffff',
                blogType || 'post',
                alignment || 'center',
                imageUrl || null,
                JSON.stringify(contentJson || []),
                JSON.stringify(overlays || [])
            ]
        );

        const [posts] = await pool.execute(
            `SELECT 
                p.*,
                u.name AS authorName,
                u.username AS authorUsername
             FROM posts p
             JOIN users u ON p.author = u.id
             WHERE p.id = ?`,
            [result.insertId]
        );

        const post = posts[0];

        post.contentJson = parseJsonField(post.contentJson);
        post.overlays = parseJsonField(post.overlays);

        res.status(201).json(post);

    } catch (error) {
        next(error);
    }
};


const getPosts = async (req, res, next) => {
    try {
        const { search = '', blogType = '' } = req.query;

        let query = `
            SELECT
                p.*,
                u.name AS authorName,
                u.username AS authorUsername
            FROM posts p
            JOIN users u ON p.author = u.id
            WHERE 1 = 1
        `;

        const params = [];

        if (blogType) {
            query += ` AND p.blogType = ?`;
            params.push(blogType);
        }

        if (search) {
            query += ` AND p.title LIKE ?`;
            params.push(`%${search}%`);
        }

        query += ` ORDER BY p.createdAt DESC`;

        const [posts] = await pool.execute(query, params);

        posts.forEach((post) => {
            post.contentJson = parseJsonField(post.contentJson);
            post.overlays = parseJsonField(post.overlays);
        });

        res.json(posts);

    } catch (error) {
        next(error);
    }
};


const getMyPosts = async (req, res, next) => {
    try {
        const [posts] = await pool.execute(
            `SELECT
                p.*,
                u.name AS authorName,
                u.username AS authorUsername
             FROM posts p
             JOIN users u ON p.author = u.id
             WHERE p.author = ?
             ORDER BY p.createdAt DESC`,
            [req.user.id]
        );

        posts.forEach((post) => {
            post.contentJson = parseJsonField(post.contentJson);
            post.overlays = parseJsonField(post.overlays);
        });

        res.json(posts);
    } catch (error) {
        next(error);
    }
};


const getPostById = async (req, res, next) => {
    try {
        const [posts] = await pool.execute(
            `SELECT
                p.*,
                u.name AS authorName,
                u.username AS authorUsername
             FROM posts p
             JOIN users u ON p.author = u.id
             WHERE p.id = ?
             LIMIT 1`,
            [req.params.id]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        const post = posts[0];

        post.contentJson = parseJsonField(post.contentJson);
        post.overlays = parseJsonField(post.overlays);

        res.json(post);

    } catch (error) {
        next(error);
    }
};


const updatePost = async (req, res, next) => {
    try {
        const [posts] = await pool.execute(
            `SELECT * FROM posts WHERE id = ? LIMIT 1`,
            [req.params.id]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        const post = posts[0];

        if (
            String(post.author) !== String(req.user.id) &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({
                message: 'Not allowed'
            });
        }

        const {
            title,
            subtitle,
            vibeColor,
            blogType,
            alignment,
            imageUrl,
            contentJson,
            overlays,
        } = req.body;

        const finalContentJson =
            contentJson !== undefined
                ? contentJson
                : parseJsonField(post.contentJson);

        const finalOverlays =
            overlays !== undefined
                ? overlays
                : parseJsonField(post.overlays);

        await pool.execute(
            `UPDATE posts
             SET title = ?,
                 subtitle = ?,
                 vibeColor = ?,
                 blogType = ?,
                 alignment = ?,
                 imageUrl = ?,
                 contentJson = ?,
                 overlays = ?
             WHERE id = ?`,
            [
                title ?? post.title,
                subtitle ?? post.subtitle,
                vibeColor ?? post.vibeColor,
                blogType ?? post.blogType,
                alignment ?? post.alignment,
                imageUrl ?? post.imageUrl,
                JSON.stringify(finalContentJson),
                JSON.stringify(finalOverlays),
                req.params.id
            ]
        );

        const [updatedPosts] = await pool.execute(
            `SELECT
                p.*,
                u.name AS authorName,
                u.username AS authorUsername
             FROM posts p
             JOIN users u ON p.author = u.id
             WHERE p.id = ?`,
            [req.params.id]
        );

        const updatedPost = updatedPosts[0];

        updatedPost.contentJson = parseJsonField(updatedPost.contentJson);
        updatedPost.overlays = parseJsonField(updatedPost.overlays);

        res.json(updatedPost);

    } catch (error) {
        next(error);
    }
};


const deletePost = async (req, res, next) => {
    try {
        const [posts] = await pool.execute(
            `SELECT * FROM posts WHERE id = ? LIMIT 1`,
            [req.params.id]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        const post = posts[0];

        if (
            String(post.author) !== String(req.user.id) &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({
                message: 'Not allowed'
            });
        }

        await pool.execute(
            `DELETE FROM posts WHERE id = ?`,
            [req.params.id]
        );

        res.json({
            message: 'Post deleted'
        });

    } catch (error) {
        next(error);
    }
};


module.exports = {
    createPost,
    getPosts,
    getMyPosts,
    getPostById,
    updatePost,
    deletePost
};