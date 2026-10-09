
const { Comment, Post, User } = require('../models');


const addComment = async (req, res, next) => {
    try {
        const { text } = req.body;

        if (!text || !String(text).trim()) {
            return res.status(400).json({
                message: 'text is required'
            });
        }

        
        const post = await Post.findByPk(req.params.postId, {
            attributes: ['id']
        });

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

       
        const comment = await Comment.create({
            post: req.params.postId,
            author: req.user.id,
            text: String(text).trim()
        });

        
        const savedComment = await Comment.findByPk(comment.id, {
            attributes: [
                'id',
                'post',
                'author',
                'text',
                'createdAt',
                'updatedAt'
            ],
            include: [
                {
                    model: User,
                    as: 'commentAuthor',
                    attributes: ['name', 'username']
                }
            ]
        });

        const commentData = savedComment.toJSON();

        return res.status(201).json({
            id: commentData.id,
            post: commentData.post,
            author: commentData.author,
            text: commentData.text,
            createdAt: commentData.createdAt,
            updatedAt: commentData.updatedAt,
            authorName: commentData.commentAuthor?.name || null,
            authorUsername: commentData.commentAuthor?.username || null
        });
    } catch (error) {
        return next(error);
    }
};


const getComments = async (req, res, next) => {
    try {
        const comments = await Comment.findAll({
            where: {
                post: req.params.postId
            },
            attributes: [
                'id',
                'post',
                'author',
                'text',
                'createdAt',
                'updatedAt'
            ],
            include: [
                {
                    model: User,
                    as: 'commentAuthor',
                    attributes: ['name', 'username']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        const formattedComments = comments.map((comment) => {
            const commentData = comment.toJSON();

            return {
                id: commentData.id,
                post: commentData.post,
                author: commentData.author,
                text: commentData.text,
                createdAt: commentData.createdAt,
                updatedAt: commentData.updatedAt,
                authorName: commentData.commentAuthor?.name || null,
                authorUsername: commentData.commentAuthor?.username || null
            };
        });

        return res.json(formattedComments);
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    addComment,
    getComments
};

