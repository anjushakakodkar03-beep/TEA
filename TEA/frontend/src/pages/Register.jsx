import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function Register() {
    const navigate = useNavigate();
    const { register, authLoading } = useAuth();

    const [form, setForm] = useState({ username: '', email: '', password: '', phoneNo: '' });
    const [error, setError] = useState('');

    const onChange = (e) => setForm((c) => ({ ...c, [e.target.name]: e.target.value }));

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await register(form);
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div style={{ maxWidth: 460, margin: '60px auto', padding: 16 }}>
            <h2>Create account</h2>
            <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
                <input name="username" placeholder="Username" value={form.username} onChange={onChange} required />
                <input name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} required />
                <input name="phoneNo" placeholder="Phone No" value={form.phoneNo} onChange={onChange} required />
                <input name="password" type="password" placeholder="Password" value={form.password} onChange={onChange} required />
                <button disabled={authLoading} type="submit">{authLoading ? 'Creating...' : 'Register'}</button>
                {error ? <div style={{ color: 'crimson' }}>{error}</div> : null}
            </form>
        </div>
    );
}

