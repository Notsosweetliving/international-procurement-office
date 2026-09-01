"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
export function GlobalCommand() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((x) => !x);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return (
    <>
      <button
        className="command-trigger"
        onClick={() => setOpen(true)}
        aria-label="Open global search"
      >
        Search <kbd>Ctrl K</kbd>
      </button>
      {open ? (
        <div className="command-backdrop" onClick={() => setOpen(false)}>
          <div className="command-panel" onClick={(e) => e.stopPropagation()}>
            <header>
              <b>Go to</b>
              <button onClick={() => setOpen(false)}>×</button>
            </header>
            <Link href="/opportunities">Search opportunities</Link>
            <Link href="/suppliers">Open supplier directory</Link>
            <Link href="/saved">Open saved opportunities and workspaces</Link>
            <Link href="/saved-searches">Run a saved search</Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
