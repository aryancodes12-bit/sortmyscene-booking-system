import {
    LogOut,
    MapPin,
    UserRound,
} from "lucide-react";

import { Link } from "react-router";

import { useAuth } from "../../context/AuthContext";

export default function Navbar({
    onOpenAuth,
}) {
    const {
        user,
        isAuthenticated,
        initializing,
        logout,
    } = useAuth();

    return (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.07] bg-black/75 backdrop-blur-xl">
            <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
                <Link
                    to="/"
                    className="display-font text-2xl tracking-wider text-white"
                    aria-label="SortMyScene home"
                >
                    SORTMY
                    <span className="text-[#8B5CF6]">
                        SCENE
                    </span>
                </Link>

                <div className="hidden items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-400 md:flex">
                    <MapPin
                        size={15}
                        className="text-violet-400"
                    />
                    Mumbai
                </div>

                <div className="flex items-center gap-3">
                    {initializing ? (
                        <div className="h-9 w-24 animate-pulse rounded-full bg-white/10" />
                    ) : isAuthenticated ? (
                        <>
                            <div className="hidden items-center gap-2 text-sm text-zinc-300 sm:flex">
                                <UserRound
                                    size={16}
                                    className="text-violet-400"
                                />
                                {user.name}
                            </div>

                            <button
                                type="button"
                                onClick={logout}
                                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-300 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
                            >
                                <LogOut size={15} />
                                <span className="hidden sm:inline">
                                    Log out
                                </span>
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={onOpenAuth}
                            className="rounded-full bg-[#8B5CF6] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-violet-500"
                        >
                            Login
                        </button>
                    )}
                </div>
            </nav>
        </header>
    );
}