"use client";

import { createClient } from "@/infrastructure/supabase/client";
import type { CompanyWithProfile } from "@/domain/entities/company";
import type { LicenseType } from "@/domain/enums";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface SessionUser {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

interface CompanyContextValue {
  user: SessionUser | null;
  company: CompanyWithProfile | null;
  companyId: string | null;
  isSystemAdmin: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextValue>({
  user: null,
  company: null,
  companyId: null,
  isSystemAdmin: false,
  loading: true,
  refresh: async () => {},
  signOut: async () => {},
});

function mapSessionUser(
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  } | null
): SessionUser | null {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? null,
    name:
      (meta.full_name as string) ??
      (meta.name as string) ??
      user.email?.split("@")[0] ??
      null,
    avatarUrl: (meta.avatar_url as string) ?? (meta.picture as string) ?? null,
  };
}

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [company, setCompany] = useState<CompanyWithProfile | null>(null);
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setCompany(null);
    setIsSystemAdmin(false);
    window.location.href = "/admin";
  }, []);

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      setUser(null);
      setCompany(null);
      setIsSystemAdmin(false);
      setLoading(false);
      return;
    }

    setUser(mapSessionUser(authUser));
    const user = authUser;

    const { data: adminRow } = await supabase
      .from("system_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    setIsSystemAdmin(!!adminRow);

    const { data: membership } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!membership) {
      setCompany(null);
      setLoading(false);
      return;
    }

    const { data: co } = await supabase
      .from("companies")
      .select("*")
      .eq("id", membership.company_id)
      .single();

    const { data: profile } = await supabase
      .from("company_profiles")
      .select("*")
      .eq("company_id", membership.company_id)
      .maybeSingle();

    if (co) {
      setCompany({
        id: co.id,
        name: co.name,
        phone: co.phone,
        licenseType: co.license_type as LicenseType,
        licenseExpiresAt: co.license_expires_at,
        isSetupComplete: co.is_setup_complete,
        profile: profile
          ? {
              companyId: profile.company_id,
              slogan: profile.slogan,
              logoUrl: profile.logo_url,
              bannerUrl: profile.banner_url,
              address: profile.address,
              latitude: profile.latitude,
              longitude: profile.longitude,
              whatsappPhone: profile.whatsapp_phone,
              transferOwnerName: profile.transfer_owner_name,
              transferBank: profile.transfer_bank,
              transferClabe: profile.transfer_clabe,
            }
          : null,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      load();
    });
    return () => subscription.unsubscribe();
  }, [load]);

  return (
    <CompanyContext.Provider
      value={{
        user,
        company,
        companyId: company?.id ?? null,
        isSystemAdmin,
        loading,
        refresh: load,
        signOut,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}
