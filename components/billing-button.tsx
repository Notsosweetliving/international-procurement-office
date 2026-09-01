"use client";
import { useState } from "react";
export function BillingButton() {
  const [message, setMessage] = useState("");
  async function checkout() {
    const r = await fetch("/api/billing/checkout", { method: "POST" }),
      j = await r.json();
    if (j.url) location.href = j.url;
    else setMessage(j.error);
  }
  return (
    <div>
      <button className="black-button" onClick={() => void checkout()}>
        Upgrade to Pro · £99/month
      </button>
      {message ? <small className="muted">{message}</small> : null}
      <p>
        <small>
          Team plan: contact us. Pricing remains placeholder during private
          beta.
        </small>
      </p>
    </div>
  );
}
