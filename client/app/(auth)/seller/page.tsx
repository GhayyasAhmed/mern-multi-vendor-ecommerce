import type { Metadata } from "next";

import RegisterShopForm from "@/features/shop/components/RegisterShopForm";

export const metadata: Metadata = {
  title: `Become a seller `,
  description: "Create your shop and start selling.",
};

export default function BecomeSellerPage() {
  return (
    <div className="flex w-full flex-col items-center gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-foreground">Create your shop</h1>
      <RegisterShopForm />
    </div>
  );
}