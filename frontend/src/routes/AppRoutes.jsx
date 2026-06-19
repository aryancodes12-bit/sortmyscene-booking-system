import { Route, Routes } from "react-router";

import Auth from "../pages/Auth";
import EventDetail from "../pages/EventDetail";
import Home from "../pages/Home";
import NotFound from "../pages/NotFound";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/auth" element={<Auth />} />

            <Route
                path="/events/:eventId"
                element={<EventDetail />}
            />

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}