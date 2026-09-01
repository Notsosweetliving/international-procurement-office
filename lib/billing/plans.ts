export type PlanId = "beta_free" | "pro" | "team";
export type Meter =
  | "ai_analysis"
  | "ai_question"
  | "saved_opportunity"
  | "active_workspace"
  | "supplier"
  | "saved_search";
export const PLANS: Record<
  PlanId,
  { name: string; price: string; limits: Record<Meter, number> }
> = {
  beta_free: {
    name: "Beta Free",
    price: "£0",
    limits: {
      ai_analysis: 10,
      ai_question: 30,
      saved_opportunity: 25,
      active_workspace: 3,
      supplier: 25,
      saved_search: 5,
    },
  },
  pro: {
    name: "Pro",
    price: "£99/month",
    limits: {
      ai_analysis: 150,
      ai_question: 500,
      saved_opportunity: 500,
      active_workspace: 50,
      supplier: 500,
      saved_search: 50,
    },
  },
  team: {
    name: "Team",
    price: "Contact us",
    limits: {
      ai_analysis: 1000,
      ai_question: 3000,
      saved_opportunity: 5000,
      active_workspace: 500,
      supplier: 5000,
      saved_search: 500,
    },
  },
};
