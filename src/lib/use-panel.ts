import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPanelSession } from "./panel.functions";

const ACTIVE_BRAND_KEY = "onecite.activeBrandId";

export type PanelBrand = {
  id: string;
  name: string;
  domain: string;
  onboarding_step: number;
  onboarding_completed: boolean;
};

export function usePanelSession() {
  const fetchSession = useServerFn(getPanelSession);
  return useQuery({
    queryKey: ["panel-session"],
    queryFn: () => fetchSession(),
    staleTime: 30_000,
  });
}

export function useActiveBrand() {
  const { data, isLoading, refetch } = usePanelSession();
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setActiveId(window.localStorage.getItem(ACTIVE_BRAND_KEY));
  }, []);

  const brands = (data?.brands ?? []) as PanelBrand[];
  const active = brands.find((b) => b.id === activeId) ?? brands[0] ?? null;

  const selectBrand = useCallback((id: string) => {
    if (typeof window !== "undefined") window.localStorage.setItem(ACTIVE_BRAND_KEY, id);
    setActiveId(id);
  }, []);

  return {
    isLoading,
    brands,
    brand: active,
    selectBrand,
    profile: data?.profile ?? null,
    isAdmin: data?.isAdmin ?? false,
    refetch,
  };
}

export function initials(name: string | null | undefined, email: string | null | undefined) {
  const source = (name ?? email ?? "?").trim();
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}
