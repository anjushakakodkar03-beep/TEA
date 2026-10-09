const User = require('./user');
const Post = require('./Post');
const Comment = require('./Comment');
const Follow = require('./Follow');


User.hasMany(Post, {
    foreignKey: 'author',
    as: 'posts',
    onDelete: 'RESTRICT',
    constraints: false
});

Post.belongsTo(User, {
    foreignKey: 'author',
    as: 'writer',
    constraints: false
});


Post.hasMany(Comment, {
    foreignKey: 'post',
    as: 'comments',
    constraints: false
});

Comment.belongsTo(Post, {
    foreignKey: 'post',
    as: 'postDetails',
    constraints: false
});


User.hasMany(Comment, {
    foreignKey: 'author',
    as: 'writtenComments',
    constraints: false
});

Comment.belongsTo(User, {
    foreignKey: 'author',
    as: 'commenter',
    constraints: false
});


User.hasMany(Follow, {
    foreignKey: 'follower_id',
    as: 'following',
    constraints: false
});

User.hasMany(Follow, {
    foreignKey: 'following_id',
    as: 'followers',
    constraints: false
});

Follow.belongsTo(User, {
    foreignKey: 'follower_id',
    as: 'follower',
    constraints: false
});

Follow.belongsTo(User, {
    foreignKey: 'following_id',
    as: 'followedUser',
    constraints: false
});

module.exports = {
    User,
    Post,
    Comment,
    Follow
};