import type { Metadata } from "next";
import { APP_NAME } from "@/constants";
import ForgotPasswordForm from "@/features/auth/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: `Forgot password | ${APP_NAME}`,
  description: "Reset your account password.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex w-full flex-col items-center gap-6 px-4">
      <h1 className="text-2xl font-semibold text-[#333]">Forgot your password?</h1>
      <ForgotPasswordForm />
    </div>
  );
}