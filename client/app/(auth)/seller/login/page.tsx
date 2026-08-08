import type { Metadata } from "next";

import ShopLoginForm from "@/features/shop/components/ShopLoginForm";

export const metadata: Metadata = {
  title: `Seller login `,
  description: "Login to your seller dashboard.",
};

export default function SellerLoginPage() {
  return (
    <div className="flex w-full flex-col items-center gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-[#333]">Login to your shop</h1>
      <ShopLoginForm />
    </div>
  );
}