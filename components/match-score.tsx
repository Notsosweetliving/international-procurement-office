export function getMatchStrength(score: number) {
  return score >= 90
    ? "Strong match"
    : score >= 75
      ? "Good match"
      : score >= 50
        ? "Possible match"
        : "Weak match";
}
export function MatchScore({
  score,
  large = false,
}: {
  score: number;
  large?: boolean;
}) {
  const l = getMatchStrength(score);
  return (
    <div
      className={`match-score score-${l.split(" ")[0].toLowerCase()} ${large ? "match-large" : ""}`}
    >
      <strong>{score}%</strong>
      <span>{l}</span>
    </div>
  );
}
