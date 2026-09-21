import React, { useEffect, useState } from 'react';
import api from '../services/api.js';
import { Link } from 'react-router-dom';

export default function BlogList() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getPosts({}).then((data) => setPosts(data)).finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ maxWidth: 900, margin: '24px auto', padding: 16 }}>
            <h1>Blogs</h1>
            <div style={{ marginBottom: 16 }}>
                <Link to="/create">Create Post</Link>
            </div>
            {loading ? <div>Loading...</div> : null}
            <div style={{ display: 'grid', gap: 12 }}>
                {posts.map((p) => (
                    <Link key={p._id} to={`/posts/${p._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, background: p.vibeColor || '#fff' }}>
                            <div style={{ fontWeight: 700 }}>{p.title}</div>
                            {p.subtitle ? <div style={{ opacity: 0.8 }}>{p.subtitle}</div> : null}
                            <div style={{ fontSize: 12, marginTop: 8 }}>
                                by {p.author?.name || 'Unknown'} • {new Date(p.createdAt).toLocaleString()}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

