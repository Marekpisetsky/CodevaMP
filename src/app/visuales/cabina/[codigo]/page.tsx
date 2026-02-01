"use client";

import { redirect } from "next/navigation";

type VisualesCabinaRedirectProps = {
  params: {
    codigo: string;
  };
};

export default function VisualesCabinaRedirect({ params }: VisualesCabinaRedirectProps) {
  redirect(`/visuales/estudio/${params.codigo}`);
}
