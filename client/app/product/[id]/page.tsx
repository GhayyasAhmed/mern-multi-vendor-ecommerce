import type { Metadata } from "next";
import ProductDetails from "@/components/Route/ProductDetails/ProductDetails";
import { serverApiFetch } from "@/lib/server-api";
import type { IProduct } from "@/types";

interface GetProductResponse {
  success: boolean;
  product: IProduct;
}

async function fetchProduct(id: string): Promise<IProduct | null> {
  const data = await serverApiFetch<GetProductResponse>(
    `/product/get-product/${encodeURIComponent(id)}`,
    { revalidate: 120, tags: [`product-${id}`] }
  );
  return data?.product ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProduct(id);

  if (!product) {
    return { title: "Product Details" };
  }

  const description =
    product.description?.slice(0, 155) ||
    `Buy ${product.name} on Mercovia — ${product.category}.`;
  const image = product.images?.[0]?.url;

  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${id}` },
    openGraph: {
      title: product.name,
      description,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await fetchProduct(id);

  return (
    <>
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: product.name,
              description: product.description,
              image: product.images?.map((img) => img.url),
              sku: product._id,
              offers: {
                "@type": "Offer",
                priceCurrency: "USD",
                price: product.discountPrice,
                availability:
                  product.stock > 0
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
              },
              ...(product.ratings
                ? {
                    aggregateRating: {
                      "@type": "AggregateRating",
                      ratingValue: product.ratings,
                      reviewCount: product.reviews?.length || 1,
                    },
                  }
                : {}),
            }).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <ProductDetails productId={id} initialProduct={product ?? undefined} />
    </>
  );
}