import { Icon } from "./icons";
export function AiSearch({
  small = false,
  placeholder = "Ask IPO to find an opportunity...",
}: {
  small?: boolean;
  placeholder?: string;
}) {
  return (
    <div className={`ai-search ${small ? "small" : ""}`}>
      <Icon name="sparkle" />
      <input aria-label={placeholder} placeholder={placeholder} />
      <button>
        <span>Ask</span>
        <Icon name="arrow" />
      </button>
    </div>
  );
}
