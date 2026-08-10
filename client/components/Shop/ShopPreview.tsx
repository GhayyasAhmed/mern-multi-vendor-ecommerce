"use client";
import Image from "next/image";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import ProductCard from "@/components/Route/ProductCard/ProductCard";
import EventCard from "@/components/Events/EventCard";
import styles from "@/styles/styles";
import { useGetShopInfoQuery } from "@/features/shop/shopApiSlice";
import { useGetShopProductsQuery } from "@/features/products/productApiSlice";
import { useGetShopEventsQuery } from "@/features/events/eventApiSlice";
import { getErrorMessage } from "@/features/auth/utils";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useCreateConversationMutation } from "@/features/messaging/conversationApiSlice";
import { AiOutlineMessage } from "react-icons/ai";

interface ShopPreviewProps {
  shopId: string;
}

const ShopPreview = ({ shopId }: ShopPreviewProps) => {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [createConversation, { isLoading: isStartingChat }] =
    useCreateConversationMutation();

  const {
    data: shopData,
    isLoading: isShopLoading,
    isError: isShopError,
    error: shopError,
  } = useGetShopInfoQuery(shopId, { skip: !shopId });

  const { data: productsData, isLoading: isProductsLoading } =
    useGetShopProductsQuery({ shopId }, { skip: !shopId });

  const { data: eventsData } = useGetShopEventsQuery(
    { shopId },
    { skip: !shopId },
  );

  const shop = shopData?.shop;
  const products = productsData?.products ?? [];
  const events = eventsData?.events ?? [];

  const handleMessageShop = async () => {
    if (!shop?._id) return;
    if (!user) {
      router.push(
        `/login?redirect=${encodeURIComponent(`/shop/preview/${shopId}`)}`,
      );
      return;
    }
    try {
      const result = await createConversation({ sellerId: shop._id }).unwrap();
      router.push(`/inbox?conversation=${result.conversation._id}`);
    } catch {
      // best-effort: the user can retry
    }
  };

  if (isShopLoading) {
    return (
      <div>
        <Header activeHeading={0} />
        <p className="text-center text-[15px] text-muted-foreground py-20 min-h-[50vh]">
          Loading shop...
        </p>
        <Footer />
      </div>
    );
  }

  if (isShopError || !shop) {
    return (
      <div>
        <Header activeHeading={0} />
        <div className="w-full flex flex-col items-center justify-center py-20 min-h-[50vh] gap-4">
          <p className="text-[18px] text-error">
            {getErrorMessage(shopError, "This shop could not be found.")}
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header activeHeading={0} />
      <div className={`${styles.section} py-8`}>
        <div className="w-full flex flex-col md:flex-row items-center md:items-start gap-6 bg-surface rounded-lg shadow-sm p-6 mb-10">
          <div className="relative w-25 h-25 rounded-full overflow-hidden shrink-0">
            <Image
              src={shop.avatar?.url || "/placeholder.png"}
              alt={shop.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h1 className={`${styles.productTitle} text-[22px]`}>
              {shop.name}
            </h1>
            {shop.description && (
              <p className="text-[14px] text-[#555] leading-6 pt-2 max-w-2xl">
                {shop.description}
              </p>
            )}
            <p className="text-[14px] text-muted-foreground pt-2">{shop.address}</p>
            {shop.createdAt && (
              <p className="text-[13px] text-muted-foreground pt-1">
                Joined {new Date(shop.createdAt).toLocaleDateString()}
              </p>
            )}
            <button
              type="button"
              onClick={handleMessageShop}
              disabled={isStartingChat}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary-hover text-sm font-medium cursor-pointer disabled:opacity-60"
            >
              <AiOutlineMessage />
              {isStartingChat ? "Starting chat..." : "Message Shop"}
            </button>
          </div>
        </div>

        {events.length > 0 && (
          <div className="mb-10">
            <div className={`${styles.heading}`}>
              <h1>Shop Events</h1>
            </div>
            <div className="w-full grid">
              {events.map((event) => (
                <EventCard active={true} data={event} key={event._id} />
              ))}
            </div>
          </div>
        )}

        <div className={`${styles.heading}`}>
          <h1>Shop Products</h1>
        </div>
        {isProductsLoading ? (
          <p className="text-center text-[15px] text-muted-foreground py-12">
            Loading products...
          </p>
        ) : products.length === 0 ? (
          <p className="text-center text-[15px] text-muted-foreground py-12">
            This shop has no products yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6.25 lg:grid-cols-4 lg:gap-6.25 xl:grid-cols-5 xl:gap-7.5 mb-12 border-0">
            {products.map((product) => (
              <ProductCard data={product} key={product._id} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ShopPreview;

