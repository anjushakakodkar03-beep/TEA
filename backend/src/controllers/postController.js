const { Op } = require('sequelize');
const { Post, User } = require('../models');

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


const formatPost = (postInstance) => {
    if (!postInstance) {
        return null;
    }

    const post = postInstance.toJSON();

    const writer = post.writer || null;

    post.authorName = writer ? writer.name : null;
    post.authorUsername = writer ? writer.username : null;

   
    delete post.writer;

    post.contentJson = parseJsonField(post.contentJson);
    post.overlays = parseJsonField(post.overlays);

    return post;
};


const authorInclude = {
    model: User,
    as: 'writer',
    attributes: ['name', 'username'],
    required: true
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
            overlays
        } = req.body;

        if (!title) {
            return res.status(400).json({
                message: 'title is required'
            });
        }

        const post = await Post.create({
            author: req.user.id,
            title,
            subtitle: subtitle || null,
            vibeColor: vibeColor || '#ffffff',
            blogType: blogType || 'post',
            alignment: alignment || 'center',
            imageUrl: imageUrl || null,
            contentJson: parseJsonField(contentJson, []),
            overlays: parseJsonField(overlays, [])
        });

        const createdPost = await Post.findByPk(post.id, {
            include: [authorInclude]
        });

        return res.status(201).json(formatPost(createdPost));
    } catch (error) {
        next(error);
    }
};


const getPosts = async (req, res, next) => {
    try {
        const { search = '', blogType = '' } = req.query;

        const where = {};

        if (blogType) {
            where.blogType = blogType;
        }

        if (search) {
            where.title = {
                [Op.like]: `%${search}%`
            };
        }

        const posts = await Post.findAll({
            where,
            include: [authorInclude],
            order: [['createdAt', 'DESC']]
        });

        return res.json(posts.map(formatPost));
    } catch (error) {
        next(error);
    }
};


const getMyPosts = async (req, res, next) => {
    try {
        const posts = await Post.findAll({
            where: {
                author: req.user.id
            },
            include: [authorInclude],
            order: [['createdAt', 'DESC']]
        });

        return res.json(posts.map(formatPost));
    } catch (error) {
        next(error);
    }
};

const getPostById = async (req, res, next) => {
    try {
        const post = await Post.findByPk(req.params.id, {
            include: [authorInclude]
        });

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        return res.json(formatPost(post));
    } catch (error) {
        next(error);
    }
};


const updatePost = async (req, res, next) => {
    try {
        const post = await Post.findByPk(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        if (
            String(post.author) !== String(req.user.id) &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({
                message: 'Not allowed'
            });
        }

        const fields = [
            'title',
            'subtitle',
            'vibeColor',
            'blogType',
            'alignment',
            'imageUrl',
            'contentJson',
            'overlays'
        ];

        const updates = {};

        for (const field of fields) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updates[field] = req.body[field];
            }
        }

        
        if (Object.prototype.hasOwnProperty.call(updates, 'contentJson')) {
            updates.contentJson = parseJsonField(
                updates.contentJson,
                []
            );
        }

        if (Object.prototype.hasOwnProperty.call(updates, 'overlays')) {
            updates.overlays = parseJsonField(
                updates.overlays,
                []
            );
        }

        await post.update(updates);

        const updatedPost = await Post.findByPk(post.id, {
            include: [authorInclude]
        });

        return res.json(formatPost(updatedPost));
    } catch (error) {
        next(error);
    }
};

// DELETE POST
const deletePost = async (req, res, next) => {
    try {
        const post = await Post.findByPk(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        if (
            String(post.author) !== String(req.user.id) &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({
                message: 'Not allowed'
            });
        }

        await post.destroy();

        return res.json({
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