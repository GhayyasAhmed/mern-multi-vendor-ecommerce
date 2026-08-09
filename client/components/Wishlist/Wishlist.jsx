"use client";
import { useEffect } from "react";
import styles from "@/styles/styles";
import Image from "next/image";
import { AiOutlineHeart } from "react-icons/ai";
import { BsCartPlus } from "react-icons/bs";
import { RxCross1 } from "react-icons/rx";
import { useGetWishlistQuery, useRemoveFromWishlistMutation } from "@/features/wishlist/wishlistApiSlice";
import { addItem, productToCartItem } from "@/features/cart/cartSlice";
import { useAppDispatch } from "@/store/hooks";

const Wishlist = ({ setOpenWishlist }) => {
  const { data, isLoading, isError } = useGetWishlistQuery();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();
  const dispatch = useAppDispatch();
  const wishlistData = data?.products ?? [];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpenWishlist(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [setOpenWishlist]);

  return (
    <div className="fixed top-0 left-0 w-full bg-[#0000004b] h-screen z-50">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Wishlist"
        className="fixed top-0 right-0 h-full w-[80%] 800px:w-[25%] bg-white flex flex-col justify-between shadow-sm overflow-y-scroll"
      >
        <div>
          <div className="flex w-full justify-end pt-5 pr-5">
            <button type="button" onClick={() => setOpenWishlist(false)} aria-label="Close wishlist">
              <RxCross1 size={25} className="cursor-pointer" aria-hidden="true" />
            </button>
          </div>

          <div className={`${styles.normalFlex} p-4`}>
            <AiOutlineHeart size={25} />
            <h5 className="pl-2 text-[20px] font-medium">
              {wishlistData.length} items
            </h5>
          </div>

          <br />
          {isLoading ? (
            <p className="text-center text-sm text-[#00000082] py-8">Loading wishlist...</p>
          ) : isError ? (
            <p className="text-center text-sm text-red-500 py-8">Could not load your wishlist.</p>
          ) : wishlistData.length === 0 ? (
            <p className="text-center text-sm text-[#00000082] py-8">Your wishlist is empty.</p>
          ) : (
            <div className="w-full border-t">
              {wishlistData.map((item) => (
                <WishlistSingle
                  key={item._id}
                  data={item}
                  onRemove={() => removeFromWishlist(item._id)}
                  onAddToCart={() => dispatch(addItem({ item: productToCartItem(item, 1) }))}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const WishlistSingle = ({ data, onRemove, onAddToCart }) => {
  return (
    <div className="border-b p-4 flex items-center justify-between">
      <div className="flex items-center">
        <RxCross1
          className="cursor-pointer font-bold mr-2 text-gray-600 hover:text-red-500"
          onClick={onRemove}
        />

        <div className="relative w-20 h-20 ml-2">
          <Image
            src={data.images?.[0]?.url || "/placeholder.png"}
            alt={data.name}
            fill
            className="object-cover rounded-[5px]"
          />
        </div>

        <div className="pl-2.5">
          <h1 className="text-[15px] font-medium">
            {data.name?.length > 20 ? `${data.name.slice(0, 20)}...` : data.name}
          </h1>
          <h4 className="font-semibold text-[17px] pt-0.75 text-[#d02222] font-Roboto">
            US${data.discountPrice}
          </h4>
        </div>
      </div>

      <div>
        <BsCartPlus
          size={22}
          className="cursor-pointer text-gray-700 hover:text-[#3bc177]"
          title="Add to cart"
          onClick={onAddToCart}
        />
      </div>
    </div>
  );
};

export default Wishlist;