import type { Metadata } from "next";

import RegisterForm from "@/features/auth/components/RegisterForm";

export const metadata: Metadata = {
  title: `Sign up `,
  description: "Create an account to start shopping.",
};

export default function SignupPage() {
  return (
    <div className="flex w-full flex-col items-center gap-6 px-4">
      <h1 className="text-2xl font-semibold text-[#333]">Create your account</h1>
      <RegisterForm />
    </div>
  );
}