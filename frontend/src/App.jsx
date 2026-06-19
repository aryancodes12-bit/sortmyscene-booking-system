import { useLocation } from "react-router";

import Navbar from "./components/common/Navbar";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  const location = useLocation();

  const hideNavbar =
    location.pathname === "/auth";

  return (
    <div className="app-shell">
      {!hideNavbar && <Navbar />}

      <AppRoutes />
    </div>
  );
}