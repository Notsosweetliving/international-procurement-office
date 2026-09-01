"use client";
import { createContext, useContext, useState } from "react";
import type { CompanyProfile } from "@/lib/opportunities/types";
const Context = createContext<{
  profile: CompanyProfile | null;
  setProfile: (p: CompanyProfile | null) => void;
} | null>(null);
export function CompanyProfileProvider({
  initialProfile,
  children,
}: {
  initialProfile: CompanyProfile | null;
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState(initialProfile);
  return (
    <Context.Provider value={{ profile, setProfile }}>
      {children}
    </Context.Provider>
  );
}
export function useCompanyProfile() {
  const value = useContext(Context);
  if (!value) throw new Error("Company profile context is unavailable.");
  return { profile: value.profile, ready: true, save: value.setProfile };
}
