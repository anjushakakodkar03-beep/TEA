const Post = require('../models/Post');

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
            return res.status(400).json({ message: 'title is required' });
        }

        const post = await Post.create({
            author: req.user._id,
            title,
            subtitle,
            vibeColor,
            blogType,
            alignment,
            imageUrl,
            contentJson: contentJson || [],
            overlays: overlays || [],
        });

        res.status(201).json(post);
    } catch (error) {
        next(error);
    }
};

const getPosts = async (req, res, next) => {
    try {
        const { search = '', blogType = '' } = req.query;

        const filter = {};
        if (blogType) filter.blogType = blogType;
        if (search) filter.title = { $regex: search, $options: 'i' };

        const posts = await Post.find(filter)
            .sort({ createdAt: -1 })
            .populate('author', 'name username');

        res.json(posts);
    } catch (error) {
        next(error);
    }
};

const getPostById = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id).populate('author', 'name username');
        if (!post) return res.status(404).json({ message: 'Post not found' });
        res.json(post);
    } catch (error) {
        next(error);
    }
};

const updatePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (String(post.author) !== String(req.user._id) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not allowed' });
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

        post.title = title ?? post.title;
        post.subtitle = subtitle ?? post.subtitle;
        post.vibeColor = vibeColor ?? post.vibeColor;
        post.blogType = blogType ?? post.blogType;
        post.alignment = alignment ?? post.alignment;
        post.imageUrl = imageUrl ?? post.imageUrl;
        post.contentJson = contentJson ?? post.contentJson;
        post.overlays = overlays ?? post.overlays;

        await post.save();
        res.json(post);
    } catch (error) {
        next(error);
    }
};

const deletePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (String(post.author) !== String(req.user._id) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not allowed' });
        }

        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = { createPost, getPosts, getPostById, updatePost, deletePost };

