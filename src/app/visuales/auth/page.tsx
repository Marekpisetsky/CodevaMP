import { Suspense } from "react";
import VisualesAuthClient from "./auth-client";

export default function VisualesAuthPage() {
  return (
    <Suspense>
      <VisualesAuthClient />
    </Suspense>
  );
}
