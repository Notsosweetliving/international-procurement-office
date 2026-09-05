"use client";

import { useId, useState } from "react";
import { Icon } from "./icons";

const futureLanguages = ["French", "German", "Spanish", "Italian", "Portuguese"];

export function LanguageSelector() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  return (
    <div
      className="language-selector"
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        className="language-trigger"
        aria-label="Select language"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        <Icon name="globe" />
        <span>English</span>
      </button>
      {open ? (
        <div className="language-menu" id={menuId} role="menu" aria-label="Available languages">
          <button type="button" role="menuitemradio" aria-checked="true">
            English <span>Current</span>
          </button>
          {futureLanguages.map((language) => (
            <button key={language} type="button" role="menuitem" disabled>
              {language} <span>Coming soon</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
