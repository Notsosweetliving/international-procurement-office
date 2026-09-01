"use client";
import { useState } from "react";
import type { Opportunity } from "@/lib/opportunities/types";
import type { TenderAnalysis } from "@/lib/ai/schemas";
import { compareRequirements } from "@/lib/ai/requirement-comparison";
import { useCompanyProfile } from "./use-company-profile";
export function AiOpportunityIntelligence({
  opportunity,
  available,
}: {
  opportunity: Opportunity;
  available: boolean;
}) {
  const { profile } = useCompanyProfile();
  const [analysis, setAnalysis] = useState<TenderAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [chatting, setChatting] = useState(false);
  const analyze = async () => {
    if (loading || analysis) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ opportunityId: opportunity.id }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setAnalysis(data.analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };
  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (chatting || question.trim().length < 2) return;
    setChatting(true);
    setError("");
    try {
      const r = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          opportunityId: opportunity.id,
          question,
          companyProfile: profile,
          analysis,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setAnswer(data.answer);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Question failed.");
    } finally {
      setChatting(false);
    }
  };
  const review = analysis ? compareRequirements(profile, analysis) : null;
  return (
    <section className="ai-intelligence">
      <header>
        <div>
          <span className="section-label">AI INTELLIGENCE</span>
          <h2>{analysis?.conciseTitle ?? "Tender intelligence"}</h2>
          {analysis?.conciseTitle ? (
            <small>
              AI-generated concise title · Official title remains above
            </small>
          ) : null}
        </div>
        <div className={available ? "ai-status available" : "ai-status"}>
          {available
            ? analysis
              ? "Analysis available"
              : "Not yet generated"
            : "AI unavailable"}
        </div>
      </header>
      {!available ? (
        <div className="state-card">
          <b>AI features are unavailable</b>
          <p>
            Add OPENAI_API_KEY on the server to enable analysis and questions.
            Live TED data and deterministic matching remain available.
          </p>
        </div>
      ) : !analysis ? (
        <div className="analysis-start">
          <p>
            {opportunity.summary.length < 180
              ? "Limited source information may be available. Review the official tender documents alongside any generated analysis."
              : "Generate a structured review of requirements, risks, dates and next steps from the available TED record."}
          </p>
          <button className="black-button" onClick={analyze} disabled={loading}>
            {loading ? "Analyzing opportunity…" : "Analyze opportunity"}
          </button>
        </div>
      ) : (
        <AnalysisView analysis={analysis} review={review} />
      )}{" "}
      {error ? <div className="ai-error">{error}</div> : null}
      <form className="opportunity-chat" onSubmit={ask}>
        <label>Ask IPO</label>
        <div>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value.slice(0, 500))}
            placeholder="What should I verify before pursuing this bid?"
            disabled={!available}
          />
          <button
            disabled={!available || chatting || question.trim().length < 2}
          >
            {chatting ? "Thinking…" : "Ask"}
          </button>
        </div>
        <small>
          {question.length}/500 · Answers use only this opportunity and your
          saved profile.
        </small>
        {answer ? (
          <div className="chat-answer">
            <b>IPO Intelligence</b>
            <p>{answer}</p>
          </div>
        ) : null}
      </form>
    </section>
  );
}
function AnalysisView({
  analysis: a,
  review,
}: {
  analysis: TenderAnalysis;
  review: ReturnType<typeof compareRequirements> | null;
}) {
  return (
    <div className="analysis-content">
      {a.sourceSufficiency === "limited" ? (
        <div className="limited-note">
          <b>Limited source information available</b>
          <span>Official tender documents should be reviewed.</span>
        </div>
      ) : null}
      <Block title="Summary">
        <p>{a.summary}</p>
      </Block>
      <div className="analysis-columns">
        <Block title="Key requirements">
          {a.keyRequirements.length ? (
            <ul>
              {a.keyRequirements.map((x) => (
                <li key={x.title}>
                  <b>{x.title}</b>
                  <span>{x.description}</span>
                  <small>
                    {x.confidence} · {x.sourceBasis ?? "Available notice text"}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Block>
        <Block title="Potential risks">
          {a.risks.length ? (
            <ul>
              {a.risks.map((x) => (
                <li key={x.title}>
                  <b>
                    {x.title} · {x.severity}
                  </b>
                  <span>{x.explanation}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Block>
      </div>
      <div className="analysis-columns">
        <Block title="Important dates">
          {a.importantDates.length ? (
            <ul>
              {a.importantDates.map((x) => (
                <li key={x.label}>
                  <b>{x.label}</b>
                  <span>{x.date ?? x.description ?? "Date unclear"}</span>
                  <small>{x.confidence}</small>
                </li>
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Block>
        <Block title="Certifications mentioned">
          {a.certifications.length ? (
            <ul>
              {a.certifications.map((x) => (
                <li key={x.name}>
                  <b>{x.name}</b>
                  <span>{x.context ?? x.status}</span>
                  <small>{x.status}</small>
                </li>
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Block>
      </div>
      <Block title="AI requirement review">
        {review ? (
          <div className="review-grid">
            <Review title="Profile matches" symbol="✓" items={review.matches} />
            <Review title="Needs review" symbol="!" items={review.review} />
            <Review title="Unknown" symbol="?" items={review.unknown} />
          </div>
        ) : null}
      </Block>
      <div className="analysis-columns">
        <Block title="Submission checklist">
          {a.submissionRequirements.length ? (
            <ol>
              {a.submissionRequirements.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
          ) : (
            <Empty />
          )}
        </Block>
        <Block title="Recommended next steps">
          <ol>
            {a.recommendedNextSteps.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
        </Block>
      </div>
      <Block title="Questions to verify">
        <ul>
          {a.questionsToVerify.map((x) => (
            <li key={x}>
              <span>{x}</span>
            </li>
          ))}
        </ul>
      </Block>
      <p className="match-disclaimer">
        AI-generated procurement guidance. Verify requirements in the official
        notice.
      </p>
    </div>
  );
}
function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="analysis-block">
      <h3>{title}</h3>
      {children}
    </section>
  );
}
function Review({
  title,
  symbol,
  items,
}: {
  title: string;
  symbol: string;
  items: string[];
}) {
  return (
    <div>
      <b>{title}</b>
      {items.length ? (
        items.map((x) => (
          <p key={x}>
            <span>{symbol}</span>
            {x}
          </p>
        ))
      ) : (
        <small>None identified</small>
      )}
    </div>
  );
}
function Empty() {
  return <p className="muted">Not identified in the available source text.</p>;
}
