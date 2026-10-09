const { Op } = require('sequelize');
const { User, Post, Follow } = require('../models');



const updateMyProfile = async (req, res, next) => {
    try {
        const { name, username, bio } = req.body;

        const currentUser = await User.findByPk(req.user.id);

        if (!currentUser) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        const updatedName = name ?? currentUser.name;
        const updatedUsername = username ?? currentUser.username;
        const updatedBio = bio ?? currentUser.bio;

        const updatedProfilePic = req.file
            ? `/ uploads / profilePics / ${ req.file.filename } `
            : req.body.profilePic ?? currentUser.profilePic;

       
        const existingUser = await User.findOne({
            where: {
                username: updatedUsername,
                id: { [Op.ne]: currentUser.id }
            }
        });

        if (existingUser) {
            return res.status(409).json({
                message: 'This username is already taken.'
            });
        }

        
        await currentUser.update({
            name: updatedName,
            username: updatedUsername,
            bio: updatedBio,
            profilePic: updatedProfilePic
        });

        const updatedUser = await User.findByPk(currentUser.id, {
            attributes: [
                'id',
                'name',
                'username',
                'email',
                'phoneNo',
                'role',
                'bio',
                'profilePic'
            ]
        });

        return res.json({
            message: 'Profile updated successfully.',
            user: updatedUser
        });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                message: 'This username is already taken.'
            });
        }

        return next(error);
    }
};



const searchUsers = async (req, res, next) => {
    try {
        const query = String(req.query.q || '').trim();

        if (!query) {
            return res.json([]);
        }

        const users = await User.findAll({
            attributes: [
                'id',
                'name',
                'username',
                'bio',
                'profilePic'
            ],
            where: {
                [Op.or]: [
                    { name: { [Op.like]: `% ${ query }% ` } },
                    { username: { [Op.like]: `% ${ query }% ` } }
                ]
            },
            order: [['name', 'ASC']],
            limit: 10
        });

        // Prioritize exact username and name matches
        users.sort((a, b) => {
            const aUsername = a.username.toLowerCase() === query.toLowerCase();
            const bUsername = b.username.toLowerCase() === query.toLowerCase();

            if (aUsername !== bUsername) {
                return aUsername ? -1 : 1;
            }

            const aName = a.name.toLowerCase() === query.toLowerCase();
            const bName = b.name.toLowerCase() === query.toLowerCase();

            if (aName !== bName) {
                return aName ? -1 : 1;
            }

            return a.name.localeCompare(b.name);
        });

        return res.json(users);
    } catch (error) {
        return next(error);
    }
};




const getPublicProfile = async (req, res, next) => {
    try {
        const { username } = req.params;

        const user = await User.findOne({
            attributes: [
                'id',
                'name',
                'username',
                'bio',
                'profilePic',
                'createdAt'
            ],
            where: { username }
        });

        if (!user) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        const userId = user.id;

        const [postCount, followerCount, followingCount] =
            await Promise.all([
                Post.count({
                    where: { author: userId }
                }),
                Follow.count({
                    where: { following_id: userId }
                }),
                Follow.count({
                    where: { follower_id: userId }
                })
            ]);

        let isFollowing = false;

        if (req.user && Number(req.user.id) !== Number(userId)) {
            const followRecord = await Follow.findOne({
                where: {
                    follower_id: req.user.id,
                    following_id: userId
                },
                attributes: ['id']
            });

            isFollowing = Boolean(followRecord);
        }

        const posts = await Post.findAll({
            attributes: [
                'id',
                'title',
                'subtitle',
                'vibeColor',
                'blogType',
                'imageUrl',
                'createdAt'
            ],
            where: { author: userId },
            order: [['createdAt', 'DESC']]
        });

        return res.json({
            user,
            stats: {
                posts: postCount,
                followers: followerCount,
                following: followingCount
            },
            isFollowing,
            posts
        });
    } catch (error) {
        return next(error);
    }
};




const toggleFollow = async (req, res, next) => {
    try {
        const followerId = Number(req.user.id);
        const followingId = Number(req.params.id);

        if (!Number.isInteger(followingId) || followingId <= 0) {
            return res.status(400).json({
                message: 'Invalid user ID.'
            });
        }

        if (followerId === followingId) {
            return res.status(400).json({
                message: 'You cannot follow yourself.'
            });
        }

        const targetUser = await User.findByPk(followingId, {
            attributes: ['id']
        });

        if (!targetUser) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        const existingFollow = await Follow.findOne({
            where: {
                follower_id: followerId,
                following_id: followingId
            }
        });

        if (existingFollow) {
            await existingFollow.destroy();

            return res.json({
                message: 'User unfollowed successfully.',
                isFollowing: false
            });
        }

        await Follow.create({
            follower_id: followerId,
            following_id: followingId
        });

        return res.json({
            message: 'User followed successfully.',
            isFollowing: true
        });
    } catch (error) {
        return next(error);
    }
};




const getFollowers = async (req, res, next) => {
    try {
        const userId = Number(req.params.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                message: 'Invalid user ID.'
            });
        }

        const followRecords = await Follow.findAll({
            attributes: ['follower_id'],
            where: { following_id: userId },
            order: [['createdAt', 'DESC']]
        });

        const followerIds = followRecords.map(
            (record) => record.follower_id
        );

        if (followerIds.length === 0) {
            return res.json([]);
        }

        const users = await User.findAll({
            attributes: [
                'id',
                'name',
                'username',
                'bio',
                'profilePic'
            ],
            where: {
                id: { [Op.in]: followerIds }
            }
        });

        // Preserve the follow-date ordering
        const userMap = new Map(
            users.map((user) => [Number(user.id), user])
        );

        const orderedUsers = followerIds
            .map((id) => userMap.get(Number(id)))
            .filter(Boolean);

        return res.json(orderedUsers);
    } catch (error) {
        return next(error);
    }
};




const getFollowing = async (req, res, next) => {
    try {
        const userId = Number(req.params.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                message: 'Invalid user ID.'
            });
        }

        const followRecords = await Follow.findAll({
            attributes: ['following_id'],
            where: { follower_id: userId },
            order: [['createdAt', 'DESC']]
        });

        const followingIds = followRecords.map(
            (record) => record.following_id
        );

        if (followingIds.length === 0) {
            return res.json([]);
        }

        const users = await User.findAll({
            attributes: [
                'id',
                'name',
                'username',
                'bio',
                'profilePic'
            ],
            where: {
                id: { [Op.in]: followingIds }
            }
        });

        const userMap = new Map(
            users.map((user) => [Number(user.id), user])
        );

        const orderedUsers = followingIds
            .map((id) => userMap.get(Number(id)))
            .filter(Boolean);

        return res.json(orderedUsers);
    } catch (error) {
        return next(error);
    }
};




const getSuggestedWriters = async (req, res, next) => {
    try {
        const userId = Number(req.user.id);

        
        const followRecords = await Follow.findAll({
            attributes: ['following_id'],
            where: { follower_id: userId }
        });

        const followedIds = followRecords.map(
            (record) => Number(record.following_id)
        );

        
        const writers = await User.findAll({
            attributes: [
                'id',
                'name',
                'username',
                'bio',
                'profilePic'
            ],
            where: {
                id: {
                    [Op.ne]: userId,
                    [Op.notIn]: followedIds.length ? followedIds : [0]
                }
            }
        });

       
        const writersWithPostCount = await Promise.all(
            writers.map(async (writer) => {
                const postCount = await Post.count({
                    where: { author: writer.id }
                });

                return {
                    ...writer.toJSON(),
                    postCount
                };
            })
        );

        writersWithPostCount.sort((a, b) => {
            return b.postCount - a.postCount || b.id - a.id;
        });

        return res.json(writersWithPostCount.slice(0, 8));
    } catch (error) {
        return next(error);
    }
};




module.exports = {
    updateMyProfile,
    searchUsers,
    getPublicProfile,
    getSuggestedWriters,
    toggleFollow,
    getFollowers,
    getFollowing
};

