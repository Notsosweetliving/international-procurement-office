"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function DeleteAccountButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false),
    [value, setValue] = useState(""),
    [message, setMessage] = useState("");
  async function remove() {
    const r = await fetch("/api/account", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmation: value }),
      }),
      j = await r.json();
    if (r.ok) router.push("/");
    else setMessage(j.error);
  }
  return open ? (
    <div className="delete-confirm">
      <p>This permanently removes private workspace data and tender files.</p>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="DELETE MY ACCOUNT"
      />
      <button
        className="danger-button"
        disabled={value !== "DELETE MY ACCOUNT"}
        onClick={() => void remove()}
      >
        Permanently delete account
      </button>
      {message ? <small>{message}</small> : null}
    </div>
  ) : (
    <button className="danger-button" onClick={() => setOpen(true)}>
      Delete account
    </button>
  );
}
