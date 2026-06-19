import { useState } from "react";
import {
    Link,
    useLocation,
    useNavigate,
} from "react-router";

import { getApiErrorMessage } from "../api";
import { useAuth } from "../context/AuthContext";

const INITIAL_FORM = {
    name: "",
    email: "",
    password: "",
};

export default function Auth() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, register } = useAuth();

    const [mode, setMode] = useState("login");
    const [form, setForm] = useState(INITIAL_FORM);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const redirect =
        new URLSearchParams(location.search).get("redirect") || "/";
    const isEventRedirect =
        redirect.startsWith("/events/");

    const helperText =
        mode === "register"
            ? "Create an account to reserve and confirm your seats."
            : isEventRedirect
                ? "Login to continue your seat reservation."
                : "Login to discover events and book seats securely.";
    const updateField = (event) => {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));

        setError("");
    };

    const switchMode = (nextMode) => {
        setMode(nextMode);
        setError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!form.email.trim() || !form.password) {
            setError("All fields required");
            return;
        }

        if (mode === "register" && !form.name.trim()) {
            setError("Name required");
            return;
        }

        setLoading(true);
        setError("");

        try {
            if (mode === "register") {
                await register({
                    name: form.name.trim(),
                    email: form.email.trim(),
                    password: form.password,
                });
            } else {
                await login({
                    email: form.email.trim(),
                    password: form.password,
                });
            }

            navigate(redirect, {
                replace: true,
            });
        } catch (requestError) {
            setError(
                getApiErrorMessage(
                    requestError,
                    mode === "register"
                        ? "Registration failed"
                        : "Login failed",
                ),
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-page">
            <Link
                to="/"
                className="auth-back-link"
                aria-label="Back to home page"
            >
                ← BACK TO HOME
            </Link>
            <section className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-icon">🎭</div>

                    <h1>
                        SORT<span>MY</span>SCENE
                    </h1>

                    <p>{helperText}</p>
                </div>

                <div className="auth-tabs">
                    <button
                        type="button"
                        className={mode === "login" ? "active" : ""}
                        onClick={() => switchMode("login")}
                    >
                        LOGIN
                    </button>

                    <button
                        type="button"
                        className={mode === "register" ? "active" : ""}
                        onClick={() => switchMode("register")}
                    >
                        REGISTER
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {mode === "register" && (
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={updateField}
                            placeholder="Full Name"
                            minLength={2}
                            maxLength={80}
                            autoComplete="name"
                        />
                    )}

                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={updateField}
                        placeholder="Email"
                        autoComplete="email"
                    />

                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={updateField}
                        placeholder="Password"
                        minLength={8}
                        autoComplete={
                            mode === "register"
                                ? "new-password"
                                : "current-password"
                        }
                    />

                    {error && (
                        <p className="auth-error" role="alert">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={loading}
                    >
                        {loading
                            ? "PLEASE WAIT..."
                            : mode === "login"
                                ? "LOGIN →"
                                : "CREATE ACCOUNT →"}
                    </button>
                </form>
                <div className="auth-information">
                    <p>WHY SIGN IN?</p>

                    <div className="auth-information-items">
                        <span>✓ Live seat availability</span>
                        <span>✓ Secure 10-minute reservation</span>
                        <span>✓ Conflict-free booking confirmation</span>
                    </div>
                </div>
            </section>
        </main>
    );
}