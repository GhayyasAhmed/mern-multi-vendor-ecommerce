"use client";
import EmptyState from "@/components/ui/EmptyState";
import { addItem, productToCartItem } from "@/features/cart/cartSlice";
import { useGetWishlistQuery, useRemoveFromWishlistMutation } from "@/features/wishlist/wishlistApiSlice";
import { useAppDispatch } from "@/store/hooks";
import styles from "@/styles/styles";
import Image from "next/image";
import { useEffect } from "react";
import { AiOutlineHeart } from "react-icons/ai";
import { BsCartPlus } from "react-icons/bs";
import { RxCross1 } from "react-icons/rx";

const Wishlist = ({ setOpenWishlist }) => {
  const { data, isLoading, isError } = useGetWishlistQuery();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();
  const dispatch = useAppDispatch();
  const wishlistData = data?.products ?? [];

  const handleClearWishlist = async () => {
    try {
      await Promise.all(
        wishlistData.map((item) => removeFromWishlist(item._id).unwrap())
      );
    } catch (err) {
      console.error("Failed to clear wishlist", err);
    }
  };

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
    <div className="fixed top-0 left-0 w-full bg-black/50 h-screen z-50">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Wishlist"
        className="fixed top-0 right-0 h-full w-[80%] 800px:w-[25%] bg-surface border-l border-border-strong flex flex-col justify-between shadow-lg overflow-y-auto"
      >
        <div>
          <div className="flex w-full items-center justify-between p-4 pt-5">
            <div className={`${styles.normalFlex}`}>
              <AiOutlineHeart size={25} className="text-foreground" />
              <h5 className="pl-2 text-[20px] font-medium text-foreground">
                {wishlistData.length} items
              </h5>
            </div>
            <button
              type="button"
              onClick={() => setOpenWishlist(false)}
              aria-label="Close wishlist"
              className="min-h-11 min-w-11 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <RxCross1 size={22} aria-hidden="true" />
            </button>
          </div>

          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground py-8">Loading wishlist...</p>
          ) : isError ? (
            <p className="text-center text-sm text-error py-8">Could not load your wishlist.</p>
          ) : wishlistData.length === 0 ? (
            <EmptyState icon={<AiOutlineHeart size={26} />} title="Your wishlist is empty" />
          ) : (
            <div className="w-full border-t border-border-strong">
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

        {wishlistData.length > 0 && (
          <div className="p-4 border-t border-border-strong bg-surface shrink-0">
            <button
              type="button"
              onClick={handleClearWishlist}
              className="w-full py-2.5 px-4 bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 text-white rounded-md font-medium text-sm transition-colors cursor-pointer shadow-sm"
            >
              Clear Wishlist
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const WishlistSingle = ({ data, onRemove, onAddToCart }) => {
  return (
    <div className="border-b border-border-strong p-4 flex items-center justify-between">
      <div className="flex items-center">
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${data.name} from wishlist`}
          className="min-h-11 min-w-11 flex items-center justify-center text-muted-foreground hover:text-error cursor-pointer shrink-0"
        >
          <RxCross1 className="font-bold" aria-hidden="true" />
        </button>

        <div className="relative w-20 h-20 ml-1 rounded-md overflow-hidden bg-muted shrink-0">
          <Image
            src={data.images?.[0]?.url || "/placeholder.png"}
            alt={data.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>

        <div className="pl-2.5">
          <h1 className="text-[15px] font-medium text-foreground">
            {data.name?.length > 20 ? `${data.name.slice(0, 20)}...` : data.name}
          </h1>
          <h4 className="font-semibold text-[17px] pt-0.75 text-foreground font-Roboto">
            US${data.discountPrice}
          </h4>
        </div>
      </div>

      <button
        type="button"
        onClick={onAddToCart}
        aria-label={`Add ${data.name} to cart`}
        className="min-h-11 min-w-11 flex items-center justify-center text-muted-foreground hover:text-primary cursor-pointer shrink-0"
      >
        <BsCartPlus size={20} aria-hidden="true" />
      </button>
    </div>
  );
};

export default Wishlist;