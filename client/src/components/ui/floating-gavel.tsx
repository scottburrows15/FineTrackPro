import { Gavel } from "lucide-react";
import { useLocation } from "wouter";

export default function FloatingGavel() {
  const [location, setLocation] = useLocation();

  if (location === "/admin/fines") return null;

  return (
    <button
      onClick={() => setLocation("/admin/fines")}
      className="fixed bottom-[88px] right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-300/40 dark:shadow-red-900/40 flex items-center justify-center hover:from-red-600 hover:to-red-700 active:scale-95 transition-all"
      aria-label="Issue a fine"
      data-testid="floating-gavel-button"
    >
      <Gavel className="w-6 h-6" />
    </button>
  );
}
