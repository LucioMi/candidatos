import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cadastro de Candidatos",
  description: "App de cadastro com CRUD e tema claro/escuro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100`}
      >
        {/* Logo fixo no canto superior esquerdo */}
        <div className="fixed top-3 left-3 z-50">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur px-3 py-1 shadow-sm">
            <span className="text-sm font-semibold text-black dark:text-white">Desafio - Lucio</span>
          </div>
        </div>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
