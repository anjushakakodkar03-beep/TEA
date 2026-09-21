import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

const STORAGE_KEY = 'blog_platform_auth';

export function AuthProvider({ children }) {
    const [auth, setAuth] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : { user: null, token: '' };
    });
    const [authLoading, setAuthLoading] = useState(false);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    }, [auth]);

    const value = useMemo(() => {
        return {
            user: auth.user,
            token: auth.token,
            authLoading,
            isAuthenticated: Boolean(auth.token),
            isAdmin: auth.user?.role === 'admin',
            login: async (payload) => {
                setAuthLoading(true);
                try {
                    const data = await api.login(payload);
                    setAuth({ user: data, token: data.token });
                    return data;
                } finally {
                    setAuthLoading(false);
                }
            },
            register: async (payload) => {
                setAuthLoading(true);
                try {
                    const data = await api.register(payload);
                    setAuth({ user: data, token: data.token });
                    return data;
                } finally {
                    setAuthLoading(false);
                }
            },
            logout: () => setAuth({ user: null, token: '' }),
        };
    }, [auth, authLoading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}

