
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./PublicProfile.css";

const API_URL = "http://localhost:5000/api";
const SERVER_URL = "http://localhost:5000";

const getImageUrl = (imagePath) => {
    if (!imagePath) return "";

    if (
        imagePath.startsWith("http://") ||
        imagePath.startsWith("https://") ||
        imagePath.startsWith("data:")
    ) {
        return imagePath;
    }

    return `${SERVER_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
};

const PublicProfile = () => {
    const { username } = useParams();

    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({
        posts: 0,
        followers: 0,
        following: 0,
    });
    const [posts, setPosts] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    const currentUser = (() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "null");
        } catch {
            return null;
        }
    })();

    const isOwnProfile =
        currentUser?.username?.toLowerCase() === username?.toLowerCase();

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                `${API_URL}/profiles/${encodeURIComponent(username)}`,
                {
                    headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : {},
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not load this profile.");
            }

            setProfile(data.user);
            setStats(data.stats);
            setPosts(data.posts || []);
            setIsFollowing(data.isFollowing || false);
        } catch (err) {
            setError(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }, [username, token]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleFollow = async () => {
        if (!token) {
            setError("Please log in to follow this writer.");
            return;
        }

        if (!profile || followLoading) return;

        setFollowLoading(true);
        setError("");

        try {
            const response = await fetch(
                `${API_URL}/profiles/follow/${profile.id}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not update follow status.");
            }

            setIsFollowing(data.isFollowing);
            setStats((previous) => ({
                ...previous,
                followers: Math.max(
                    0,
                    previous.followers + (data.isFollowing ? 1 : -1)
                ),
            }));
        } catch (err) {
            setError(err.message || "Something went wrong.");
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="public-profile-message">
                <p>Loading profile... ✿</p>
            </div>
        );
    }

    if (error && !profile) {
        return (
            <div className="public-profile-message">
                <h2>Profile not found</h2>
                <p>{error}</p>
                <Link to="/home" className="back-home-btn">
                    Back to Home
                </Link>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="public-profile-page">
            <header className="public-profile-header">
                <Link to="/home" className="public-logo">
                    scribbly<span>.</span>
                </Link>

                <Link to="/home" className="back-home-link">
                    ← Back to Home
                </Link>
            </header>

            <main className="public-profile-container">
                <section className="public-profile-card">
                    <div className="public-profile-cover">
                        <span>✿</span>
                        <span>♡</span>
                    </div>

                    <div className="public-profile-details">
                        <div className="public-profile-top">
                            <div className="public-avatar">
                                {profile.profilePic ? (
                                    <img
                                        src={getImageUrl(profile.profilePic)}
                                        alt={profile.name}
                                    />
                                ) : (
                                    <span>
                                        {profile.name?.charAt(0)?.toUpperCase() || "S"}
                                    </span>
                                )}
                            </div>

                            {!isOwnProfile && (
                                <button
                                    className={`public-follow-btn ${isFollowing ? "following" : ""
                                        }`}
                                    onClick={handleFollow}
                                    disabled={followLoading}
                                >
                                    {followLoading
                                        ? "Please wait..."
                                        : isFollowing
                                            ? "Following ✓"
                                            : "+ Follow"}
                                </button>
                            )}

                            {isOwnProfile && (
                                <Link to="/profile" className="public-edit-btn">
                                    Edit Profile
                                </Link>
                            )}
                        </div>

                        <h1>{profile.name}</h1>
                        <p className="public-username">@{profile.username}</p>

                        <p className="public-bio">
                            {profile.bio || "This writer hasn't added a bio yet. ✨"}
                        </p>

                        <div className="public-profile-stats">
                            <div>
                                <strong>{stats.posts}</strong>
                                <span>Posts</span>
                            </div>
                            <div>
                                <strong>{stats.followers}</strong>
                                <span>Followers</span>
                            </div>
                            <div>
                                <strong>{stats.following}</strong>
                                <span>Following</span>
                            </div>
                        </div>
                    </div>
                </section>

                {error && <p className="public-profile-error">{error}</p>}

                <section className="public-posts-section">
                    <div className="public-posts-heading">
                        <h2>Stories by {profile.name}</h2>
                        <span>{posts.length} stories</span>
                    </div>

                    {posts.length === 0 ? (
                        <div className="public-empty-posts">
                            <span>✎</span>
                            <h3>No stories yet</h3>
                            <p>This writer hasn't shared any stories yet.</p>
                        </div>
                    ) : (
                        <div className="public-posts-grid">
                            {posts.map((post) => (
                                <Link
                                    to={`/post/${post.id}`}
                                    className="public-post-card"
                                    key={post.id}
                                >
                                    {post.imageUrl ? (
                                        <img
                                            className="public-post-image"
                                            src={getImageUrl(post.imageUrl)}
                                            alt={post.title}
                                        />
                                    ) : (
                                        <div
                                            className="public-post-placeholder"
                                            style={{
                                                backgroundColor: post.vibeColor || "#f4e8f2",
                                            }}
                                        >
                                            ✿
                                        </div>
                                    )}

                                    <div className="public-post-content">
                                        {post.blogType && (
                                            <span className="public-post-type">
                                                {post.blogType}
                                            </span>
                                        )}

                                        <h3>{post.title}</h3>

                                        {post.subtitle && <p>{post.subtitle}</p>}

                                        <span className="public-post-date">
                                            {post.createdAt
                                                ? new Date(post.createdAt).toLocaleDateString()
                                                : ""}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default PublicProfile;