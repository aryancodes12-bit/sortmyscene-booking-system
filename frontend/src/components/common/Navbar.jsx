import { LogOut } from "lucide-react";
import { Link } from "react-router";

import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
    const {
        user,
        isAuthenticated,
        initializing,
        logout,
    } = useAuth();

    return (
        <header className="top-nav">
            <nav className="nav-shell">
                <Link
                    to="/"
                    className="brand"
                    aria-label="SortMyScene home"
                >
                    <span className="brand-mark">
                        🎭
                    </span>

                    <span className="brand-word">
                        SORT<span>MY</span>SCENE
                    </span>
                </Link>

                <div className="nav-location">
                    ◉ MUMBAI
                </div>

                <div className="nav-actions">
                    {initializing ? (
                        <span className="nav-skeleton" />
                    ) : isAuthenticated ? (
                        <>
                            <span className="nav-user">
                                👤 {user.name}
                            </span>

                            <button
                                type="button"
                                className="nav-logout"
                                onClick={logout}
                            >
                                <LogOut size={14} />
                                LOGOUT
                            </button>
                        </>
                    ) : (
                        <Link
                            to="/auth"
                            className="nav-login"
                        >
                            LOGIN
                        </Link>
                    )}
                </div>
            </nav>
        </header>
    );
}