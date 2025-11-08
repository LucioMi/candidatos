import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  variable: "--font-ui",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["700"],
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
        className={`${inter.variable} ${playfair.variable} antialiased min-h-dvh bg-[var(--bg)] text-[var(--text)] pt-16 sm:pt-0`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
