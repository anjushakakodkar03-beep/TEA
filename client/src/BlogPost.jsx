
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import "./BlogPost.css";

function BlogPost() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:5000/api/posts/${id}`
        );

        if (!response.ok) {
          throw new Error("Could not load this story.");
        }

        const data = await response.json();
        setPost(data);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="blog-post-message">
        ✨ Loading your story...
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="blog-post-message">
        <p>{error || "Story not found."}</p>
        <button
          className="back-home-btn"
          onClick={() => navigate("/home")}
        >
          ← Back to Home
        </button>
      </div>
    );
  }

  // Handle contentJson stored as either an array or JSON string
  let content = [];

  try {
    const savedContent =
      typeof post.contentJson === "string"
        ? JSON.parse(post.contentJson)
        : post.contentJson;

    content = Array.isArray(savedContent) ? savedContent : [];
  } catch {
    content = [];
  }

  const author =
    post.authorName ||
    post.authorUsername ||
    "Scribbly Author";

  return (
    <main className="blog-post-page">
      <button
        className="back-home-btn"
        onClick={() => navigate("/home")}
      >
        ← Back to Home
      </button>

      <div className="blog-post-layout">
        {/* LEFT SIDE — Cover Image */}
        <aside className="blog-post-image-panel">
          {post.imageUrl ? (
            <img
              className="blog-post-cover"
              src={post.imageUrl}
              alt={post.title || "Story cover"}
            />
          ) : (
            <div className="blog-post-cover-placeholder">
              <span>📖</span>
              <p>A little story for you ♡</p>
            </div>
          )}

          <span className="image-note">
            A STORY FOR YOU ♡
          </span>
        </aside>

        {/* RIGHT SIDE — Article */}
        <article className="blog-post-article">
          <span className="story-label">
            {post.blogType || "A LITTLE STORY"}
          </span>

          <h1 className="blog-post-title">
            {post.title}
          </h1>

          {post.subtitle && (
            <h2 className="blog-post-subtitle">
              {post.subtitle}
            </h2>
          )}

          <div className="blog-post-author">
            <span className="author-avatar">
              {author.charAt(0).toUpperCase()}
            </span>

            <div>
              <p className="author-name">{author}</p>
              <p className="author-caption">
                A little story from Scribbly ♡
              </p>
            </div>
          </div>

          <div className="story-divider" />

          <div className="blog-post-content">
            {content.length > 0 ? (
              content.map((block, index) => (
                <div key={index} className="story-block">
                  {block.html ? (
                    <div
                      className="story-html"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(block.html),
                      }}
                    />
                  ) : block.text ? (
                    <p className="story-paragraph">
                      {block.text}
                    </p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="story-paragraph">
                No story content is available yet.
              </p>
            )}
          </div>

          <div className="story-ending">
            ♡ Thanks for reading my little story ♡
          </div>
        </article>
      </div>
    </main>
  );
}

export default BlogPost;