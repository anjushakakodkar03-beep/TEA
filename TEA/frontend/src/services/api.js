const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const request = async (path, options = {}) => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
        ...options,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
};

const authHeader = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

export default {
    register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),

    getPosts: (query = {}) => {
        const params = new URLSearchParams(query);
        return request(`/posts${params.toString() ? `?${params.toString()}` : ''}`);
    },
    getPostById: (id) => request(`/posts/${id}`),
    createPost: (payload, token) =>
        request('/posts', { method: 'POST', headers: authHeader(token), body: JSON.stringify(payload) }),

    getComments: (postId) => request(`/comments/${postId}`),
    addComment: (postId, payload, token) =>
        request(`/comments/${postId}`, {
            method: 'POST',
            headers: authHeader(token),
            body: JSON.stringify(payload),
        }),
};

