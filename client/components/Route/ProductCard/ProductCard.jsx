"use client";
import ProductDetailsCard from "@/components/Route/ProductDetailsCard/ProductDetailsCard";
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
  AiFillStar,
  AiOutlineEye,
  AiOutlineHeart,
  AiOutlineShoppingCart,
  AiOutlineStar,
} from "react-icons/ai";

const ProductCard = ({ data }) => {
  const [open, setOpen] = useState(false);

  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useCurrentUser();
  const [addToWishlist] = useAddToWishlistMutation();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();
  const outOfStock = (data?.stock ?? 0) <= 0;
  const isWishlisted = Boolean(data?._id && user?.wishlist?.includes(data._id));

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (outOfStock || !data) return;
    dispatch(addItem({ item: productToCartItem(data, 1) }));
  };

  const handleWishlistToggle = (e) => {
    e.stopPropagation();
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

  // const productName = data?.name ? data.name.replace(/\s+/g, "-") : "";

  return (
    <>
      <div className="w-full h-92.5 bg-white rounded-lg shadow-sm p-3 relative cursor-pointer">
        <div className="flex justify-end">
           <button
            type="button"
            onClick={handleWishlistToggle}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={isWishlisted}
            className="absolute right-2 top-5 cursor-pointer"
          >
            {isWishlisted ? (
              <AiFillHeart size={22} color="red" aria-hidden="true" />
            ) : (
              <AiOutlineHeart size={22} color="#333" aria-hidden="true" />
            )}
          </button>
        </div>
        <Link href={`/product/${data?._id}`}>
          <div className="relative w-full h-42.5 rounded-md overflow-hidden bg-gray-50">
            <Image
              src={data?.images?.[0]?.url || "/placeholder.png"}
              alt={data?.name || "Product image"}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-contain p-2"
            />
          </div>
        </Link>
        <Link href={`/shop/preview/${data?.shop?._id}`}>
          <h5 className={`${styles.shop_name}`}>{data?.shop?.name}</h5>
        </Link>
        <Link href={`/product/${data?._id}`}>
          <h4 className="pb-3 font-medium">
            {data?.name?.length > 40
              ? data.name.slice(0, 40) + "..."
              : data?.name}
          </h4>

          <div className="flex items-center gap-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, index) =>
                index < Math.round(data?.ratings || 0) ? (
                  <AiFillStar key={index} className="mr-2 cursor-pointer" color="#F6BA00" size={20} />
                ) : (
                  <AiOutlineStar key={index} className="mr-2 cursor-pointer" color="#F6BA00" size={20} />
                )
              )}
            </div>
            <span className="text-[13px] text-[#00000082]">({data?.reviews?.length ?? 0})</span>
          </div>

          <div className="py-2 flex items-center justify-between">
            <div className="flex">
              <h5 className={`${styles.productDiscountPrice}`}>
                {data?.discountPrice}$
              </h5>
              {data?.originalPrice ? (
                <h4 className={`${styles.price}`}>{data.originalPrice}$</h4>
              ) : null}
            </div>
            <span className="font-normal text-[17px] text-[#68d8d4]">
              {data?.sold_out || 0} sold
            </span>
          </div>
        </Link>

        {/* Side options */}
        <div>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label="Quick view"
            aria-haspopup="dialog"
            aria-expanded={open}
            className="absolute right-2 top-14 cursor-pointer"
          >
            <AiOutlineEye size={22} color="#333" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            aria-label={outOfStock ? "Out of stock" : "Add to cart"}
            className={`absolute right-2 top-24 ${outOfStock ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
          >
            <AiOutlineShoppingCart size={25} color="#444" aria-hidden="true" />
          </button>
          {open ? <ProductDetailsCard setOpen={setOpen} data={data} /> : null}
        </div>
      </div>
    </>
  );
};

export default ProductCard;