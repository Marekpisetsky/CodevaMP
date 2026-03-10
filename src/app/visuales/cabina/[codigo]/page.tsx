import { redirect } from "next/navigation";

type VisualesCabinaRedirectProps = {
  params: Promise<{
    codigo: string;
  }>;
};

export default async function VisualesCabinaRedirect({ params }: VisualesCabinaRedirectProps) {
  const { codigo } = await params;
  redirect(`/visuales/estudio/${codigo}`);
}
