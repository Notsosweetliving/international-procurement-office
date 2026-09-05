"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function updateMarketingConsent(form: FormData) {
  const { client, user } = await getAuthenticatedUser();
  if (!client || !user) return;
  const optedIn = form.get("marketingOptIn") === "true";
  await client
    .from("profiles")
    .update({
      marketing_opt_in: optedIn,
      marketing_opt_in_at: optedIn ? new Date().toISOString() : null,
    })
    .eq("id", user.id);
  revalidatePath("/settings");
}
