"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null; // evita FOUC/hidratação incorreta

  const current = theme === "system" ? systemTheme : theme;
  const label = current === "dark" ? "Tema: Escuro" : "Tema: Claro";

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        aria-label="Alternar tema claro/escuro"
        onClick={() => setTheme(current === "dark" ? "light" : "dark")}
        className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-900"
      >
        {label}
      </button>

      <button
        type="button"
        aria-label="Usar tema do sistema"
        onClick={() => setTheme("system")}
        className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-900"
      >
        Sistema
      </button>
    </div>
  );
}