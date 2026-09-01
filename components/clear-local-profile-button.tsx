"use client";
import { useState } from "react";
import { PROFILE_STORAGE_KEY } from "@/lib/company/profile";
export function ClearLocalProfileButton() {
  const [cleared, setCleared] = useState(false);
  return (
    <button
      className="ghost-button"
      onClick={() => {
        localStorage.removeItem(PROFILE_STORAGE_KEY);
        setCleared(true);
      }}
    >
      {cleared ? "Local profile cleared" : "Clear imported local profile"}
    </button>
  );
}
