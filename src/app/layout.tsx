import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/layout/Navbar";
// providers
import { AuthProviders } from "./providers/auth-provider";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import NavbarWrapper from "./components/navbarWrapper/NavBarWrapper";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Soporte TI",
  description: "Gestion de información de Soporte",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProviders>
          <ThemeProvider
            defaultTheme="system" // detecta del sistema el modo oscuro/luz
            enableSystem={true} // Esto habilita la detección
            disableTransitionOnChange
          >
            <NavbarWrapper />
            {/* <Navbar /> */}
            {children}
            <Toaster />
          </ThemeProvider>
        </AuthProviders>
      </body>
    </html>
  );
}
