import { useState } from "react";

import AuthModal from "./components/auth/AuthModal";
import Navbar from "./components/common/Navbar";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  const [authOpen, setAuthOpen] =
    useState(false);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar
        onOpenAuth={() => setAuthOpen(true)}
      />

      <AppRoutes />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
      />
    </div>
  );
}