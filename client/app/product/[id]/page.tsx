import type { Metadata } from "next";
import ProductDetails from "@/components/Route/ProductDetails/ProductDetails";

export const metadata: Metadata = {
  title: "Product Details",
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ProductDetails productId={id} />;
}