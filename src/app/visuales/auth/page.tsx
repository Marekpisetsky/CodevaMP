import { redirect } from "next/navigation";

type VisualesAuthPageProps = {
  searchParams?: Promise<{
    returnTo?: string | string[] | undefined;
  }>;
};

export default async function VisualesAuthPage({ searchParams }: VisualesAuthPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const rawReturnTo = resolvedParams?.returnTo;
  const nextReturnTo = Array.isArray(rawReturnTo) ? rawReturnTo[0] : rawReturnTo;
  const safeReturnTo = nextReturnTo?.trim() ? nextReturnTo : "/visuales";
  redirect(`/auth?returnTo=${encodeURIComponent(safeReturnTo)}`);
}
