
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

const API = "http://localhost:5000/api";
const SERVER_URL = "http://localhost:5000";

// Convert backend image paths into full URLs
const getImageUrl = (imagePath) => {
    if (!imagePath) return "";

    if (
        imagePath.startsWith("http://") ||
        imagePath.startsWith("https://") ||
        imagePath.startsWith("blob:") ||
        imagePath.startsWith("data:")
    ) {
        return imagePath;
    }

    return `${SERVER_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
};

function Profile() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        posts: 0,
        followers: 0,
        following: 0,
    });
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        username: "",
        bio: "",
    });

    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    const getToken = () => localStorage.getItem("token");

    // Fetch the latest profile information
    const fetchProfile = async () => {
        try {
            const token = getToken();

            if (!token) {
                navigate("/");
                return;
            }

            // 1. Fetch logged-in user details
            const response = await fetch(`${API}/auth/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Unable to load your profile.");
            }

            const userData = await response.json();
            const authUser = userData.user || userData;

            // 2. Fetch full profile details using the username
            const publicResponse = await fetch(
                `${API}/profiles/${encodeURIComponent(authUser.username)}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!publicResponse.ok) {
                throw new Error("Unable to load your posts.");
            }

            const profileData = await publicResponse.json();

            // 3. Extract profile information
            const profileUser =
                profileData.user ||
                profileData.profile ||
                profileData;

            // 4. Merge profile data with authenticated user data
            const mergedUser = {
                ...authUser,
                ...profileUser,
                id: authUser.id ?? profileUser.id,
                name: profileUser.name ?? authUser.name ?? "",
                username:
                    profileUser.username ?? authUser.username ?? "",
                bio: profileUser.bio ?? authUser.bio ?? "",
                profilePic:
                    profileUser.profilePic ??
                    authUser.profilePic ??
                    "",
            };

            // 5. Update the profile and edit form
            setUser(mergedUser);

            setFormData({
                name: mergedUser.name,
                username: mergedUser.username,
                bio: mergedUser.bio,
            });

            setImagePreview(mergedUser.profilePic || "");

            // 6. Update statistics and posts
            setStats(
                profileData.stats || {
                    posts: 0,
                    followers: 0,
                    following: 0,
                }
            );

            setPosts(profileData.posts || []);
        } catch (err) {
            setError(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    // Open edit profile form
    const handleEditClick = () => {
        setFormData({
            name: user.name || "",
            username: user.username || "",
            bio: user.bio || "",
        });

        setSelectedImage(null);
        setImagePreview(user.profilePic || "");
        setEditError("");
        setSuccessMessage("");
        setIsEditing(true);
    };

    // Handle text input changes
    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: value,
        }));
    };

    // Handle profile picture selection
    const handleImageChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setEditError("Please select a valid image.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setEditError("Image size must be less than 5 MB.");
            return;
        }

        setEditError("");
        setSelectedImage(file);

        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
    };

    // Save profile changes
    const handleSaveProfile = async (event) => {
        event.preventDefault();

        setSaving(true);
        setEditError("");
        setSuccessMessage("");

        try {
            const token = getToken();

            if (!token) {
                throw new Error("Please log in again.");
            }

            const formDataToSend = new FormData();

            formDataToSend.append("name", formData.name.trim());
            formDataToSend.append(
                "username",
                formData.username.trim()
            );
            formDataToSend.append("bio", formData.bio.trim());

            if (selectedImage) {
                formDataToSend.append("profilePic", selectedImage);
            }

            const response = await fetch(`${API}/profiles/me`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formDataToSend,
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.error ||
                    "Failed to update your profile."
                );
            }

            // Update the displayed profile immediately
            const updatedUser = data.user || data.profile || data;

            setUser((current) => ({
                ...current,
                ...updatedUser,
                name: updatedUser.name ?? formData.name.trim(),
                username:
                    updatedUser.username ??
                    formData.username.trim(),
                bio: updatedUser.bio ?? formData.bio.trim(),
                profilePic:
                    updatedUser.profilePic ??
                    current?.profilePic ??
                    "",
            }));

            setFormData({
                name: formData.name.trim(),
                username: formData.username.trim(),
                bio: formData.bio.trim(),
            });

            setSuccessMessage(
                "Your profile has been updated successfully! ♡"
            );

            setIsEditing(false);
            setSelectedImage(null);

            // Fetch the latest saved profile from the backend
            setLoading(true);
            setError("");

            await fetchProfile();
        } catch (err) {
            setEditError(
                err.message || "Something went wrong."
            );
        } finally {
            setSaving(false);
        }
    };

    // Cancel editing
    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditError("");
        setSelectedImage(null);
        setImagePreview(user.profilePic || "");
    };

    // Delete a post
    const handleDelete = async (postId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this post?"
        );

        if (!confirmed) return;

        try {
            const token = getToken();

            const response = await fetch(
                `${API}/posts/${postId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to delete the post.");
            }

            setPosts((currentPosts) =>
                currentPosts.filter(
                    (post) => post.id !== postId
                )
            );

            setStats((currentStats) => ({
                ...currentStats,
                posts: Math.max(
                    0,
                    currentStats.posts - 1
                ),
            }));
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) {
        return (
            <div className="profile-message">
                Loading your little corner... ♡
            </div>
        );
    }

    if (error) {
        return (
            <div className="profile-message">
                {error}
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="profile-page">
            <header className="profile-topbar">
                <button
                    className="profile-logo"
                    onClick={() => navigate("/home")}
                >
                    scribbly<span>.</span>
                </button>

                <button
                    className="back-home"
                    onClick={() => navigate("/home")}
                >
                    ← Back to home
                </button>
            </header>

            <main className="profile-container">
                {successMessage && (
                    <div className="profile-success-message">
                        {successMessage}
                    </div>
                )}

                {isEditing && (
                    <section className="edit-profile-card">
                        <div className="edit-profile-heading">
                            <div>
                                <span className="section-kicker">
                                    MAKE IT YOURS
                                </span>
                                <h2>Edit your profile ♡</h2>
                            </div>

                            <button
                                type="button"
                                className="edit-cancel-btn"
                                onClick={handleCancelEdit}
                                disabled={saving}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveProfile}>
                            <div className="edit-profile-field">
                                <label htmlFor="name">
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>

                            <div className="edit-profile-field">
                                <label htmlFor="username">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    placeholder="Choose a username"
                                    required
                                />
                            </div>

                            <div className="edit-profile-field">
                                <label htmlFor="bio">Bio</label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleInputChange}
                                    placeholder="Tell the world a little about yourself..."
                                    rows="4"
                                    maxLength="500"
                                />
                            </div>

                            <div className="edit-profile-field">
                                <label htmlFor="profilePic">
                                    Profile Picture
                                </label>

                                <div className="profile-image-upload">
                                    {imagePreview ? (
                                        <img
                                            src={getImageUrl(imagePreview)}
                                            alt="Profile preview"
                                            className="profile-image-preview"
                                        />
                                    ) : (
                                        <div className="profile-image-placeholder">
                                            ♡
                                        </div>
                                    )}

                                    <label
                                        htmlFor="profilePic"
                                        className="profile-upload-btn"
                                    >
                                        📷 Choose Photo
                                    </label>

                                    <input
                                        id="profilePic"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        hidden
                                    />

                                    <small>
                                        Select an image from your device.
                                        Maximum size: 5 MB.
                                    </small>
                                </div>
                            </div>

                            {editError && (
                                <p className="profile-error-message">
                                    {editError}
                                </p>
                            )}

                            <div className="edit-profile-actions">
                                <button
                                    type="button"
                                    className="edit-cancel-action"
                                    onClick={handleCancelEdit}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="edit-save-btn"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : "♡ Save Changes"}
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                <section className="profile-card">
                    <div className="profile-cover">
                        <span>✿</span>
                        <span>♡</span>
                        <span>✳</span>
                    </div>

                    <div className="profile-main">
                        <div className="profile-avatar">
                            {user.profilePic ? (
                                <img
                                    src={getImageUrl(user.profilePic)}
                                    alt={user.name}
                                />
                            ) : (
                                <span>
                                    {user.name
                                        ?.charAt(0)
                                        .toUpperCase()}
                                </span>
                            )}
                        </div>

                        {!isEditing && (
                            <button
                                className="edit-profile-btn"
                                onClick={handleEditClick}
                            >
                                ✎ Edit Profile
                            </button>
                        )}

                        <h1>{user.name}</h1>

                        <p className="profile-username">
                            @{user.username}
                        </p>

                        <p className="profile-bio">
                            {user.bio ||
                                "No bio yet. Tell the world a little about yourself! ♡"}
                        </p>

                        <div className="profile-stats">
                            <div>
                                <strong>{stats.posts}</strong>
                                <span>Posts</span>
                            </div>

                            <button
                                onClick={() =>
                                    navigate(
                                        `/profile/${user.id}/followers`
                                    )
                                }
                            >
                                <strong>{stats.followers}</strong>
                                <span>Followers</span>
                            </button>

                            <button
                                onClick={() =>
                                    navigate(
                                        `/profile/${user.id}/following`
                                    )
                                }
                            >
                                <strong>{stats.following}</strong>
                                <span>Following</span>
                            </button>
                        </div>
                    </div>
                </section>

                <section className="my-posts-section">
                    <div className="my-posts-heading">
                        <div>
                            <span className="section-kicker">
                                YOUR LITTLE COLLECTION
                            </span>
                            <h2>
                                My stories <span>♡</span>
                            </h2>
                        </div>

                        <button
                            className="write-post-btn"
                            onClick={() =>
                                navigate("/create-post")
                            }
                        >
                            + Write a story
                        </button>
                    </div>

                    {posts.length === 0 ? (
                        <div className="empty-posts">
                            <span>✎</span>
                            <h3>Your story starts here!</h3>
                            <p>
                                You haven't published any posts yet.
                            </p>
                            <button
                                onClick={() =>
                                    navigate("/create-post")
                                }
                            >
                                Write your first story →
                            </button>
                        </div>
                    ) : (
                        <div className="profile-post-grid">
                            {posts.map((post) => (
                                <article
                                    className="profile-post-card"
                                    key={post.id}
                                >
                                    {post.imageUrl && (
                                        <img
                                            className="profile-post-image"
                                            src={post.imageUrl}
                                            alt={post.title}
                                        />
                                    )}

                                    <div className="profile-post-content">
                                        <span className="post-category">
                                            {post.blogType ||
                                                "A LITTLE STORY"}
                                        </span>

                                        <h3>{post.title}</h3>
                                        <p>{post.subtitle}</p>

                                        <div className="profile-post-actions">
                                            <button
                                                onClick={() =>
                                                    navigate(
                                                        `/post/${post.id}`
                                                    )
                                                }
                                            >
                                                Read story →
                                            </button>

                                            <button
                                                className="delete-post-btn"
                                                onClick={() =>
                                                    handleDelete(post.id)
                                                }
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default Profile;