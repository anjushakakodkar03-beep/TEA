import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

function renderBlocks(blocks) {
    return blocks.map((b, idx) => {
        if (b.kind === 'heading') {
            return (
                <h1 key={idx} style={{ textAlign: b.align, fontStyle: b.marks?.italic ? 'italic' : 'normal', fontWeight: b.marks?.bold ? 800 : 600 }}>
                    {b.text}
                </h1>
            );
        }
        if (b.kind === 'subheading') {
            return (
                <h3 key={idx} style={{ textAlign: b.align, fontStyle: b.marks?.italic ? 'italic' : 'normal', fontWeight: b.marks?.bold ? 800 : 600 }}>
                    {b.text}
                </h3>
            );
        }
        return (
            <p key={idx} style={{ textAlign: b.align, fontStyle: b.marks?.italic ? 'italic' : 'normal', fontWeight: b.marks?.bold ? 700 : 400 }}>
                {b.text}
            </p>
        );
    });
}

export default function BlogPost() {
    const { id } = useParams();
    const { user, token } = useAuth();

    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');

    useEffect(() => {
        setLoading(true);
        Promise.all([api.getPostById(id), api.getComments(id)])
            .then(([p, c]) => {
                setPost(p);
                setComments(c);
            })
            .finally(() => setLoading(false));
    }, [id]);

    const submitComment = async (e) => {
        e.preventDefault();
        setErr('');
        try {
            const created = await api.addComment(id, { text: commentText }, token);
            setComments((cur) => [created, ...cur]);
            setCommentText('');
        } catch (e) {
            setErr(e.message);
        }
    };

    if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
    if (!post) return <div style={{ padding: 16 }}>Post not found</div>;

    return (
        <div style={{ maxWidth: 900, margin: '24px auto', padding: 16 }}>
            <div style={{ background: post.vibeColor || '#fff', padding: 16, borderRadius: 12 }}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                    by {post.author?.name || 'Unknown'} • {new Date(post.createdAt).toLocaleString()}
                </div>
                <div style={{ marginTop: 8 }}>{renderBlocks(post.contentJson || [])}</div>
                {post.imageUrl ? (
                    <img alt="cover" src={post.imageUrl} style={{ width: '100%', marginTop: 16, borderRadius: 12 }} />
                ) : null}

                {/* Overlays not rendered as draggable editor; show a basic overlay layer */}
                {Array.isArray(post.overlays) && post.overlays.length ? (
                    <div style={{ position: 'relative', marginTop: 16, borderRadius: 12, overflow: 'hidden', minHeight: 220 }}>
                        {post.overlays.map((o) => (
                            <div
                                key={o.id}
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
                                    background: o.type === 'image' ? 'transparent' : 'rgba(255,255,255,0.35)',
                                    borderRadius: 8,
                                }}
                            >
                                {o.type === 'image' && o.src ? <img alt="overlay" src={o.src} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : null}
                                {o.type !== 'image' ? <span style={{ fontWeight: 800 }}>{o.text || o.type}</span> : null}
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>

            <div style={{ marginTop: 24 }}>
                <h2>Comments</h2>
                <form onSubmit={submitComment} style={{ display: 'grid', gap: 10 }}>
                    <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={token ? 'Write a comment...' : 'Login to comment'} required style={{ minHeight: 90 }} />
                    <button disabled={!token} type="submit">Post Comment</button>
                    {err ? <div style={{ color: 'crimson' }}>{err}</div> : null}
                </form>

                <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                    {comments.map((c) => (
                        <div key={c._id} style={{ border: '1px solid #ddd', borderRadius: 10, padding: 12 }}>
                            <div style={{ fontSize: 12, opacity: 0.8 }}>
                                {c.author?.name || 'Unknown'} • {new Date(c.createdAt).toLocaleString()}
                            </div>
                            <div style={{ marginTop: 6 }}>{c.text}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

