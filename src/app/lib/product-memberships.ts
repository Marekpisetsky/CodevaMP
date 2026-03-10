type SupabaseLike = {
  rpc: (fn: string, params?: Record<string, unknown>) => Promise<{ error: { message: string } | null }> | PromiseLike<{ error: { message: string } | null }> | unknown;
};

export const ensureExplorerMembership = async (
  client: SupabaseLike | null,
  userId: string | null | undefined,
  productSlug: "visuales" | "dev"
): Promise<void> => {
  if (!client || !userId) {
    return;
  }
  const result = (await client.rpc("upsert_product_membership", {
    p_user_id: userId,
    p_product_slug: productSlug,
    p_role: "explorer",
  })) as { error?: { message: string } | null };
  const error = result?.error ?? null;
  if (error) {
    console.error("ensureExplorerMembership failed", { productSlug, message: error.message });
  }
};
