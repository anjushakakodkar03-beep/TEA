
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./CreatePost.css";

function CreatePost() {
    const navigate = useNavigate();

    const editorRef = useRef(null);
    const coverInputRef = useRef(null);
    const inlineImageRef = useRef(null);

    const [formData, setFormData] = useState({
        title: "",
        subtitle: "",
        blogType: "Lifestyle",
    });

    const [coverImage, setCoverImage] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // Read and validate image files
    const readImage = (file, callback) => {
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setMessage("Please select a valid image file.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setMessage("Please choose an image smaller than 5 MB.");
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            callback(reader.result);
            setMessage("");
        };

        reader.onerror = () => {
            setMessage("Could not read the selected image.");
        };

        reader.readAsDataURL(file);
    };

    // Upload cover photo
    const handleCoverUpload = (e) => {
        const file = e.target.files?.[0];

        readImage(file, (imageData) => {
            setCoverImage(imageData);
        });

        e.target.value = "";
    };

    // Insert image inside the story
    const handleInlineImage = (e) => {
        const file = e.target.files?.[0];

        readImage(file, (imageData) => {
            const editor = editorRef.current;

            if (!editor) return;

            editor.focus();

            document.execCommand(
                "insertHTML",
                false,
                `<img src="${imageData}" alt="Story image" class="story-inline-image" />`
            );
        });

        e.target.value = "";
    };

    // Rich text editor commands
    const runCommand = (command, value = null) => {
        editorRef.current?.focus();
        document.execCommand(command, false, value);
    };

    const handleFont = (e) => {
        runCommand("fontName", e.target.value);
    };

    const handleFontSize = (e) => {
        runCommand("fontSize", e.target.value);
    };

    const handleTextColor = (e) => {
        runCommand("foreColor", e.target.value);
    };

    const handleHighlight = (e) => {
        runCommand("hiliteColor", e.target.value);
    };

    // Publish story
    const handlePublish = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/");
                return;
            }

            const editor = editorRef.current;
            const html = editor?.innerHTML || "";
            const plainText = editor?.innerText?.trim() || "";

            if (!plainText) {
                setMessage("Please write something in your story.");
                return;
            }

            const response = await fetch(
                "http://localhost:5000/api/posts",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        title: formData.title,
                        subtitle: formData.subtitle,
                        blogType: formData.blogType,
                        imageUrl: coverImage || null,
                        vibeColor: "#F6B8C8",
                        alignment: "left",
                        contentJson: [
                            {
                                type: "html",
                                html,
                                text: plainText,
                            },
                        ],
                        overlays: [],
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Could not publish post."
                );
            }

            navigate("/home");
        } catch (error) {
            setMessage(
                error.message || "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-post-page">
            {/* Pastel scrapbook doodles */}
            <div className="doodle doodle-book" aria-hidden="true">
                📚
            </div>

            <div className="doodle doodle-pencils" aria-hidden="true">
                ✏️
            </div>

            <div className="doodle doodle-notebook" aria-hidden="true">
                📖
            </div>

            <div className="doodle doodle-flower" aria-hidden="true">
                🌼
            </div>

            <div className="doodle doodle-heart" aria-hidden="true">
                ♡
            </div>

            <div className="doodle doodle-star" aria-hidden="true">
                ✦
            </div>

            <div className="doodle doodle-note" aria-hidden="true">
                💌
            </div>

            <div className="doodle doodle-sparkle" aria-hidden="true">
                ✧
            </div>

            {/* Header */}
            <header className="create-post-header">
                <a href="/home" className="create-post-logo">
                    scribbly<span>.</span>
                </a>

                <button
                    type="button"
                    className="back-home-btn"
                    onClick={() => navigate("/home")}
                >
                    ← Back to Home
                </button>
            </header>

            {/* Main content */}
            <main className="create-post-main">
                <div className="create-post-heading">
                    <span className="create-post-kicker">
                        YOUR STORY STARTS HERE ✿
                    </span>

                    <h1>
                        Write your <span>story.</span>
                    </h1>

                    <p>
                        Take a little moment, gather your thoughts,
                        and share something lovely.
                    </p>
                </div>

                <form
                    className="create-post-form"
                    onSubmit={handlePublish}
                >
                    {/* Story title */}
                    <label htmlFor="title">
                        Story title *
                    </label>

                    <input
                        id="title"
                        name="title"
                        placeholder="Give your story a lovely title..."
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />

                    {/* Subtitle */}
                    <label htmlFor="subtitle">
                        Subtitle
                    </label>

                    <input
                        id="subtitle"
                        name="subtitle"
                        placeholder="A little line about your story..."
                        value={formData.subtitle}
                        onChange={handleChange}
                    />

                    {/* Category */}
                    <label htmlFor="blogType">
                        Category
                    </label>

                    <select
                        id="blogType"
                        name="blogType"
                        value={formData.blogType}
                        onChange={handleChange}
                    >
                        <option value="Lifestyle">Lifestyle</option>
                        <option value="Travel">Travel</option>
                        <option value="Personal">Personal</option>
                        <option value="Creativity">Creativity</option>
                    </select>

                    {/* Cover photo */}
                    <label>Cover photo</label>

                    <div className="cover-upload-box">
                        {coverImage ? (
                            <div className="cover-preview">
                                <img
                                    src={coverImage}
                                    alt="Cover preview"
                                />

                                <div className="cover-image-actions">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            coverInputRef.current?.click()
                                        }
                                    >
                                        Change photo
                                    </button>

                                    <button
                                        type="button"
                                        className="remove-image-btn"
                                        onClick={() => setCoverImage("")}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                className="cover-upload-btn"
                                onClick={() =>
                                    coverInputRef.current?.click()
                                }
                            >
                                <span className="upload-icon">＋</span>

                                <strong>
                                    Upload a cover photo
                                </strong>

                                <span>
                                    Choose an image from your computer
                                </span>

                                <small>
                                    PNG, JPG, or WEBP · Max 5 MB
                                </small>
                            </button>
                        )}

                        <input
                            ref={coverInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleCoverUpload}
                            hidden
                        />
                    </div>

                    {/* Story editor */}
                    <label>Your story *</label>

                    <div className="editor-toolbar">
                        <select
                            aria-label="Font family"
                            defaultValue="Arial"
                            onChange={handleFont}
                        >
                            <option value="Arial">Arial</option>
                            <option value="Georgia">Georgia</option>
                            <option value="Verdana">Verdana</option>
                            <option value="Times New Roman">
                                Times New Roman
                            </option>
                            <option value="Courier New">
                                Courier New
                            </option>
                        </select>

                        <select
                            aria-label="Font size"
                            defaultValue="3"
                            onChange={handleFontSize}
                        >
                            <option value="2">Small</option>
                            <option value="3">Normal</option>
                            <option value="4">Large</option>
                            <option value="5">Extra large</option>
                            <option value="6">Huge</option>
                        </select>

                        <div className="toolbar-divider" />

                        <button
                            type="button"
                            title="Bold"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => runCommand("bold")}
                        >
                            <b>B</b>
                        </button>

                        <button
                            type="button"
                            title="Italic"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => runCommand("italic")}
                        >
                            <i>I</i>
                        </button>

                        <button
                            type="button"
                            title="Underline"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => runCommand("underline")}
                        >
                            <u>U</u>
                        </button>

                        <div className="toolbar-divider" />

                        <label
                            className="color-tool"
                            title="Text color"
                        >
                            A
                            <input
                                type="color"
                                aria-label="Text color"
                                defaultValue="#292522"
                                onChange={handleTextColor}
                            />
                        </label>

                        <label
                            className="color-tool highlight-tool"
                            title="Highlight color"
                        >
                            🖍
                            <input
                                type="color"
                                aria-label="Highlight color"
                                defaultValue="#fff176"
                                onChange={handleHighlight}
                            />
                        </label>

                        <div className="toolbar-divider" />

                        <button
                            type="button"
                            title="Align left"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => runCommand("justifyLeft")}
                        >
                            ≡
                        </button>

                        <button
                            type="button"
                            title="Align center"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => runCommand("justifyCenter")}
                        >
                            ☰
                        </button>

                        <button
                            type="button"
                            title="Align right"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => runCommand("justifyRight")}
                        >
                            ≡
                        </button>

                        <div className="toolbar-divider" />

                        <button
                            type="button"
                            title="Bulleted list"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() =>
                                runCommand("insertUnorderedList")
                            }
                        >
                            • List
                        </button>

                        <button
                            type="button"
                            title="Numbered list"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() =>
                                runCommand("insertOrderedList")
                            }
                        >
                            1. List
                        </button>

                        <button
                            type="button"
                            title="Insert image"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() =>
                                inlineImageRef.current?.click()
                            }
                        >
                            ＋ Image
                        </button>

                        <input
                            ref={inlineImageRef}
                            type="file"
                            accept="image/*"
                            onChange={handleInlineImage}
                            hidden
                        />
                    </div>

                    <div
                        ref={editorRef}
                        className="story-editor"
                        contentEditable
                        suppressContentEditableWarning
                        role="textbox"
                        aria-label="Your story"
                        aria-multiline="true"
                        data-placeholder="Start writing your thoughts here..."
                    />

                    {/* Error message */}
                    {message && (
                        <p
                            className="create-post-message"
                            role="alert"
                        >
                            {message}
                        </p>
                    )}

                    {/* Actions */}
                    <div className="create-post-actions">
                        <button
                            type="button"
                            className="cancel-post-btn"
                            onClick={() => navigate("/home")}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="publish-post-btn"
                            disabled={loading}
                        >
                            {loading
                                ? "Publishing..."
                                : "Publish story →"}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}

export default CreatePost;