"use client";
import { usePathname } from "next/navigation";
import Navbar from "../layout/Navbar";

export default function NavbarWrapper() {
  const pathname = usePathname();

  if (pathname === "/" || pathname === "/login") return null;

  return <Navbar />;
}
