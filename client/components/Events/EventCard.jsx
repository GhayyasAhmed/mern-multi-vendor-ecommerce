"use client";
import { addItem, productToCartItem } from "@/features/cart/cartSlice";
import { useAppDispatch } from "@/store/hooks";
import styles from "@/styles/styles";
import Image from "next/image";
import Link from "next/link";
import CountDown from "./CountDown";

const EventCard = ({ active = true, data }) => {
  const dispatch = useAppDispatch();
  const outOfStock = (data?.stock ?? 0) <= 0;
  const discountPercent =
    data?.originalPrice && data.originalPrice > data.discountPrice
      ? Math.round(((data.originalPrice - data.discountPrice) / data.originalPrice) * 100)
      : null;

  const handleAddToCart = () => {
    if (outOfStock || !data) return;
    dispatch(addItem({ item: productToCartItem(data, 1, "event") }));
  };

  return (
    <div
      className={`w-full block bg-surface border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow ${
        active ? "unset" : "mb-12"
      } lg:flex p-2`}
    >
      <div className="w-full lg:w-[50%] m-auto relative h-75 bg-muted rounded-md overflow-hidden">
        {discountPercent ? (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
            -{discountPercent}%
          </span>
        ) : null}
        <Image
          src={
            data?.image_Url?.[0]?.url ||
            data?.images?.[0]?.url ||
            "/placeholder.png"
          }
          alt={data?.name || "Event Product"}
          fill
          className="object-contain p-2"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>
      <div className="w-full lg:w-[50%] flex flex-col justify-center p-4">
        <h2 className={`${styles.productTitle}`}>
          {data?.name || "Iphone 14 Pro Max 256GB SSD and 8GB RAM Silver Colour"}
        </h2>
        <p className="py-2 text-[15px] leading-6 font-normal text-muted-foreground">
          {data?.description ||
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nostrum, ab! Accusantium sapiente laudantium eveniet error impedit, perferendis architecto aut inventore eaque distinctio corporis culpa placeat ad id quas non omnis!"}
        </p>
        <div className="flex py-2 items-baseline justify-between">
          <div className="flex items-baseline">
            <h5 className={`${styles.productDiscountPrice}`}>
              {data?.discountPrice ? `${data.discountPrice}$` : "999$"}
            </h5>
            {data?.originalPrice ? (
              <h5 className={`${styles.price}`}>{data.originalPrice}$</h5>
            ) : null}
          </div>
          <span className="text-xs text-muted-foreground">{data?.sold_out ?? "0"} sold</span>
        </div>
        <CountDown data={data} />
        <br />
        <div className="flex items-center gap-3">
          <Link href={`/events/${data?._id || ""}`}>
            <div className={styles.button}>See Details</div>
          </Link>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            aria-label={outOfStock ? "Out of stock" : `Add ${data?.name || "event"} to cart`}
            className={`${styles.button} disabled:opacity-50`}
          >
            {outOfStock ? "Out of stock" : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
