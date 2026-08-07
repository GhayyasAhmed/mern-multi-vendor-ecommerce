"use client";
import { addItem, productToCartItem } from "@/features/cart/cartSlice";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
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
  const outOfStock = (data?.stock ?? 0) <= 0;
  const isWishlisted = Boolean(data?._id && user?.wishlist?.includes(data._id));

  const handleWishlistToggle = () => {
    if (!data?._id) return;
    if (!user) {
      router.push("/login");
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

  const handleMessageSubmit = () => {
    // Message handler logic
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
    <div className="bg-[#0000003b] fixed w-full h-screen top-0 left-0 z-40 flex items-center justify-center">
      {data ? (
        <div className="w-[90%] md:w-[60%] h-[90vh] md:h-[75vh] bg-white rounded-md shadow-sm relative p-4 overflow-y-auto">
          <AiOutlineClose
            size={30}
            className="absolute right-3 top-3 z-50 cursor-pointer"
            onClick={() => setOpen(false)}
          />

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
                  href={`/shop/preview/${data?.shop?._id}`}
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
                    <h5 className="pb-1 text-[15px]">
                      ({data?.shop?.ratings || 0}) Ratings
                    </h5>
                  </div>
                </Link>
              </div>

              <button
                className="bg-black my-3 font-semibold font-Roboto text-white rounded-md h-11 flex items-center justify-center px-4 cursor-pointer"
                onClick={handleMessageSubmit}
              >
                <span className="text-white flex items-center">
                  Send Message <AiOutlineMessage className="ml-1" />
                </span>
              </button>

              <h5 className="text-[16px] text-red-500 mt-5 font-Roboto">
                ({data?.sold_out || 0}) Sold
              </h5>
            </div>

            {/* Right side: Product Details & Actions */}
            <div className="w-full md:w-1/2 pt-5 md:pt-0 pl-0 md:pl-5">
              <h1 className={`${styles.productTitle} text-[20px]`}>
                {data?.name}
              </h1>
              <p className="py-3 text-[14px] text-[#555] leading-6">
                {data?.description}
              </p>

              <div className="flex pt-3">
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
                    className="bg-linear-to-r from-teal-400 to-teal-500 text-white font-bold rounded-l px-4 py-2 shadow-lg hover:opacity-75 transition duration-300 ease-in-out cursor-pointer"
                    onClick={decrementCount}
                  >
                    -
                  </button>
                  <span className="bg-gray-200 text-gray-800 font-medium px-4 py-2.25">
                    {count}
                  </span>
                  <button
                    className="bg-linear-to-r from-teal-400 to-teal-500 text-white font-bold rounded-r px-4 py-2 shadow-lg hover:opacity-75 transition duration-300 ease-in-out cursor-pointer"
                    onClick={incrementCount}
                  >
                    +
                  </button>
                </div>

                <div>
                  {isWishlisted ? (
                    <AiFillHeart
                      size={30}
                      className="cursor-pointer"
                      onClick={handleWishlistToggle}
                      color="red"
                      title="Remove from wishlist"
                    />
                  ) : (
                    <AiOutlineHeart
                      size={30}
                      className="cursor-pointer"
                      onClick={handleWishlistToggle}
                      color="#333"
                      title="Add to wishlist"
                    />
                  )}
                </div>
              </div>

              <button
                className={`${styles.button} mt-6 rounded-md text-white font-medium flex items-center justify-center ${outOfStock ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  }`}
                onClick={handleAddToCart}
                disabled={outOfStock}
              >
                <span className="text-white flex items-center">
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