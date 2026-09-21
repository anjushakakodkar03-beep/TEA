import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { useNavigate } from 'react-router-dom';

function uid() {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export default function CreatePost() {
    const navigate = useNavigate();
    const { token } = useAuth();

    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [vibeColor, setVibeColor] = useState('#ffffff');
    const [blogType, setBlogType] = useState('post');
    const [alignment, setAlignment] = useState('center');

    const [headingText, setHeadingText] = useState('');
    const [subheadingText, setSubheadingText] = useState('');
    const [bold, setBold] = useState(true);
    const [italic, setItalic] = useState(false);

    const [imageUrl, setImageUrl] = useState('');

    // Overlays
    const [overlays, setOverlays] = useState([]);
    const addSticker = (type) => {
        setOverlays((cur) => [
            ...cur,
            {
                id: uid(),
                type,
                src: '',
                text: type === 'doodle' ? '✏️' : '✨',
                x: 40,
                y: 30,
                width: 120,
                height: 60,
                rotation: 0,
                opacity: 1,
                zIndex: cur.length + 1,
            },
        ]);
    };

    const contentJson = useMemo(() => {
        const blocks = [];
        if (headingText.trim()) {
            blocks.push({
                kind: 'heading',
                text: headingText,
                marks: { bold, italic },
                align: alignment,
            });
        }
        if (subheadingText.trim()) {
            blocks.push({
                kind: 'subheading',
                text: subheadingText,
                marks: { bold, italic },
                align: alignment,
            });
        }
        return blocks;
    }, [headingText, subheadingText, bold, italic, alignment]);

    const onDrag = (id, e) => {
        const rect = e.currentTarget.parentElement.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setOverlays((cur) => cur.map((o) => (o.id === id ? { ...o, x, y } : o)));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            title,
            subtitle,
            vibeColor,
            blogType,
            alignment,
            imageUrl,
            contentJson,
            overlays,
        };

        const created = await api.createPost(payload, token);
        navigate(`/posts/${created._id}`);
    };

    return (
        <div style={{ maxWidth: 1000, margin: '24px auto', padding: 16 }}>
            <h1>Create Post</h1>

            <form onSubmit={onSubmit} style={{ display: 'grid', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <input required placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    <input placeholder="Subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <label>
                        Vibe color
                        <input type="color" value={vibeColor} onChange={(e) => setVibeColor(e.target.value)} style={{ width: '100%' }} />
                    </label>
                    <label>
                        Blog type
                        <select value={blogType} onChange={(e) => setBlogType(e.target.value)} style={{ width: '100%' }}>
                            <option value="post">post</option>
                            <option value="diary">diary</option>
                            <option value="story">story</option>
                        </select>
                    </label>
                    <label>
                        Alignment
                        <select value={alignment} onChange={(e) => setAlignment(e.target.value)} style={{ width: '100%' }}>
                            <option value="left">left</option>
                            <option value="center">center</option>
                            <option value="right">right</option>
                            <option value="justify">justify</option>
                        </select>
                    </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <input placeholder="Heading" value={headingText} onChange={(e) => setHeadingText(e.target.value)} />
                    <input placeholder="Sub-heading" value={subheadingText} onChange={(e) => setSubheadingText(e.target.value)} />
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input type="checkbox" checked={bold} onChange={(e) => setBold(e.target.checked)} /> Bold
                    </label>
                    <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input type="checkbox" checked={italic} onChange={(e) => setItalic(e.target.checked)} /> Italic
                    </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 12, alignItems: 'end' }}>
                    <input placeholder="Cover image URL (or leave blank)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                    <button type="button" onClick={() => setImageUrl('')}>
                        Clear
                    </button>
                </div>

                <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 12 }}>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                        <button type="button" onClick={() => addSticker('sticker')}>Add sticker</button>
                        <button type="button" onClick={() => addSticker('doodle')}>Add doodle</button>
                    </div>

                    <div
                        style={{
                            position: 'relative',
                            minHeight: 280,
                            borderRadius: 12,
                            background: vibeColor,
                            overflow: 'hidden',
                            border: '1px dashed rgba(0,0,0,0.15)',
                        }}
                    >
                        {overlays.map((o) => (
                            <div
                                key={o.id}
                                draggable
                                onDrag={(e) => onDrag(o.id, e)}
                                onDragEnd={() => { }}
                                style={{
                                    position: 'absolute',
                                    left: o.x,
                                    top: o.y,
                                    width: o.width,
                                    height: o.height,
                                    transform: `rotate(${o.rotation || 0}deg)`,
                                    opacity: o.opacity ?? 1,
                                    zIndex: o.zIndex ?? 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'grab',
                                    userSelect: 'none',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    borderRadius: 10,
                                    background: 'rgba(255,255,255,0.35)',
                                }}
                            >
                                <span style={{ fontSize: 22 }}>{o.text}</span>
                            </div>
                        ))}

                        {overlays.length === 0 ? (
                            <div style={{ padding: 16, opacity: 0.7 }}>
                                Add stickers/doodles, then drag them inside the preview area.
                            </div>
                        ) : null}
                    </div>
                </div>

                <button type="submit" disabled={!token}>Publish</button>
            </form>
        </div>
    );
}

