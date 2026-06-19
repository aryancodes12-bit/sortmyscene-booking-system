import {
    useEffect,
    useState,
} from "react";

import {
    LockKeyhole,
    Mail,
    User,
    X,
} from "lucide-react";

import { getApiErrorMessage } from "../../api";
import { useAuth } from "../../context/AuthContext";

const initialForm = {
    name: "",
    email: "",
    password: "",
};

export default function AuthModal({
    isOpen,
    onClose,
}) {
    const { login, register } = useAuth();

    const [mode, setMode] = useState("login");
    const [form, setForm] = useState(initialForm);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] =
        useState(false);

    const isRegister = mode === "register";

    useEffect(() => {
        document.body.classList.toggle(
            "modal-open",
            isOpen,
        );

        return () => {
            document.body.classList.remove(
                "modal-open",
            );
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setError("");
            setSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const updateField = (event) => {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const switchMode = () => {
        setMode((current) =>
            current === "login"
                ? "register"
                : "login",
        );

        setError("");
    };

    const submit = async (event) => {
        event.preventDefault();

        setSubmitting(true);
        setError("");

        try {
            if (isRegister) {
                await register({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                });
            } else {
                await login({
                    email: form.email,
                    password: form.password,
                });
            }

            setForm(initialForm);
            onClose();
        } catch (requestError) {
            setError(
                getApiErrorMessage(
                    requestError,
                    isRegister
                        ? "Registration failed"
                        : "Login failed",
                ),
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 px-4 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <section className="surface-glow relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#090909]">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent" />

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close authentication dialog"
                    className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/5 p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                >
                    <X size={18} />
                </button>

                <div className="p-7 sm:p-9">
                    <p className="text-xs font-bold uppercase tracking-[0.35em] text-violet-400">
                        SortMyScene
                    </p>

                    <h2
                        id="auth-title"
                        className="display-font mt-3 text-4xl text-white"
                    >
                        {isRegister
                            ? "JOIN THE NIGHT"
                            : "WELCOME BACK"}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {isRegister
                            ? "Create an account to reserve your seats."
                            : "Log in to continue your booking."}
                    </p>

                    <form
                        className="mt-7 space-y-4"
                        onSubmit={submit}
                    >
                        {isRegister && (
                            <label className="block">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                    Name
                                </span>

                                <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.035] px-4 transition focus-within:border-violet-500">
                                    <User
                                        size={17}
                                        className="text-zinc-500"
                                    />

                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={updateField}
                                        minLength={2}
                                        maxLength={80}
                                        required
                                        autoComplete="name"
                                        placeholder="Your name"
                                        className="w-full bg-transparent px-3 py-3.5 text-sm text-white outline-none placeholder:text-zinc-600"
                                    />
                                </div>
                            </label>
                        )}

                        <label className="block">
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Email
                            </span>

                            <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.035] px-4 transition focus-within:border-violet-500">
                                <Mail
                                    size={17}
                                    className="text-zinc-500"
                                />

                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={updateField}
                                    required
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    className="w-full bg-transparent px-3 py-3.5 text-sm text-white outline-none placeholder:text-zinc-600"
                                />
                            </div>
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Password
                            </span>

                            <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.035] px-4 transition focus-within:border-violet-500">
                                <LockKeyhole
                                    size={17}
                                    className="text-zinc-500"
                                />

                                <input
                                    type="password"
                                    name="password"
                                    value={form.password}
                                    onChange={updateField}
                                    minLength={8}
                                    required
                                    autoComplete={
                                        isRegister
                                            ? "new-password"
                                            : "current-password"
                                    }
                                    placeholder="Minimum 8 characters"
                                    className="w-full bg-transparent px-3 py-3.5 text-sm text-white outline-none placeholder:text-zinc-600"
                                />
                            </div>
                        </label>

                        {error && (
                            <div
                                role="alert"
                                className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                            >
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="mt-2 w-full rounded-xl bg-[#8B5CF6] px-5 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting
                                ? "Please wait..."
                                : isRegister
                                    ? "Create Account"
                                    : "Log In"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-zinc-500">
                        {isRegister
                            ? "Already have an account?"
                            : "New to SortMyScene?"}

                        <button
                            type="button"
                            onClick={switchMode}
                            className="ml-2 font-semibold text-violet-400 transition hover:text-violet-300"
                        >
                            {isRegister
                                ? "Log in"
                                : "Register"}
                        </button>
                    </p>
                </div>
            </section>
        </div>
    );
}