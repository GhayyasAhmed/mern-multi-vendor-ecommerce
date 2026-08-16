import type { MetadataRoute } from "next";
import { serverApiFetch } from "@/lib/server-api";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

interface ProductListItem {
  _id: string;
  updatedAt?: string;
}
interface EventListItem {
  _id: string;
  createdAt?: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/products`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${siteUrl}/best-selling`, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/events`, changeFrequency: "hourly", priority: 0.7 },
    { url: `${siteUrl}/login`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/signup`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/seller`, changeFrequency: "monthly", priority: 0.4 },
  ];

  const [productsData, eventsData] = await Promise.all([
    serverApiFetch<{ products: ProductListItem[] }>(
      "/product/get-all-products?limit=50&sortBy=newest",
      { revalidate: 3600 }
    ),
    serverApiFetch<{ events: EventListItem[] }>(
      "/event/get-all-events?limit=50",
      { revalidate: 3600 }
    ),
  ]);

  const productRoutes: MetadataRoute.Sitemap = (productsData?.products ?? []).map(
    (product) => ({
      url: `${siteUrl}/product/${product._id}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    })
  );

  const eventRoutes: MetadataRoute.Sitemap = (eventsData?.events ?? []).map((event) => ({
    url: `${siteUrl}/events/${event._id}`,
    lastModified: event.createdAt,
    changeFrequency: "daily",
    priority: 0.5,
  }));

  return [...staticRoutes, ...productRoutes, ...eventRoutes];
}