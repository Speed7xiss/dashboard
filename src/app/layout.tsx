import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "./theme-toggle";
export const metadata: Metadata = { title: "Nexus — Dashboard", description: "Painel de gestão simples, seguro e moderno." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><body>{children}<ThemeToggle /></body></html>; }
