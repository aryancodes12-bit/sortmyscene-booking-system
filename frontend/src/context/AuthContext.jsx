import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    getCurrentUser,
    loginUser,
    registerUser,
    TOKEN_STORAGE_KEY,
} from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [initializing, setInitializing] =
        useState(true);

    const logout = () => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setUser(null);
    };

    useEffect(() => {
        const restoreSession = async () => {
            const token = localStorage.getItem(
                TOKEN_STORAGE_KEY,
            );

            if (!token) {
                setInitializing(false);
                return;
            }

            try {
                const response = await getCurrentUser();
                setUser(response.data.data.user);
            } catch {
                logout();
            } finally {
                setInitializing(false);
            }
        };

        restoreSession();
    }, []);

    useEffect(() => {
        const handleUnauthorized = () => {
            setUser(null);
        };

        window.addEventListener(
            "sortmyscene:unauthorized",
            handleUnauthorized,
        );

        return () => {
            window.removeEventListener(
                "sortmyscene:unauthorized",
                handleUnauthorized,
            );
        };
    }, []);

    const login = async (credentials) => {
        const response = await loginUser(credentials);

        const {
            token,
            user: authenticatedUser,
        } = response.data.data;

        localStorage.setItem(
            TOKEN_STORAGE_KEY,
            token,
        );

        setUser(authenticatedUser);

        return authenticatedUser;
    };

    const register = async (payload) => {
        const response = await registerUser(payload);

        const {
            token,
            user: authenticatedUser,
        } = response.data.data;

        localStorage.setItem(
            TOKEN_STORAGE_KEY,
            token,
        );

        setUser(authenticatedUser);

        return authenticatedUser;
    };

    const value = useMemo(
        () => ({
            user,
            isAuthenticated: Boolean(user),
            initializing,
            login,
            register,
            logout,
        }),
        [user, initializing],
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider",
        );
    }

    return context;
}