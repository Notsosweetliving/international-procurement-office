"use client";
import { useState } from "react";
export function PasswordUpdate() {
  const [password, setPassword] = useState(""),
    [message, setMessage] = useState("");
  async function update() {
    const r = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      }),
      j = await r.json();
    setMessage(r.ok ? "Password updated." : j.error);
    if (r.ok) setPassword("");
  }
  return (
    <div className="password-update">
      <input
        type="password"
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        autoComplete="new-password"
      />
      <button
        className="ghost-button"
        disabled={password.length < 8}
        onClick={() => void update()}
      >
        Update password
      </button>
      {message ? <small>{message}</small> : null}
    </div>
  );
}
