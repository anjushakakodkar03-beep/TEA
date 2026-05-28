const Comment = require('../models/Comment');
const Post = require('../models/Post');

const addComment = async (req, res, next) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ message: 'text is required' });

        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const comment = await Comment.create({
            post: req.params.postId,
            author: req.user._id,
            text: String(text).trim(),
        });

        res.status(201).json(comment);
    } catch (error) {
        next(error);
    }
};

const getComments = async (req, res, next) => {
    try {
        const comments = await Comment.find({ post: req.params.postId })
            .sort({ createdAt: -1 })
            .populate('author', 'name username');

        res.json(comments);
    } catch (error) {
        next(error);
    }
};

module.exports = { addComment, getComments };

