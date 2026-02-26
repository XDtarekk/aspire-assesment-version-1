"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, type User, type Role } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { parseJwtPayload } from "@/lib/jwt";

export default function AdminUsersPage() {
  const { token, isReady } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [setPasswordFor, setSetPasswordFor] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [setPasswordError, setSetPasswordError] = useState<string | null>(null);
  const [settingPassword, setSettingPassword] = useState(false);

  const role = token ? parseJwtPayload(token).role : null;
  const isAdmin = role === "ADMIN";

  useEffect(() => {
    if (!isReady) return;
    if (!token || !isAdmin) {
      router.replace("/login");
      return;
    }
    api.users
      .list(token)
      .then(setUsers)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [token, isReady, isAdmin, router]);

  const handleRoleChange = (userId: string, newRole: Role) => {
    if (!token) return;
    setUpdatingId(userId);
    api.users
      .updateRole(userId, newRole, token)
      .then((updated) => setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u))))
      .catch((e) => setError(e instanceof Error ? e.message : "Update failed"))
      .finally(() => setUpdatingId(null));
  };

  const openSetPassword = (user: User) => {
    setSetPasswordFor(user);
    setNewPassword("");
    setSetPasswordError(null);
  };

  const handleSetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !setPasswordFor) return;
    if (newPassword.length < 8) {
      setSetPasswordError("Password must be at least 8 characters.");
      return;
    }
    setSetPasswordError(null);
    setSettingPassword(true);
    api.users
      .setPassword(setPasswordFor.id, newPassword, token)
      .then(() => {
        setSetPasswordFor(null);
        setNewPassword("");
      })
      .catch((e) => setSetPasswordError(e instanceof Error ? e.message : "Failed to set password"))
      .finally(() => setSettingPassword(false));
  };

  if (!isReady || !token || !isAdmin) return null;
  if (loading) return <p className="text-gray-500">Loading users…</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Manage users</h1>
      {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Role</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{user.email}</td>
                <td className="px-4 py-3 text-gray-600">{user.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                      disabled={updatingId === user.id}
                      className="rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-50"
                    >
                      <option value="MEMBER">MEMBER</option>
                      <option value="LIBRARIAN">LIBRARIAN</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => openSetPassword(user)}
                      className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Set password
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {setPasswordFor && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-labelledby="set-password-title">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 id="set-password-title" className="mb-2 text-lg font-semibold text-gray-900">Set password</h2>
            <p className="mb-4 text-sm text-gray-600">
              Set a password for <strong>{setPasswordFor.email}</strong> so they can sign in as librarian.
            </p>
            <form onSubmit={handleSetPassword} className="space-y-3">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 8 characters)"
                minLength={8}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoComplete="new-password"
              />
              {setPasswordError && <p className="text-sm text-red-600">{setPasswordError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setSetPasswordFor(null); setNewPassword(""); setSetPasswordError(null); }}
                  disabled={settingPassword}
                  className="flex-1 rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settingPassword}
                  className="flex-1 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {settingPassword ? "Setting…" : "Set password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
