import type { Metadata } from "next";
import { APP_NAME } from "@/constants";
import ActivationHandler from "@/features/auth/components/ActivationHandler";

export const metadata: Metadata = {
  title: `Account activation | ${APP_NAME}`,
  description: "Activating your account.",
};

export default async function ActivationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="flex w-full flex-col items-center gap-6 px-4">
      <h1 className="text-2xl font-semibold text-[#333]">Account activation</h1>
      <ActivationHandler token={token} />
    </div>
  );
}