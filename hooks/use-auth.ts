"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/api/client";
import type { SessionUser } from "@/types";

export function useAuth(initialUser?: SessionUser | null) {
  const [user, setUser] = useState<SessionUser | null>(initialUser ?? null);
  const [loading, setLoading] = useState(!initialUser);

  useEffect(() => {
    if (initialUser) {
      setLoading(false);
      return;
    }

    apiRequest<{ user: SessionUser }>("/api/auth/me")
      .then((payload) => setUser(payload.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [initialUser]);

  return { user, loading, setUser };
}
