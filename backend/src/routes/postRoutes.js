const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
    createPost,
    getPosts,
    getMyPosts,
    getPostById,
    updatePost,
    deletePost,
} = require('../controllers/postController');

const router = express.Router();

router.route('/').get(getPosts).post(protect, createPost);
router.get('/:id', getPostById);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);
router.get('/my', protect, getMyPosts);

module.exports = router;

