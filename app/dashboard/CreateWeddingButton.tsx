"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type CreateWeddingButtonProps = {
  label?: string;
  className?: string;
};

export function CreateWeddingButton({
  label = "New Wedding",
  className,
}: CreateWeddingButtonProps) {
  const router = useRouter();
  const creatingRef = useRef(false);
  const [creating, setCreating] = useState(false);

  async function createWedding() {
    if (creatingRef.current) return;

    creatingRef.current = true;
    setCreating(true);

    try {
      const response = await fetch("/api/weddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        credentials: "include",
      });

      const data = (await response.json().catch(() => ({}))) as {
        id?: string;
        error?: string;
      };

      if (!response.ok || !data.id) {
        throw new Error(data.error ?? "Failed to create wedding project");
      }

      toast.success("Wedding project created.");
      router.push(`/dashboard/weddings/${data.id}`);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create wedding project";
      toast.error(message);
      creatingRef.current = false;
      setCreating(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      className={className}
      onClick={createWedding}
      disabled={creating}
      aria-busy={creating}
    >
      {creating ? "Creating…" : label}
    </Button>
  );
}
