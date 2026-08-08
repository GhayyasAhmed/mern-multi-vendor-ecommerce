import type { Metadata } from "next";

import ShopActivationHandler from "@/features/shop/components/ShopActivationHandler";

export const metadata: Metadata = {
  title: `Shop activation `,
  description: "Activating your shop.",
};

export default async function ShopActivationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="flex w-full flex-col items-center gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-[#333]">Shop activation</h1>
      <ShopActivationHandler token={token} />
    </div>
  );
}