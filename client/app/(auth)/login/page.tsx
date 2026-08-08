import type { Metadata } from "next";
import { Suspense } from "react";

import LoginForm from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: `Login `,
  description: "Login to your account to start shopping.",
};

export default function LoginPage() {
  return (
    <div className="flex w-full flex-col items-center gap-6 px-4">
      <h1 className="text-2xl font-semibold text-[#333]">Login to your account</h1>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}