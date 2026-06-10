import { Suspense } from "react";
import JoinForm from "@/components/JoinForm";

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
        </div>
      }
    >
      <JoinForm />
    </Suspense>
  );
}
