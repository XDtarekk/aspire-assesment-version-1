"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, type Loan } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { parseJwtPayload } from "@/lib/jwt";

function formatDate(s: string) {
  return new Date(s).toLocaleDateString();
}

function isOverdue(loan: Loan) {
  return !loan.returnedAt && new Date(loan.dueAt) < new Date();
}

export default function AdminLoansPage() {
  const { token, isReady } = useAuth();
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [returningId, setReturningId] = useState<string | null>(null);

  const role = token ? parseJwtPayload(token).role : null;
  const canManage = role === "ADMIN" || role === "LIBRARIAN";

  useEffect(() => {
    if (!isReady) return;
    if (!token || !canManage) {
      router.replace("/login");
      return;
    }
    api.loans
      .list(token)
      .then(setLoans)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [token, isReady, canManage, router]);

  const handleReturn = (loanId: string) => {
    if (!token) return;
    setReturningId(loanId);
    api.loans
      .return(loanId, token)
      .then(() => setLoans((prev) => prev.map((l) => (l.id === loanId ? { ...l, returnedAt: new Date().toISOString() } : l))))
      .catch((e) => setError(e instanceof Error ? e.message : "Return failed"))
      .finally(() => setReturningId(null));
  };

  if (!isReady || !token || !canManage) return null;
  if (loading) return <p className="text-gray-500">Loading loans…</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Manage loans</h1>
      {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Book</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Borrower</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Checked out</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Due</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Returned</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loans.map((loan) => (
              <tr key={loan.id} className={isOverdue(loan) ? "bg-red-50/50" : ""}>
                <td className="px-4 py-3">
                  <Link href={`/books/${loan.book.id}`} className="font-medium text-blue-600 hover:underline">
                    {loan.book.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{loan.user?.email ?? loan.userId}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatDate(loan.checkedOutAt)}</td>
                <td className="px-4 py-3">
                  <span className={isOverdue(loan) ? "font-medium text-red-600" : "text-gray-600"}>
                    {formatDate(loan.dueAt)}
                    {isOverdue(loan) && " (overdue)"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {loan.returnedAt ? formatDate(loan.returnedAt) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {!loan.returnedAt && (
                    <button
                      type="button"
                      onClick={() => handleReturn(loan.id)}
                      disabled={returningId === loan.id}
                      className="rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50"
                    >
                      {returningId === loan.id ? "Returning…" : "Mark returned"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
