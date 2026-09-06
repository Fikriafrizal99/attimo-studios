"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CollaborationMember = {
  user_id: string;
  role: "owner" | "collaborator";
  invited_at: string;
  name: string;
  email: string;
};

type PendingInvite = {
  invite_id: string;
  email: string;
  created_at: string;
};

export type CollaborationData = {
  members: CollaborationMember[];
  pending: PendingInvite[];
};

export function CollaboratorManager({
  weddingId,
  initialData,
}: {
  weddingId: string;
  initialData: CollaborationData;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/weddings/${weddingId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error ?? "Failed to invite collaborator");

      const status = payload.data?.status;
      toast.success(
        status === "linked"
          ? "Collaborator added."
          : "Invite saved. Access will activate when this email signs in to Endriya."
      );
      setEmail("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to invite collaborator");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(payload: { userId?: string; inviteId?: string }, key: string) {
    if (busyKey) return;
    setBusyKey(key);
    try {
      const res = await fetch(`/api/weddings/${weddingId}/collaborators`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to remove access");
      toast.success(payload.inviteId ? "Pending invite revoked." : "Collaborator removed.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove access");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-50">Collaborators</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Invite your partner or planner. Collaborators can edit Content and Layout only.
        </p>
      </div>

      <form onSubmit={invite} className="rounded-md border border-white/10 bg-black/15 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="collaborator-email" className="text-xs text-neutral-300">
              Email
            </Label>
            <Input
              id="collaborator-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="partner@example.com"
              required
              maxLength={254}
              autoComplete="email"
              className="border-white/10 bg-[#0E0E10] text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-[#BFA14A]"
            />
          </div>
          <Button
            type="submit"
            disabled={submitting || !email.trim()}
            className="bg-neutral-100 text-neutral-950 hover:bg-neutral-200"
          >
            {submitting ? "Inviting…" : "Invite collaborator"}
          </Button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-neutral-500">
          If the email already has an Endriya account, access is added immediately. Otherwise the invite stays pending and is claimed automatically after sign-up or sign-in with the same email.
        </p>
      </form>

      <section className="overflow-hidden rounded-md border border-white/10">
        <div className="border-b border-white/10 bg-black/20 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">People with access</p>
        </div>
        <div className="divide-y divide-white/5">
          {initialData.members.map((member) => (
            <div key={member.user_id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium text-neutral-100">{member.name || member.email}</p>
                  <span
                    className={
                      member.role === "owner"
                        ? "rounded-full border border-[#BFA14A]/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#BFA14A]"
                        : "rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-400"
                    }
                  >
                    {member.role}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-neutral-500">{member.email}</p>
              </div>
              {member.role === "collaborator" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busyKey === `member:${member.user_id}`}
                  onClick={() => remove({ userId: member.user_id }, `member:${member.user_id}`)}
                  className="border-white/10 text-neutral-300 hover:bg-white/5 hover:text-neutral-100"
                >
                  {busyKey === `member:${member.user_id}` ? "Removing…" : "Remove"}
                </Button>
              ) : (
                <span className="text-xs text-neutral-600">Project owner</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {initialData.pending.length > 0 && (
        <section className="overflow-hidden rounded-md border border-white/10">
          <div className="border-b border-white/10 bg-black/20 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Pending invites</p>
          </div>
          <div className="divide-y divide-white/5">
            {initialData.pending.map((invite) => (
              <div key={invite.invite_id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm text-neutral-200">{invite.email}</p>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-neutral-500">
                      Pending
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-600">
                    Waiting for an Endriya account using this email.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busyKey === `invite:${invite.invite_id}`}
                  onClick={() => remove({ inviteId: invite.invite_id }, `invite:${invite.invite_id}`)}
                  className="border-white/10 text-neutral-300 hover:bg-white/5 hover:text-neutral-100"
                >
                  {busyKey === `invite:${invite.invite_id}` ? "Revoking…" : "Revoke"}
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
