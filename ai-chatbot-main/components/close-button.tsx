"use client";

import { useRouter } from "next/navigation";
import React from "react";

export function CloseButton({ label = "Закрити" }: { label?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => router.back()}
      className="rounded-md p-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
    >
      ✕
    </button>
  );
}
