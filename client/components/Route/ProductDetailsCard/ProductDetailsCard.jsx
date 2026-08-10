"use client";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { addItem, productToCartItem } from "@/features/cart/cartSlice";
import { useCreateConversationMutation } from "@/features/messaging/conversationApiSlice";
import { useAddToWishlistMutation, useRemoveFromWishlistMutation } from "@/features/wishlist/wishlistApiSlice";
import { useAppDispatch } from "@/store/hooks";
import styles from "@/styles/styles";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AiFillHeart,
  AiOutlineClose,
  AiOutlineHeart,
  AiOutlineMessage,
  AiOutlineShoppingCart
} from "react-icons/ai";

const ProductDetailsCard = ({ setOpen, data }) => {
  const [count, setCount] = useState(1);

  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useCurrentUser();
  const [addToWishlist] = useAddToWishlistMutation();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();
  const [createConversation, { isLoading: isStartingChat }] = useCreateConversationMutation();
  const outOfStock = (data?.stock ?? 0) <= 0;
  const isWishlisted = Boolean(data?._id && user?.wishlist?.includes(data._id));

  const handleWishlistToggle = () => {
    if (!data?._id) return;
    if (!user) {
      setOpen(false);
      router.push(`/login?redirect=${encodeURIComponent(`/product/${data._id}`)}`);
      return;
    }
    if (isWishlisted) {
      removeFromWishlist(data._id);
    } else {
      addToWishlist(data._id);
    }
  };

  const handleAddToCart = () => {
    if (outOfStock || !data) return;
    dispatch(addItem({ item: productToCartItem(data, count) }));
    setOpen(false);
  };

  const handleMessageSubmit = async () => {
    if (!data?.shopId) return;

    if (!user) {
      setOpen(false);
      router.push(`/login?redirect=${encodeURIComponent(`/product/${data?._id || ""}`)}`);
      return;
    }

    try {
      const result = await createConversation({ sellerId: data.shopId }).unwrap();
      setOpen(false);
      router.push(`/inbox?conversation=${result.conversation._id}`);
    } catch {
      // Best-effort: the user can retry here or from the full product page.
    }
  };

  const decrementCount = () => {
    if (count > 1) {
      setCount(count - 1);
    }
  };

  const incrementCount = () => {
    setCount(count + 1);
  };

  return (
    <div className="bg-black/50 fixed w-full h-screen top-0 left-0 z-40 flex items-center justify-center">
      {data ? (
        <div className="w-[90%] md:w-[60%] h-[90vh] md:h-[75vh] bg-surface text-foreground rounded-md shadow-lg relative p-4 overflow-y-auto border border-border">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close quick view"
            className="absolute right-2 top-2 z-50 min-h-11 min-w-11 flex items-center justify-center cursor-pointer text-foreground hover:text-primary transition-colors"
          >
            <AiOutlineClose size={26} aria-hidden="true" />
          </button>
          <div className="block w-full md:flex p-2 md:p-6">
            {/* Left side: Product Image & Shop Meta */}
            <div className="w-full md:w-1/2">
              <div className="relative w-full h-75">
                <Image
                  src={data?.images?.[0]?.url || "/placeholder.png"}
                  alt={data?.name || "Product Image"}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex pt-4 items-center">
                <Link
                  href={`/shop/preview/${data?.shopId}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center"
                >
                  <div className="relative w-12.5 h-12.5 rounded-full overflow-hidden mr-2">
                    <Image
                      src={data?.shop?.avatar?.url || "/placeholder.png"}
                      alt={data?.shop?.name || "Shop Avatar"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className={`${styles.shop_name}`}>
                      {data?.shop?.name}
                    </h3>
                    <h5 className="pb-1 text-[15px] text-muted-foreground">
                      ({data?.shop?.ratings || 0}) Ratings
                    </h5>
                  </div>
                </Link>
              </div>

              <button
                type="button"
                className="bg-primary hover:bg-primary-hover my-3 font-semibold text-white rounded-md h-11 flex items-center justify-center px-4 cursor-pointer transition-colors disabled:opacity-60"
                onClick={handleMessageSubmit}
                disabled={isStartingChat}
              >
                <span className="flex items-center">
                  {isStartingChat ? "Starting chat..." : "Send Message"} <AiOutlineMessage className="ml-1" />
                </span>
              </button>

              <h5 className="text-sm text-muted-foreground mt-5">
                ({data?.sold_out ?? 0}) Sold
              </h5>
            </div>

            {/* Right side: Product Details & Actions */}
            <div className="w-full md:w-1/2 pt-5 md:pt-0 pl-0 md:pl-5">
              <h1 className={`${styles.productTitle} text-[20px] text-foreground`}>
                {data?.name}
              </h1>
              <p className="py-3 text-[14px] text-muted-foreground leading-6">
                {data?.description}
              </p>

              <div className="flex pt-3 items-center">
                <h4 className={`${styles.productDiscountPrice}`}>
                  {data?.discountPrice}$
                </h4>
                {data?.originalPrice ? (
                  <h3 className={`${styles.price}`}>{data.originalPrice}$</h3>
                ) : null}
              </div>

              <div className="flex items-center mt-12 justify-between pr-3">
                <div className="flex items-center">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    className="bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-l px-4 py-2 transition-colors cursor-pointer"
                    onClick={decrementCount}
                  >
                    -
                  </button>
                  <span className="bg-muted text-foreground font-medium px-4 py-2.25">
                    {count}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    className="bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-r px-4 py-2 transition-colors cursor-pointer"
                    onClick={incrementCount}
                  >
                    +
                  </button>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleWishlistToggle}
                    aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    aria-pressed={isWishlisted}
                    className="min-h-11 min-w-11 flex items-center justify-center cursor-pointer"
                  >
                    {isWishlisted ? (
                      <AiFillHeart size={30} className="text-error" aria-hidden="true" />
                    ) : (
                      <AiOutlineHeart size={30} className="text-foreground hover:text-primary transition-colors" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="button"
                className={`${styles.button} mt-6 rounded-md font-medium flex items-center justify-center w-full ${
                  outOfStock ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
                onClick={handleAddToCart}
                disabled={outOfStock}
              >
                <span className="flex items-center">
                  {outOfStock ? "Out of stock" : "Add to cart"} <AiOutlineShoppingCart className="ml-1" />
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ProductDetailsCard;