
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

  // Like state
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Share state
  const [shareMessage, setShareMessage] = useState("");

  // Comment state
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState("");

  // Fetch blog post
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

// Use existing likes value if your backend provides one
setLikeCount(
  Number(data.likesCount || data.likes || 0)
);
      } catch (err) {
  setError(
    err.message || "Something went wrong."
  );
} finally {
  setLoading(false);
}
    };

fetchPost();
  }, [id]);

// Fetch comments
useEffect(() => {
  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      setCommentError("");

      const response = await fetch(
        `http://localhost:5000/api/comments/${id}`
      );

      if (!response.ok) {
        throw new Error("Could not load comments.");
      }

      const data = await response.json();

      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      setCommentError(
        err.message || "Could not load comments."
      );
    } finally {
      setCommentsLoading(false);
    }
  };

  if (id) {
    fetchComments();
  }
}, [id]);

// Handle Like / Unlike
const handleLike = () => {
  if (liked) {
    setLiked(false);

    setLikeCount((count) =>
      Math.max(0, count - 1)
    );
  } else {
    setLiked(true);

    setLikeCount((count) => count + 1);
  }
};

// Share article on WhatsApp
const handleWhatsAppShare = () => {
  const articleUrl =
    `${window.location.origin}/post/${id}`;

  const shareText =
    `Check out this story on Scribbly! ✨\n\n` +
    `"${post?.title || "A little story"}"\n\n` +
    articleUrl;

  const whatsappUrl =
    `https://wa.me/?text=${encodeURIComponent(
      shareText
    )}`;

  window.open(
    whatsappUrl,
    "_blank",
    "noopener,noreferrer"
  );
};

// Copy article link
const handleCopyLink = async () => {
  const articleUrl =
    `${window.location.origin}/post/${id}`;

  try {
    await navigator.clipboard.writeText(
      articleUrl
    );

    setShareMessage(
      "Article link copied! 🔗"
    );

    setTimeout(() => {
      setShareMessage("");
    }, 2500);
  } catch (err) {
    setShareMessage(
      "Could not copy the link."
    );

    setTimeout(() => {
      setShareMessage("");
    }, 2500);
  }
};

// Add comment
const handleAddComment = async (e) => {
  e.preventDefault();

  const trimmedComment =
    commentText.trim();

  if (!trimmedComment) {
    setCommentError(
      "Please write a comment first."
    );
    return;
  }

  const token =
    localStorage.getItem("token");

  if (!token) {
    setCommentError(
      "Please log in to add a comment."
    );
    return;
  }

  try {
    setCommentSubmitting(true);
    setCommentError("");

    const response = await fetch(
      `http://localhost:5000/api/comments/${id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: trimmedComment,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
        "Could not add your comment."
      );
    }

    // Add new comment at the top
    setComments((currentComments) => [
      data,
      ...currentComments,
    ]);

    // Clear input
    setCommentText("");
  } catch (err) {
    setCommentError(
      err.message ||
      "Could not add your comment."
    );
  } finally {
    setCommentSubmitting(false);
  }
};

// Scroll to comments
const scrollToComments = () => {
  const commentsSection =
    document.getElementById("comments");

  if (commentsSection) {
    commentsSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
};

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
      <p>
        {error || "Story not found."}
      </p>

      <button
        className="back-home-btn"
        onClick={() => navigate("/home")}
      >
        ← Back to Home
      </button>
    </div>
  );
}

// Handle contentJson stored as either
// an array or JSON string
let content = [];

try {
  const savedContent =
    typeof post.contentJson === "string"
      ? JSON.parse(post.contentJson)
      : post.contentJson;

  content = Array.isArray(savedContent)
    ? savedContent
    : [];
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
            alt={
              post.title ||
              "Story cover"
            }
          />
        ) : (
          <div className="blog-post-cover-placeholder">
            <span>📖</span>

            <p>
              A little story for you ♡
            </p>
          </div>
        )}

        <span className="image-note">
          A STORY FOR YOU ♡
        </span>
      </aside>

      {/* RIGHT SIDE — Article */}
      <article className="blog-post-article">
        <span className="story-label">
          {post.blogType ||
            "A LITTLE STORY"}
        </span>

        <h1 className="blog-post-title">
          {post.title}
        </h1>

        {post.subtitle && (
          <h2 className="blog-post-subtitle">
            {post.subtitle}
          </h2>
        )}

        {/* AUTHOR */}
        <div className="blog-post-author">
          <span className="author-avatar">
            {author
              .charAt(0)
              .toUpperCase()}
          </span>

          <div>
            <p className="author-name">
              {author}
            </p>

            <p className="author-caption">
              A little story from Scribbly ♡
            </p>
          </div>
        </div>

        <div className="story-divider" />

        {/* ARTICLE CONTENT */}
        <div className="blog-post-content">
          {content.length > 0 ? (
            content.map(
              (block, index) => (
                <div
                  key={index}
                  className="story-block"
                >
                  {block.html ? (
                    <div
                      className="story-html"
                      dangerouslySetInnerHTML={{
                        __html:
                          DOMPurify.sanitize(
                            block.html
                          ),
                      }}
                    />
                  ) : block.text ? (
                    <p className="story-paragraph">
                      {block.text}
                    </p>
                  ) : null}
                </div>
              )
            )
          ) : (
            <p className="story-paragraph">
              No story content is
              available yet.
            </p>
          )}
        </div>
        <div className="story-ending">
          ♡ Thanks for reading my
          little story ♡
        </div>

        {/* ACTIONS */}
        <div className="story-actions">
          {/* LIKE */}
          <button
            type="button"
            className={`story-action-btn ${liked ? "liked" : ""
              }`}
            onClick={handleLike}
            aria-label={
              liked
                ? "Unlike this story"
                : "Like this story"
            }
          >
            <span className="action-icon">
              {liked ? "♥" : "♡"}
            </span>

            <span>
              {likeCount}{" "}
              {likeCount === 1
                ? "Like"
                : "Likes"}
            </span>
          </button>

          {/* COMMENT */}
          <button
            type="button"
            className="story-action-btn"
            onClick={scrollToComments}
          >
            <span className="action-icon">
              💬
            </span>

            <span>
              {comments.length}{" "}
              {comments.length === 1
                ? "Comment"
                : "Comments"}
            </span>
          </button>

          {/* WHATSAPP */}
          <button
            type="button"
            className="story-action-btn whatsapp-share-btn"
            onClick={handleWhatsAppShare}
          >
            <span className="action-icon">
              💚
            </span>

            <span>
              WhatsApp
            </span>
          </button>

          {/* COPY LINK */}
          <button
            type="button"
            className="story-action-btn"
            onClick={handleCopyLink}
          >
            <span className="action-icon">
              🔗
            </span>

            <span>
              Copy Link
            </span>
          </button>
        </div>

        {shareMessage && (
          <p className="share-message">
            {shareMessage}
          </p>
        )}

        {/* COMMENTS */}
        <section
          id="comments"
          className="comments-section"
        >
          <div className="comments-heading">
            <div>
              <span className="comments-kicker">
                LET'S TALK
              </span>

              <h2>
                Comments
              </h2>
            </div>

            <span className="comments-count">
              {comments.length}
            </span>
          </div>

          {/* ADD COMMENT */}
          <form
            className="comment-form"
            onSubmit={handleAddComment}
          >
            <textarea
              value={commentText}
              onChange={(e) =>
                setCommentText(
                  e.target.value
                )
              }
              placeholder="Write your thoughts..."
              rows={4}
              maxLength={1000}
            />

            <div className="comment-form-bottom">
              <span className="comment-hint">
                Share your thoughts ♡
              </span>

              <button
                type="submit"
                className="comment-submit-btn"
                disabled={
                  commentSubmitting ||
                  !commentText.trim()
                }
              >
                {commentSubmitting
                  ? "Posting..."
                  : "Post Comment →"}
              </button>
            </div>
          </form>

          {commentError && (
            <p
              className="comment-error"
              role="alert"
            >
              {commentError}
            </p>
          )}

          {/* COMMENTS LIST */}
          <div className="comments-list">
            {commentsLoading ? (
              <p className="comments-status">
                ✨ Loading comments...
              </p>
            ) : comments.length === 0 ? (
              <div className="no-comments">
                <span>💭</span>

                <p>
                  No comments yet.
                </p>

                <small>
                  Be the first to share
                  your thoughts!
                </small>
              </div>
            ) : (
              comments.map(
                (comment) => {
                  const commentAuthor =
                    comment.authorName ||
                    comment.authorUsername ||
                    "Scribbly User";

                  return (
                    <div
                      className="comment-card"
                      key={comment.id}
                    >
                      <div className="comment-avatar">
                        {commentAuthor
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="comment-content">
                        <div className="comment-header">
                          <div>
                            <strong>
                              {
                                commentAuthor
                              }
                            </strong>

                            {comment.authorUsername && (
                              <span>
                                @
                                {
                                  comment.authorUsername
                                }
                              </span>
                            )}
                          </div>

                          {comment.createdAt && (
                            <small>
                              {new Date(
                                comment.createdAt
                              ).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month:
                                    "short",
                                  year:
                                    "numeric",
                                }
                              )}
                            </small>
                          )}
                        </div>

                        <p>
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  );
                }
              )
            )}
          </div>
        </section>

      </article>
    </div>
  </main>
);
}

export default BlogPost;
