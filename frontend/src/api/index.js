import axios from "axios";

export const TOKEN_STORAGE_KEY = "sortmyscene_token";

const api = axios.create({
    baseURL:
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem(
        TOKEN_STORAGE_KEY,
    );

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,

    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem(TOKEN_STORAGE_KEY);

            window.dispatchEvent(
                new CustomEvent("sortmyscene:unauthorized"),
            );
        }

        return Promise.reject(error);
    },
);

export const getApiErrorMessage = (
    error,
    fallback = "Something went wrong",
) => {
    if (!error.response) {
        return "Unable to connect to the server";
    }

    return (
        error.response?.data?.message ||
        fallback
    );
};

export const registerUser = (payload) =>
    api.post("/auth/register", payload);

export const loginUser = (payload) =>
    api.post("/auth/login", payload);

export const getCurrentUser = () =>
    api.get("/auth/me");

export const getEvents = () =>
    api.get("/events");

export const getEvent = (eventId) =>
    api.get(`/events/${eventId}`);

export const reserveSeats = (payload) =>
    api.post("/reserve", payload);

export const confirmBooking = (payload) =>
    api.post("/bookings", payload);

export default api;