import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import BlogList from './pages/BlogList.jsx';
import CreatePost from './pages/CreatePost.jsx';
import BlogPost from './pages/BlogPost.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

function RequireAuth({ children }) {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
}

export default function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<BlogList />} />
                <Route
                    path="/create"
                    element={
                        <RequireAuth>
                            <CreatePost />
                        </RequireAuth>
                    }
                />
                <Route path="/posts/:id" element={<BlogPost />} />
            </Routes>
        </AuthProvider>
    );
}

