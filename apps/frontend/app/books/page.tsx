"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BooksPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return <p className="text-gray-500">Redirecting…</p>;
}
