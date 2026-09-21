const { pool } = require('../config/db');

const addComment = async (req, res, next) => {
    try {
        const { text } = req.body;

        if (!text || !String(text).trim()) {
            return res.status(400).json({
                message: 'text is required'
            });
        }

        // Check whether the post exists
        const [posts] = await pool.execute(
            'SELECT id FROM posts WHERE id = ? LIMIT 1',
            [req.params.postId]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        // Insert comment
        const [result] = await pool.execute(
            `INSERT INTO comments
            (post, author, text)
            VALUES (?, ?, ?)`,
            [
                req.params.postId,
                req.user.id,
                String(text).trim()
            ]
        );

        // Return the newly created comment with author details
        const [comments] = await pool.execute(
            `SELECT
                c.id,
                c.post,
                c.author,
                c.text,
                c.createdAt,
                c.updatedAt,
                u.name AS authorName,
                u.username AS authorUsername
             FROM comments c
             JOIN users u ON c.author = u.id
             WHERE c.id = ?
             LIMIT 1`,
            [result.insertId]
        );

        res.status(201).json(comments[0]);

    } catch (error) {
        next(error);
    }
};


const getComments = async (req, res, next) => {
    try {
        const [comments] = await pool.execute(
            `SELECT
                c.id,
                c.post,
                c.author,
                c.text,
                c.createdAt,
                c.updatedAt,
                u.name AS authorName,
                u.username AS authorUsername
             FROM comments c
             JOIN users u ON c.author = u.id
             WHERE c.post = ?
             ORDER BY c.createdAt DESC`,
            [req.params.postId]
        );

        res.json(comments);

    } catch (error) {
        next(error);
    }
};


module.exports = {
    addComment,
    getComments
};