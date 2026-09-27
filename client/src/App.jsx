
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { registerUser, loginUser } from "./api/auth";
import "./App.css";

import Home from "./Home";
import CreatePost from "./CreatePost";
import BlogPost from "./BlogPost";
import Profile from "./Profile";
import PublicProfile from "./PublicProfile";

function AuthPage() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phoneNo: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      let data;

      if (isLogin) {
        data = await loginUser({
          email: formData.email,
          password: formData.password,
        });
      } else {
        data = await registerUser(formData);
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
        navigate("/home");
      }

      setMessage(
        isLogin
          ? "Welcome back to Scribbly! 🎉"
          : "Your Scribbly account is ready! 🎉"
      );

      console.log("User response:", data);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scribbly-page">
      <header className="topbar">
        <a href="/" className="logo">
          scribbly<span>.</span>
        </a>
        <span className="tagline">Every thought has a story.</span>
      </header>

      <main className="auth-layout">
        <section className="welcome-panel">
          <div className="doodle doodle-star">✳</div>
          <div className="doodle doodle-heart">♡</div>

          <div className="welcome-content">
            <span className="eyebrow">
              YOUR LITTLE CORNER OF THE INTERNET
            </span>

            <h1>
              Your thoughts.
              <br />
              Your stories.
              <br />
              <span>Your space.</span>
            </h1>

            <p>
              A cozy place to share your ideas, write your heart out,
              and discover stories that stay with you.
            </p>

            <div className="note-card">
              <span className="note-icon">✎</span>

              <div>
                <strong>Dear diary,</strong>
                <p>Every thought deserves a little space.</p>
              </div>

              <span className="note-heart">♡</span>
            </div>
          </div>

          <div className="welcome-footer">
            MADE WITH ♡ FOR THE STORYTELLERS
          </div>
        </section>

        <section className="form-panel">
          <div className="form-card">
            <div className="form-top">
              <span className="form-sticker">✿</span>

              <p className="form-kicker">
                {isLogin ? "HEY, YOU'RE BACK!" : "LET'S GET STARTED"}
              </p>

              <h2>{isLogin ? "Welcome back!" : "Join the story!"}</h2>

              <p className="form-subtitle">
                {isLogin
                  ? "Your next chapter starts here."
                  : "Create an account and let your thoughts bloom."}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <>
                  <label htmlFor="name">Full name</label>
                  <input
                    id="name"
                    name="name"
                    placeholder="Your lovely name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />

                  <label htmlFor="username">Username</label>
                  <input
                    id="username"
                    name="username"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />

                  <label htmlFor="phoneNo">Phone number</label>
                  <input
                    id="phoneNo"
                    name="phoneNo"
                    placeholder="Your phone number"
                    value={formData.phoneNo}
                    onChange={handleChange}
                    required
                  />
                </>
              )}

              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />

              <button
                className="submit-btn"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : isLogin
                    ? "Let's get writing →"
                    : "Create my account →"}
              </button>
            </form>

            {message && (
              <p className="form-message" role="status">
                {message}
              </p>
            )}

            <div className="switch-form">
              {isLogin ? "New to Scribbly?" : "Already have an account?"}

              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setMessage("");
                }}
              >
                {isLogin ? " Sign up" : " Log in"}
              </button>
            </div>

            <p className="form-bottom">
              A LITTLE SPACE TO BE YOURSELF ♡
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/create-post" element={<CreatePost />} />
        <Route path="/post/:id" element={<BlogPost />} />
        <Route path="/profile" element={<Profile />} />

        {/* Public profile page */}
        <Route
          path="/user/:username"
          element={<PublicProfile />}
        />

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;