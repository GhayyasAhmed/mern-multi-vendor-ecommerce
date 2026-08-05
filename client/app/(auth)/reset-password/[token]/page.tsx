import type { Metadata } from "next";
import { APP_NAME } from "@/constants";
import ResetPasswordForm from "@/features/auth/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: `Reset password | ${APP_NAME}`,
  description: "Set a new password for your account.",
};

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="flex w-full flex-col items-center gap-6 px-4">
      <h1 className="text-2xl font-semibold text-[#333]">Reset your password</h1>
      <ResetPasswordForm token={token} />
    </div>
  );
}