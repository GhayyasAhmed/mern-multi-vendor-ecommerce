import type { Metadata } from "next";
import ShopPreview from "@/components/Shop/ShopPreview";

export const metadata: Metadata = {
  title: "Shop",
};

export default async function ShopPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ShopPreview shopId={id} />;
}