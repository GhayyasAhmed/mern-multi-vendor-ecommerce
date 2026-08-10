"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import styles from "@/styles/styles";
import { useGetEventByIdQuery } from "@/features/events/eventApiSlice";
import { useAppDispatch } from "@/store/hooks";
import { addItem, productToCartItem } from "@/features/cart/cartSlice";
import { getErrorMessage } from "@/features/auth/utils";
import CountDown from "./CountDown";

const EventDetails = ({ eventId }) => {
  const [count, setCount] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const dispatch = useAppDispatch();

  const { data, isLoading, isError, error } = useGetEventByIdQuery(eventId, { skip: !eventId });
  const event = data?.event;

  const decrementCount = () => {
    if (count > 1) setCount(count - 1);
  };
  const incrementCount = () => setCount(count + 1);

  const outOfStock = (event?.stock ?? 0) <= 0;

  const handleAddToCart = () => {
    if (outOfStock || !event) return;
    dispatch(addItem({ item: productToCartItem(event, count, "event") }));
  };

  if (isLoading) {
    return (
      <div>
        <Header activeHeading={4} />
        <div className="w-full flex items-center justify-center py-20 min-h-[60vh]">
          <p className="text-[18px] text-muted-foreground">Loading event...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div>
        <Header activeHeading={4} />
        <div className="w-full flex flex-col items-center justify-center py-20 min-h-[60vh] gap-4">
          <p className="text-[18px] text-error">
            {getErrorMessage(error, "This event could not be found.")}
          </p>
          <Link href="/events" className="text-primary hover:underline">
            Back to events
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header activeHeading={4} />
      <div className={`${styles.section} py-8`}>
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
                    className={`relative w-16 h-16 shrink-0 rounded-md border-2 ${
                      activeImage === index ? "border-primary" : "border-transparent"
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
            <p className="py-3 text-[14px] text-[#555] leading-6">{event.description}</p>

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
                  className="bg-linear-to-r from-teal-400 to-teal-500 text-primary-foreground font-bold rounded-l px-4 py-2 shadow-lg hover:opacity-75 transition duration-300 ease-in-out cursor-pointer"
                  onClick={decrementCount}
                >
                  -
                </button>
                <span className="bg-muted text-gray-800 font-medium px-4 py-2.25">{count}</span>
                <button
                  className="bg-linear-to-r from-teal-400 to-teal-500 text-primary-foreground font-bold rounded-r px-4 py-2 shadow-lg hover:opacity-75 transition duration-300 ease-in-out cursor-pointer"
                  onClick={incrementCount}
                >
                  +
                </button>
              </div>
            </div>

            <button
              className={`${styles.button} mt-6 rounded-md font-medium flex items-center justify-center ${
                outOfStock ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
              onClick={handleAddToCart}
              disabled={outOfStock}
            >
              <span className="flex items-center">{outOfStock ? "Out of stock" : "Add to cart"}</span>
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EventDetails;