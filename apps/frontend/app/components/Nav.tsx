"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { parseJwtPayload } from "@/lib/jwt";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function navLinkClass(pathname: string, href: string, base = "text-gray-600 hover:text-gray-900") {
  return isActive(pathname, href) ? "font-semibold text-blue-600" : base;
}

export default function Nav() {
  const pathname = usePathname();
  const { token, logout, isReady } = useAuth();
  const role = token ? parseJwtPayload(token).role : null;
  const isAdmin = role === "ADMIN" || role === "LIBRARIAN";

  if (!isReady) return null;

  return (
    <nav className="flex flex-wrap items-center gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4">
      <Link
        href="/"
        className={pathname === "/" ? "font-semibold text-blue-600 hover:text-blue-700" : "font-semibold text-gray-900 hover:text-blue-600"}
      >
        Library
      </Link>
      <Link href="/books" className={navLinkClass(pathname, "/books")}>
        Books
      </Link>
      {token && (
        <>
          <Link href="/me/loans" className={navLinkClass(pathname, "/me/loans")}>
            My loans
          </Link>
          {isAdmin && (
            <>
              <Link href="/admin/books" className={navLinkClass(pathname, "/admin/books")}>
                Manage books
              </Link>
              <Link href="/admin/loans" className={navLinkClass(pathname, "/admin/loans")}>
                Manage loans
              </Link>
              {role === "ADMIN" && (
                <Link href="/admin/users" className={navLinkClass(pathname, "/admin/users")}>
                  Users
                </Link>
              )}
            </>
          )}
        </>
      )}
      <div className="ml-auto flex items-center gap-4">
        {token ? (
          <button
            type="button"
            onClick={logout}
            className="rounded bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300"
          >
            Log out
          </button>
        ) : (
          <Link
            href="/login"
            className={
              pathname === "/login"
                ? "rounded bg-blue-700 px-3 py-1.5 text-sm font-medium text-white ring-2 ring-blue-500 ring-offset-2"
                : "rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            }
          >
            Log in
          </Link>
        )}
      </div>
    </nav>
  );
}
