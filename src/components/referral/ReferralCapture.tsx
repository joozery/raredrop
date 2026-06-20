"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

const STORAGE_KEY = "raredrop_ref";

export function ReferralCapture() {
  const searchParams = useSearchParams();
  const { status } = useSession();
  const appliedRef = useRef(false);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) localStorage.setItem(STORAGE_KEY, ref);
  }, [searchParams]);

  useEffect(() => {
    if (status !== "authenticated" || appliedRef.current) return;
    const code = localStorage.getItem(STORAGE_KEY);
    if (!code) return;

    appliedRef.current = true;
    fetch("/api/user/apply-referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .catch(() => {})
      .finally(() => localStorage.removeItem(STORAGE_KEY));
  }, [status]);

  return null;
}
