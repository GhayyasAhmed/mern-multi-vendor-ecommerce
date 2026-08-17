"use client";
import Footer from "@/components/Layout/Footer";
import Header from "@/components/Layout/Header";
import { getErrorMessage } from "@/features/auth/utils";
import { addItem, productToCartItem } from "@/features/cart/cartSlice";
import { useGetEventByIdQuery } from "@/features/events/eventApiSlice";
import { useToast } from "@/providers/toast-provider";
import { useAppDispatch } from "@/store/hooks";
import styles from "@/styles/styles";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import CountDown from "./CountDown";

const EventDetails = ({ eventId, initialEvent }) => {
  const [count, setCount] = useState(1);
  const toast = useToast();
  const [activeImage, setActiveImage] = useState(0);
  const dispatch = useAppDispatch();

  const { data, isLoading, isError, error } = useGetEventByIdQuery(eventId, { skip: !eventId });
  const event = data?.event ?? initialEvent;

  const decrementCount = () => {
    if (count > 1) setCount(count - 1);
  };
  const incrementCount = () => setCount(count + 1);

  const outOfStock = (event?.stock ?? 0) <= 0;

  const handleAddToCart = () => {
    if (outOfStock || !event) {
      toast.showToast({
        title: `"${event?.name ?? "Event"}" out of stock or not available for sell.`,
        variant: "error",
      });
      return
    };
    dispatch(addItem({ item: productToCartItem(event, count, "event") }));
    toast.showToast({
      title: `"${event?.name ?? "Event"}" added to cart`,
      variant: "success",
    });
  };

  if (isLoading && !initialEvent) {
    return (
      <div>
        <Header activeHeading={4} />
        <main className="w-full flex items-center justify-center py-20 min-h-[60vh]">
          <p className="text-[18px] text-muted-foreground">Loading event...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if ((isError && !initialEvent) || !event) {
    return (
      <div>
        <Header activeHeading={4} />
        <main className="w-full flex flex-col items-center justify-center py-20 min-h-[60vh] gap-4">
          <p className="text-[18px] text-error">
            {getErrorMessage(error, "This event could not be found.")}
          </p>
          <Link href="/events" className="text-primary hover:underline">
            Back to events
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header activeHeading={4} />
      <main className={`${styles.section} py-8`}>
        <div className="block w-full md:flex p-2 md:p-6 bg-surface rounded-md shadow-sm">
          <div className="w-full md:w-1/2">
            <div className="relative w-full h-75">
              <Image
                src={event.images?.[activeImage]?.url || "/placeholder.png"}
                alt={event.name}
                fill
                className="object-contain"
              />
            </div>
            {event.images && event.images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {event.images.map((img, index) => (
                  <button
                    type="button"
                    key={img.public_id || index}
                    onClick={() => setActiveImage(index)}
                    className={`relative w-16 h-16 shrink-0 rounded-md border-2 ${activeImage === index ? "border-primary" : "border-transparent"
                      }`}
                  >
                    <Image src={img.url} alt={`${event.name} ${index + 1}`} fill className="object-cover rounded-md" />
                  </button>
                ))}
              </div>
            )}
            <div className="mt-4">
              <CountDown data={event} />
            </div>
          </div>

          <div className="w-full md:w-1/2 pt-5 md:pt-0 pl-0 md:pl-5">
            <h1 className={`${styles.productTitle} text-[20px]`}>{event.name}</h1>
            <p className="py-3 text-[14px] text-foreground leading-6">{event.description}</p>

            <div className="flex pt-3">
              <h4 className={`${styles.productDiscountPrice}`}>{event.discountPrice}$</h4>
              {event.originalPrice ? <h3 className={`${styles.price}`}>{event.originalPrice}$</h3> : null}
            </div>

            <p className="text-[14px] text-muted-foreground">
              {event.stock > 0 ? `${event.stock} in stock` : "Out of stock"}
            </p>

            <div className="flex items-center mt-12 justify-between pr-3">
              <div className="flex items-center">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  className="min-h-11 min-w-11 flex items-center justify-center bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-l px-4 py-2 transition-colors cursor-pointer"
                  onClick={decrementCount}
                >
                  -
                </button>
                <span className="bg-surface border-y border-border text-foreground font-medium px-4 py-2">{count}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  className="min-h-11 min-w-11 flex items-center justify-center bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-r px-4 py-2 transition-colors cursor-pointer"
                  onClick={incrementCount}
                >
                  +
                </button>
              </div>
            </div>

            <button
              className={`${styles.button} mt-6 rounded-md font-medium flex items-center justify-center ${outOfStock ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
              onClick={handleAddToCart}
              disabled={outOfStock}
            >
              <span className="flex items-center">{outOfStock ? "Out of stock" : "Add to cart"}</span>
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventDetails;