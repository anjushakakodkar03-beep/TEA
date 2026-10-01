import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
    const navigate = useNavigate();

    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [sortOrder, setSortOrder] = useState("newest");

    // Suggested writers
    const [suggestedWriters, setSuggestedWriters] = useState([]);
    const [writersLoading, setWritersLoading] = useState(true);
    const [writersError, setWritersError] = useState("");
    const [followingWriterId, setFollowingWriterId] = useState(null);

    // Search overlay states
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [userSuggestions, setUserSuggestions] = useState([]);
    const [userSearchResults, setUserSearchResults] = useState([]);
    const [userSearchLoading, setUserSearchLoading] = useState(false);

    // Categories
    const categories = [
        { label: "All stories", value: "all" },
        { label: "Lifestyle 🌷", value: "lifestyle" },
        { label: "Travel ✈️", value: "travel" },
        { label: "Personal ♡", value: "personal" },
        { label: "Creativity 🎨", value: "creativity" },
    ];

    // Fetch posts from backend
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    "http://localhost:5000/api/posts"
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch blog posts.");
                }

                const data = await response.json();
                setArticles(Array.isArray(data) ? data : []);
            } catch {
                setError(
                    "Unable to load stories. Please check your server."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    // Fetch suggested writers
    useEffect(() => {
        const fetchSuggestedWriters = async () => {
            try {
                setWritersLoading(true);
                setWritersError("");

                const token = localStorage.getItem("token");
                const response = await fetch(
                    "http://localhost:5000/api/profiles/suggested",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error("Unable to load suggested writers.");
                }

                const data = await response.json();
                setSuggestedWriters(Array.isArray(data) ? data : []);
            } catch (err) {
                setWritersError(
                    err.message || "Unable to load suggested writers."
                );
            } finally {
                setWritersLoading(false);
            }
        };

        fetchSuggestedWriters();
    }, []);

    // Follow a suggested writer
    const handleFollowWriter = async (writerId) => {
        try {
            setFollowingWriterId(writerId);
            const token = localStorage.getItem("token");
            const response = await fetch(
                `http://localhost:5000/api/profiles/follow/${writerId}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.message || "Unable to follow this writer.");
            }

            // Remove the followed writer from suggestions
            setSuggestedWriters((current) =>
                current.filter((writer) => writer.id !== writerId)
            );
        } catch (err) {
            window.alert(err.message || "Unable to follow this writer.");
        } finally {
            setFollowingWriterId(null);
        }
    };

    // Logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    // Format date
    const formatDate = (date) => {
        if (!date) return "Scribbly story";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    // Category colors
    const getColor = (type) => {
        const colors = {
            lifestyle: "pink",
            travel: "mint",
            personal: "lavender",
            creativity: "yellow",
        };

        return colors[(type || "").toLowerCase()] || "pink";
    };

    // Filter and sort stories by category
    const filteredArticles = useMemo(() => {
        return articles
            .filter((article) => {
                const category = (article.blogType || "").toLowerCase();

                return (
                    selectedCategory === "all" ||
                    category === selectedCategory
                );
            })
            .sort((a, b) => {
                if (sortOrder === "newest") {
                    return (
                        new Date(b.createdAt || 0) -
                        new Date(a.createdAt || 0)
                    );
                }

                if (sortOrder === "oldest") {
                    return (
                        new Date(a.createdAt || 0) -
                        new Date(b.createdAt || 0)
                    );
                }

                if (sortOrder === "az") {
                    return (a.title || "").localeCompare(
                        b.title || ""
                    );
                }

                return 0;
            });
    }, [articles, selectedCategory, sortOrder]);

    // Clear category and sorting filters
    const clearFilters = () => {
        setSelectedCategory("all");
        setSortOrder("newest");
    };

    // Select a category and scroll to articles
    const handleCategorySelect = (category) => {
        setSelectedCategory(category);

        document.getElementById("articles")?.scrollIntoView({
            behavior: "smooth",
        });
    };

    // ================= SEARCH FUNCTIONS =================

    // Get searchable text from each article
    const getSearchableText = (article) => {
        return [
            article.title || "",
            article.subtitle || "",
            article.authorName || "",
            article.authorUsername || "",
            article.blogType || "",
        ]
            .join(" ")
            .toLowerCase();
    };

    // Open search overlay
    const openSearch = () => {
        setIsSearchOpen(true);
        setSearchInput("");
        setSearchTerm("");
        setShowSearchResults(false);
        setUserSuggestions([]);
        setUserSearchResults([]);
    };

    // Close search overlay
    const closeSearch = () => {
        setIsSearchOpen(false);
        setSearchInput("");
        setSearchTerm("");
        setShowSearchResults(false);
        setUserSuggestions([]);
        setUserSearchResults([]);
    };

    // Matching article suggestions while typing
    const searchSuggestions = useMemo(() => {
        const query = searchInput.trim().toLowerCase();

        if (!query) return [];

        return articles
            .filter((article) =>
                getSearchableText(article).includes(query)
            )
            .slice(0, 6);
    }, [articles, searchInput]);

    // Search users from backend while typing
    useEffect(() => {
        const query = searchInput.trim();

        if (!query) {
            setUserSuggestions([]);
            setUserSearchLoading(false);
            return;
        }

        let cancelled = false;

        const timer = setTimeout(async () => {
            try {
                setUserSearchLoading(true);

                const response = await fetch(
                    `http://localhost:5000/api/profiles/search?q=${encodeURIComponent(query)}`
                );

                const data = await response.json().catch(() => []);

                if (!response.ok) {
                    throw new Error(data.message || "Unable to search users.");
                }

                if (!cancelled) {
                    setUserSuggestions(Array.isArray(data) ? data : []);
                }
            } catch {
                if (!cancelled) {
                    setUserSuggestions([]);
                }
            } finally {
                if (!cancelled) {
                    setUserSearchLoading(false);
                }
            }
        }, 250);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [searchInput]);

    // Search articles locally after pressing Enter
    const searchResults = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        if (!query) return [];

        return articles.filter((article) =>
            getSearchableText(article).includes(query)
        );
    }, [articles, searchTerm]);

    // Submit search
    const handleSearchSubmit = async (e) => {
        e.preventDefault();

        const query = searchInput.trim();

        if (!query) return;

        setSearchTerm(query);
        setShowSearchResults(true);

        try {
            setUserSearchLoading(true);

            const response = await fetch(
                `http://localhost:5000/api/profiles/search?q=${encodeURIComponent(query)}`
            );

            const data = await response.json().catch(() => []);

            if (!response.ok) {
                throw new Error(data.message || "Unable to search users.");
            }

            setUserSearchResults(Array.isArray(data) ? data : []);
        } catch {
            setUserSearchResults([]);
        } finally {
            setUserSearchLoading(false);
        }
    };

    // Click a story suggestion to open the story
    const handleSuggestionClick = (article) => {
        closeSearch();
        navigate(`/post/${article.id}`);
    };

    // Click a user suggestion/result to open their public profile
    const handleUserClick = (user) => {
        closeSearch();
        navigate(`/user/${encodeURIComponent(user.username)}`);
    };

    // Select a category in the search overlay
    const handleSearchCategory = (category) => {
        setSearchInput(category);
        setSearchTerm(category);
        setShowSearchResults(true);
    };

    // Close search using Escape
    useEffect(() => {
        if (!isSearchOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                closeSearch();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isSearchOpen]);

    return (
        <div className="scribbly-home">
            {/* ================= NAVBAR ================= */}
            <header className="home-navbar">
                <a href="/home" className="home-logo">
                    scribbly<span>.</span>
                </a>

                <nav className="home-navigation">
                    <a className="active" href="/home">
                        Home
                    </a>
                    <a href="#articles">Explore</a>
                    <a href="#categories">Categories</a>
                    <a href="#about">About</a>
                </nav>

                <div className="home-actions">
                    <button
                        type="button"
                        className="search-button"
                        aria-label="Search stories"
                        title="Search stories"
                        onClick={openSearch}
                    >
                        ⌕
                    </button>

                    {/* Profile Dashboard Button */}
                    <button
                        type="button"
                        className="profile-dashboard-btn"
                        onClick={() => navigate("/profile")}
                        aria-label="Open Profile Dashboard"
                        title="My Profile"
                    >
                        ♡ Profile
                    </button>

                    <button
                        type="button"
                        className="publish-post-btn"
                        onClick={() => navigate("/create-post")}
                    >
                        + Create Post
                    </button>

                    <button
                        type="button"
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        Log out ↗
                    </button>
                </div>
            </header>

            <main className="home-main">
                {/* ================= FEATURED STORY ================= */}
                <section className="featured-story">
                    <div className="featured-art">
                        <div className="featured-sun">✳</div>
                        <div className="featured-illustration">📖</div>

                        <span className="featured-sticker">
                            A STORY FOR YOU ♡
                        </span>
                    </div>

                    <div className="featured-info">
                        <span className="category-pill lemon">
                            Featured story
                        </span>

                        <h1>
                            Every thought
                            <br />
                            has a <span>story.</span>
                        </h1>

                        <p>
                            A cozy little corner to share your ideas,
                            write your heart out, and discover stories
                            that stay with you.
                        </p>

                        <a href="#articles" className="featured-button">
                            Explore stories <span>→</span>
                        </a>

                        <div className="featured-meta">
                            <span>✿ Made for storytellers</span>
                            <span>♡ Read something lovely</span>
                        </div>
                    </div>
                </section>

                {/* ================= MARQUEE ================= */}
                <div
                    className="scribbly-marquee"
                    aria-label="Scribbly community message"
                >
                    <div className="marquee-track">
                        {Array.from({ length: 2 }).map((_, index) => (
                            <span
                                key={index}
                                aria-hidden={index === 1}
                            >
                                ✿ WRITE YOUR STORY
                                <span className="marquee-star">✦</span>
                                SHARE YOUR THOUGHTS
                                <span className="marquee-star">♡</span>
                                DISCOVER SOMETHING NEW
                                <span className="marquee-star">✧</span>
                                LET YOUR CREATIVITY BLOOM
                                <span className="marquee-star">✿</span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* ================= CATEGORIES ================= */}
                <section className="category-section" id="categories">
                    <span
                        className="category-float doodle-one"
                        aria-hidden="true"
                    >
                        ✿
                    </span>
                    <span
                        className="category-float doodle-two"
                        aria-hidden="true"
                    >
                        ✧
                    </span>
                    <span
                        className="category-float doodle-three"
                        aria-hidden="true"
                    >
                        ♡
                    </span>
                    <span
                        className="category-float doodle-four"
                        aria-hidden="true"
                    >
                        ✦
                    </span>

                    <div className="section-heading">
                        <div>
                            <span className="section-kicker">
                                FIND YOUR INSPIRATION
                            </span>
                            <h2>
                                Explore by category <span>♡</span>
                            </h2>
                        </div>
                    </div>

                    <div className="category-list">
                        {/* LIFESTYLE */}
                        <a
                            href="#articles"
                            className="category-row"
                            onClick={() => handleCategorySelect("lifestyle")}
                        >
                            <div className="category-visual category-visual-pink">
                                <span className="category-art-emoji">🌷</span>
                                <span className="category-art-doodle">✿</span>
                                <span className="category-art-sparkle">✧</span>
                            </div>

                            <div className="category-details">
                                <span className="category-number">
                                    01 / LIFESTYLE
                                </span>
                                <h3>Lifestyle <span>♡</span></h3>
                                <p>
                                    Little joys, everyday moments, and the
                                    beautiful memories hidden in ordinary days.
                                </p>
                                <span className="category-explore">
                                    Explore stories ↗
                                </span>
                            </div>
                        </a>

                        {/* TRAVEL */}
                        <a
                            href="#articles"
                            className="category-row reverse"
                            onClick={() => handleCategorySelect("travel")}
                        >
                            <div className="category-visual category-visual-yellow">
                                <span className="category-art-emoji">✈️</span>
                                <span className="category-art-doodle">☼</span>
                                <span className="category-art-sparkle">✧</span>
                            </div>

                            <div className="category-details">
                                <span className="category-number">
                                    02 / TRAVEL
                                </span>
                                <h3>Travel <span>✈</span></h3>
                                <p>
                                    Discover new places, collect unforgettable
                                    experiences, and find inspiration along the way.
                                </p>
                                <span className="category-explore">
                                    Explore stories ↗
                                </span>
                            </div>
                        </a>

                        {/* PERSONAL */}
                        <a
                            href="#articles"
                            className="category-row"
                            onClick={() => handleCategorySelect("personal")}
                        >
                            <div className="category-visual category-visual-mint">
                                <span className="category-art-emoji">🌱</span>
                                <span className="category-art-doodle">♡</span>
                                <span className="category-art-sparkle">✦</span>
                            </div>

                            <div className="category-details">
                                <span className="category-number">
                                    03 / PERSONAL
                                </span>
                                <h3>Personal <span>♡</span></h3>
                                <p>
                                    Honest thoughts, little life updates, and
                                    meaningful stories straight from the heart.
                                </p>
                                <span className="category-explore">
                                    Explore stories ↗
                                </span>
                            </div>
                        </a>

                        {/* CREATIVITY */}
                        <a
                            href="#articles"
                            className="category-row reverse"
                            onClick={() => handleCategorySelect("creativity")}
                        >
                            <div className="category-visual category-visual-lavender">
                                <span className="category-art-emoji">🎨</span>
                                <span className="category-art-doodle">✿</span>
                                <span className="category-art-sparkle">✧</span>
                            </div>

                            <div className="category-details">
                                <span className="category-number">
                                    04 / CREATIVITY
                                </span>
                                <h3>Creativity <span>✦</span></h3>
                                <p>
                                    Explore fresh ideas, creative projects, and
                                    inspiration that brings your imagination to life.
                                </p>
                                <span className="category-explore">
                                    Explore stories ↗
                                </span>
                            </div>
                        </a>
                    </div>
                </section>

                {/* ================= SUGGESTED WRITERS ================= */}
                <section className="suggested-writers-section" id="writers">
                    <div className="suggested-writers-heading">
                        <span className="section-kicker">MEET THE STORYTELLERS</span>
                        <h2>Writers to discover <span>♡</span></h2>
                        <p>Find your next favorite voice in the Scribbly community.</p>
                    </div>

                    {writersLoading ? (
                        <p className="posts-message">✨ Finding lovely writers for you...</p>
                    ) : writersError ? (
                        <div className="suggested-writers-empty">
                            <span>🌷</span>
                            <h3>Writers are taking a little break.</h3>
                            <p>{writersError}</p>
                        </div>
                    ) : suggestedWriters.length === 0 ? (
                        <div className="suggested-writers-empty">
                            <span>💛</span>
                            <h3>You're all caught up!</h3>
                            <p>There are no new writers to suggest right now.</p>
                        </div>
                    ) : (
                        <div className="suggested-writers-grid">
                            {suggestedWriters.map((writer) => (
                                <article className="suggested-writer-card" key={writer.id}>
                                    <div className="suggested-writer-avatar">
                                        {writer.profilePic ? (
                                            <img
                                                src={writer.profilePic.startsWith("http")
                                                    ? writer.profilePic
                                                    : `http://localhost:5000${writer.profilePic}`}
                                                alt={`${writer.name || writer.username}'s profile`}
                                            />
                                        ) : (
                                            <span>
                                                {(writer.name || writer.username || "W")
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    <h3>{writer.name || writer.username || "Scribbly Writer"}</h3>
                                    <p className="suggested-writer-username">
                                        @{writer.username || "writer"}
                                    </p>
                                    <p className="suggested-writer-bio">
                                        {writer.bio || "Sharing little thoughts and stories on Scribbly."}
                                    </p>

                                    <div className="suggested-writer-actions">
                                        <button
                                            type="button"
                                            className="suggested-writer-follow"
                                            onClick={() => handleFollowWriter(writer.id)}
                                            disabled={followingWriterId === writer.id}
                                        >
                                            {followingWriterId === writer.id ? "Following..." : "♡ Follow"}
                                        </button>
                                        <button
                                            type="button"
                                            className="suggested-writer-view"
                                            onClick={() => navigate(`/user/${writer.username}`)}
                                        >
                                            View Profile ↗
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                {/* ================= RECENT ARTICLES ================= */}
                <section className="articles-section" id="articles">
                    <div className="section-heading">
                        <div>
                            <span className="section-kicker">
                                LITTLE STORIES, BIG FEELINGS
                            </span>
                            <h2>
                                Recent articles <span>♡</span>
                            </h2>
                            <p>Find a story that speaks to you.</p>
                        </div>
                    </div>

                    {/* Breadcrumb */}
                    {(selectedCategory !== "all" ||
                        sortOrder !== "newest") && (
                            <div className="search-breadcrumb">
                                <button
                                    type="button"
                                    className="breadcrumb-back"
                                    onClick={clearFilters}
                                >
                                    ← Back to all stories
                                </button>

                                {selectedCategory !== "all" && (
                                    <span>
                                        Category:{" "}
                                        {selectedCategory.charAt(0).toUpperCase() +
                                            selectedCategory.slice(1)}
                                    </span>
                                )}
                            </div>
                        )}

                    {/* Category filters and sorting */}
                    <div className="story-search-panel">
                        <div className="search-filter-row">
                            <span className="filter-label">
                                Explore by category
                            </span>

                            <div className="search-category-filters">
                                {categories.map((category) => (
                                    <button
                                        key={category.value}
                                        type="button"
                                        className={`search-category-btn ${selectedCategory === category.value
                                            ? "selected"
                                            : ""
                                            }`}
                                        onClick={() =>
                                            setSelectedCategory(category.value)
                                        }
                                    >
                                        {category.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="search-bottom-row">
                            <span className="search-result-count">
                                ✿ {filteredArticles.length}{" "}
                                {filteredArticles.length === 1
                                    ? "story"
                                    : "stories"}{" "}
                                found
                            </span>

                            <label className="sort-control">
                                <span>Sort by</span>
                                <select
                                    value={sortOrder}
                                    onChange={(e) =>
                                        setSortOrder(e.target.value)
                                    }
                                    aria-label="Sort stories"
                                >
                                    <option value="newest">Newest first</option>
                                    <option value="oldest">Oldest first</option>
                                    <option value="az">A – Z</option>
                                </select>
                            </label>
                        </div>

                        {(selectedCategory !== "all" ||
                            sortOrder !== "newest") && (
                                <button
                                    type="button"
                                    className="clear-all-filters"
                                    onClick={clearFilters}
                                >
                                    ✕ Clear all filters
                                </button>
                            )}
                    </div>

                    {/* Article results */}
                    {loading ? (
                        <p className="posts-message">
                            ✨ Loading your stories...
                        </p>
                    ) : error ? (
                        <p className="posts-message posts-error">
                            {error}
                        </p>
                    ) : articles.length === 0 ? (
                        <div className="posts-message">
                            <h3>No stories yet! 🌷</h3>
                            <p>
                                Be the first to share a story with the
                                Scribbly community.
                            </p>
                        </div>
                    ) : filteredArticles.length === 0 ? (
                        <div className="posts-message no-search-results">
                            <h3>No stories found! 🔎</h3>
                            <p>
                                There are no stories in this category.
                                Try another category.
                            </p>
                            <button
                                type="button"
                                className="about-button"
                                onClick={clearFilters}
                            >
                                Clear filters ↗
                            </button>
                        </div>
                    ) : (
                        <div className="article-grid">
                            {filteredArticles.map((article, index) => (
                                <article
                                    className="article-card"
                                    key={article.id}
                                >
                                    <div
                                        className={`article-art ${getColor(
                                            article.blogType
                                        )}`}
                                        style={
                                            article.imageUrl
                                                ? {
                                                    backgroundImage: `url("${article.imageUrl}")`,
                                                    backgroundSize: "cover",
                                                    backgroundPosition: "center",
                                                }
                                                : {}
                                        }
                                    >
                                        {!article.imageUrl && (
                                            <span className="article-emoji">
                                                ✨
                                            </span>
                                        )}

                                        <span className="category-pill article-category">
                                            {article.blogType || "Story"}
                                        </span>

                                        <span className="article-number">
                                            {String(index + 1).padStart(2, "0")}
                                        </span>
                                    </div>

                                    <div className="article-info">
                                        <div className="article-meta">
                                            <span>
                                                ✎{" "}
                                                {article.authorName ||
                                                    article.authorUsername ||
                                                    "Scribbly Author"}
                                            </span>

                                            <span>
                                                {formatDate(article.createdAt)}
                                            </span>
                                        </div>

                                        <h3>{article.title}</h3>

                                        {article.subtitle && (
                                            <p>{article.subtitle}</p>
                                        )}

                                        <button
                                            type="button"
                                            className="read-link"
                                            onClick={() =>
                                                navigate(`/post/${article.id}`)
                                            }
                                        >
                                            Read story <span>↗</span>
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                {/* ================= ABOUT ================= */}
                <section className="about-section" id="about">
                    <div
                        className="about-doodle about-doodle-left"
                        aria-hidden="true"
                    >
                        ✿
                    </div>

                    <div className="about-content">
                        <span className="section-kicker">
                            A LITTLE ABOUT US
                        </span>

                        <h2>
                            More than words.
                            <br />
                            A place to <span>belong.</span>
                        </h2>

                        <p>
                            Scribbly is a cozy corner of the internet where
                            ideas grow, stories bring people together, and
                            every voice deserves to be heard.
                        </p>

                        <p>
                            Whether you're sharing a little life update,
                            exploring a new idea, or putting your thoughts
                            into words, there's always room for your story here.
                        </p>

                        <button
                            className="about-button"
                            onClick={() => navigate("/create-post")}
                        >
                            Share your story <span>↗</span>
                        </button>
                    </div>

                    <div className="about-art">
                        <div className="about-art-circle">
                            <span className="about-book">📖</span>
                            <span className="about-heart">♡</span>
                            <span className="about-sparkle">✦</span>
                        </div>
                        <span className="about-note">made with love ♡</span>
                    </div>

                    <div
                        className="about-doodle about-doodle-right"
                        aria-hidden="true"
                    >
                        ✧
                    </div>
                </section>

                {/* ================= WRITE BANNER ================= */}
                <section className="write-banner" id="write">
                    <div>
                        <span className="section-kicker">
                            YOUR STORY MATTERS
                        </span>

                        <h2>
                            Got a thought to share? <span>♡</span>
                        </h2>

                        <p>
                            Every little idea can become a beautiful story.
                        </p>

                        <button
                            className="publish-post-btn"
                            onClick={() => navigate("/create-post")}
                        >
                            + Write a new post →
                        </button>
                    </div>

                    <div className="write-decoration" aria-hidden="true">
                        ✎
                    </div>
                </section>

                {/* ================= FOOTER ================= */}
                <footer className="home-footer">
                    <div className="footer-top">
                        <div className="footer-brand">
                            <a href="/home" className="home-logo">
                                scribbly<span>.</span>
                            </a>

                            <p>
                                A little space for every story.
                                <br />
                                Write freely, share kindly, and let your ideas
                                bloom.
                            </p>

                            <span className="footer-made">
                                Made with ♡ for storytellers
                            </span>
                        </div>

                        <div className="footer-links">
                            <div className="footer-column">
                                <h4>Explore</h4>
                                <a href="/home">Home</a>
                                <a href="#articles">Explore stories</a>
                                <a href="#categories">Categories</a>
                            </div>

                            <div className="footer-column">
                                <h4>Discover</h4>
                                <a href="#about">About Scribbly</a>
                                <a href="#articles">Recent stories</a>
                                <a href="#write">Write a story</a>
                            </div>

                            <div className="footer-column">
                                <h4>Your space</h4>
                                <button
                                    onClick={() => navigate("/create-post")}
                                >
                                    Create Post
                                </button>
                                <button onClick={() => navigate("/profile")}>
                                    My Profile ♡
                                </button>
                                <button onClick={handleLogout}>
                                    Log out ↗
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <span>© 2026 Scribbly. All rights reserved.</span>
                        <span>Every thought has a story. ✿</span>
                    </div>
                </footer>
            </main>

            {/* ================= SEARCH OVERLAY ================= */}
            {isSearchOpen && (
                <div
                    className="scribbly-search-overlay"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            closeSearch();
                        }
                    }}
                >
                    <section
                        className="scribbly-search-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Search Scribbly stories"
                    >
                        {/* Search heading */}
                        <div className="search-modal-heading">
                            <div>
                                <span className="section-kicker">
                                    FIND YOUR NEXT FAVORITE STORY
                                </span>

                                <h2>
                                    Search for <span>something lovely.</span>
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="search-modal-close"
                                onClick={closeSearch}
                                aria-label="Close search"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Search bar */}
                        <form
                            className="search-modal-form"
                            onSubmit={handleSearchSubmit}
                        >
                            <span className="search-modal-icon">⌕</span>

                            <input
                                type="search"
                                placeholder="Search stories, titles, authors..."
                                value={searchInput}
                                onChange={(e) => {
                                    setSearchInput(e.target.value);
                                    setShowSearchResults(false);
                                    setSearchTerm("");
                                }}
                                autoFocus
                                aria-label="Search stories"
                            />

                            {searchInput && (
                                <button
                                    type="button"
                                    className="search-modal-clear"
                                    onClick={() => {
                                        setSearchInput("");
                                        setSearchTerm("");
                                        setShowSearchResults(false);
                                    }}
                                    aria-label="Clear search"
                                >
                                    ✕
                                </button>
                            )}

                            <button
                                type="submit"
                                className="search-modal-submit"
                            >
                                Search ↗
                            </button>
                        </form>

                        {/* Suggestions while typing */}
                        {searchInput.trim() && !showSearchResults && (
                            <div className="search-suggestions-panel">
                                {/* USER SUGGESTIONS */}
                                <div className="search-panel-label">
                                    <span>♡</span> People
                                </div>

                                {userSearchLoading ? (
                                    <p className="search-no-suggestions">
                                        ✨ Finding people...
                                    </p>
                                ) : userSuggestions.length > 0 ? (
                                    userSuggestions.slice(0, 6).map((user) => (
                                        <button
                                            type="button"
                                            className="search-suggestion-item"
                                            key={`user-${user.id}`}
                                            onClick={() => handleUserClick(user)}
                                        >
                                            <span className="suggestion-icon">
                                                {user.profilePic ? (
                                                    <img
                                                        src={
                                                            user.profilePic.startsWith("http")
                                                                ? user.profilePic
                                                                : `http://localhost:5000${user.profilePic}`
                                                        }
                                                        alt=""
                                                        style={{
                                                            width: "32px",
                                                            height: "32px",
                                                            borderRadius: "50%",
                                                            objectFit: "cover",
                                                        }}
                                                    />
                                                ) : (
                                                    "♡"
                                                )}
                                            </span>

                                            <span className="suggestion-text">
                                                <strong>
                                                    {user.name || user.username || "Scribbly User"}
                                                </strong>
                                                <small>
                                                    @{user.username || "user"}
                                                </small>
                                            </span>

                                            <span className="suggestion-arrow">↗</span>
                                        </button>
                                    ))
                                ) : (
                                    <p className="search-no-suggestions">
                                        No matching people found.
                                    </p>
                                )}

                                {/* ARTICLE SUGGESTIONS */}
                                <div className="search-panel-label" style={{ marginTop: "18px" }}>
                                    <span>✎</span> Matching stories
                                </div>

                                {searchSuggestions.length > 0 ? (
                                    searchSuggestions.map((article) => (
                                        <button
                                            type="button"
                                            className="search-suggestion-item"
                                            key={`article-${article.id}`}
                                            onClick={() => handleSuggestionClick(article)}
                                        >
                                            <span className="suggestion-icon">✎</span>

                                            <span className="suggestion-text">
                                                <strong>
                                                    {article.title || "Untitled story"}
                                                </strong>
                                                <small>
                                                    {article.authorName ||
                                                        article.authorUsername ||
                                                        "Scribbly Author"}
                                                    {" · "}
                                                    {article.blogType || "Story"}
                                                </small>
                                            </span>

                                            <span className="suggestion-arrow">↗</span>
                                        </button>
                                    ))
                                ) : (
                                    <p className="search-no-suggestions">
                                        No matching stories found.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Results after Enter */}
                        {showSearchResults && (
                            <div className="search-modal-results">
                                <div className="search-results-heading">
                                    <div>
                                        <span className="section-kicker">
                                            YOUR LITTLE DISCOVERY
                                        </span>

                                        <h3>
                                            Search results <span>♡</span>
                                        </h3>

                                        <p>
                                            Results for <strong>"{searchTerm}"</strong>
                                        </p>
                                    </div>
                                </div>

                                {/* PEOPLE RESULTS */}
                                <div className="search-results-section">
                                    <div className="search-panel-label">
                                        <span>♡</span> People
                                        <span className="search-results-count">
                                            {userSearchResults.length}
                                        </span>
                                    </div>

                                    {userSearchLoading ? (
                                        <p className="posts-message">
                                            ✨ Finding people...
                                        </p>
                                    ) : userSearchResults.length === 0 ? (
                                        <p className="search-no-suggestions">
                                            No matching people found.
                                        </p>
                                    ) : (
                                        <div className="search-user-results">
                                            {userSearchResults.map((user) => (
                                                <button
                                                    type="button"
                                                    className="search-suggestion-item"
                                                    key={`result-user-${user.id}`}
                                                    onClick={() => handleUserClick(user)}
                                                >
                                                    <span className="suggestion-icon">
                                                        {user.profilePic ? (
                                                            <img
                                                                src={
                                                                    user.profilePic.startsWith("http")
                                                                        ? user.profilePic
                                                                        : `http://localhost:5000${user.profilePic}`
                                                                }
                                                                alt=""
                                                                style={{
                                                                    width: "38px",
                                                                    height: "38px",
                                                                    borderRadius: "50%",
                                                                    objectFit: "cover",
                                                                }}
                                                            />
                                                        ) : (
                                                            (user.name || user.username || "U")
                                                                .charAt(0)
                                                                .toUpperCase()
                                                        )}
                                                    </span>

                                                    <span className="suggestion-text">
                                                        <strong>
                                                            {user.name || user.username || "Scribbly User"}
                                                        </strong>
                                                        <small>
                                                            @{user.username || "user"}
                                                            {user.bio ? ` · ${user.bio}` : ""}
                                                        </small>
                                                    </span>

                                                    <span className="suggestion-arrow">View profile ↗</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* STORY RESULTS */}
                                <div className="search-results-section" style={{ marginTop: "28px" }}>
                                    <div className="search-panel-label">
                                        <span>✎</span> Stories
                                        <span className="search-results-count">
                                            {searchResults.length}
                                        </span>
                                    </div>

                                    {loading ? (
                                        <p className="posts-message">
                                            ✨ Loading stories...
                                        </p>
                                    ) : error ? (
                                        <p className="posts-message posts-error">
                                            {error}
                                        </p>
                                    ) : searchResults.length === 0 ? (
                                        <div className="search-empty-state">
                                            <span>🔎</span>
                                            <h3>No stories found!</h3>
                                            <p>
                                                Try another keyword to discover a story.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="search-modal-results-grid">
                                            {searchResults.map((article, index) => (
                                                <article
                                                    className="article-card"
                                                    key={article.id}
                                                >
                                                    <div
                                                        className={`article-art ${getColor(
                                                            article.blogType
                                                        )}`}
                                                        style={
                                                            article.imageUrl
                                                                ? {
                                                                    backgroundImage: `url("${article.imageUrl}")`,
                                                                    backgroundSize: "cover",
                                                                    backgroundPosition: "center",
                                                                }
                                                                : {}
                                                        }
                                                    >
                                                        {!article.imageUrl && (
                                                            <span className="article-emoji">✨</span>
                                                        )}

                                                        <span className="category-pill article-category">
                                                            {article.blogType || "Story"}
                                                        </span>

                                                        <span className="article-number">
                                                            {String(index + 1).padStart(2, "0")}
                                                        </span>
                                                    </div>

                                                    <div className="article-info">
                                                        <div className="article-meta">
                                                            <span>
                                                                ✎ {article.authorName ||
                                                                    article.authorUsername ||
                                                                    "Scribbly Author"}
                                                            </span>
                                                            <span>
                                                                {formatDate(article.createdAt)}
                                                            </span>
                                                        </div>

                                                        <h3>
                                                            {article.title || "Untitled story"}
                                                        </h3>

                                                        {article.subtitle && (
                                                            <p>{article.subtitle}</p>
                                                        )}

                                                        <button
                                                            type="button"
                                                            className="read-link"
                                                            onClick={() => {
                                                                closeSearch();
                                                                navigate(`/post/${article.id}`);
                                                            }}
                                                        >
                                                            Read story <span>↗</span>
                                                        </button>
                                                    </div>
                                                </article>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Suggested categories */}
                        {!showSearchResults && (
                            <div className="search-modal-categories">
                                <span className="filter-label">
                                    Explore by category
                                </span>

                                <div className="search-category-filters">
                                    {categories
                                        .filter(
                                            (category) =>
                                                category.value !== "all"
                                        )
                                        .map((category) => (
                                            <button
                                                key={category.value}
                                                type="button"
                                                className="search-category-btn"
                                                onClick={() =>
                                                    handleSearchCategory(
                                                        category.value
                                                    )
                                                }
                                            >
                                                {category.label}
                                            </button>
                                        ))}
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}

export default Home;