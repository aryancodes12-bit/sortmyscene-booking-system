import {
    Route,
    Routes,
} from "react-router";

import EventDetail from "../pages/EventDetail";
import Home from "../pages/Home";
import NotFound from "../pages/NotFound";

export default function AppRoutes() {
    return (
        <Routes>
            <Route
                path="/"
                element={<Home />}
            />

            <Route
                path="/events/:eventId"
                element={<EventDetail />}
            />

            <Route
                path="*"
                element={<NotFound />}
            />
        </Routes>
    );
}