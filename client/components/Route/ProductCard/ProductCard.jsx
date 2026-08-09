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
  const discountPercent =
    data?.originalPrice && data.originalPrice > data.discountPrice
      ? Math.round(((data.originalPrice - data.discountPrice) / data.originalPrice) * 100)
      : null;

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

  return (
    <>
      <div className="group relative w-full h-92.5 bg-surface border border-border rounded-lg shadow-sm hover:shadow-md hover:border-primary/40 transition-all p-3">
        <Link href={`/product/${data?._id}`}>
          <div className="relative w-full h-42.5 rounded-md overflow-hidden bg-muted">
            {discountPercent ? (
              <span className="absolute left-2 top-2 z-10 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
                -{discountPercent}%
              </span>
            ) : null}
            <Image
              src={data?.images?.[0]?.url || "/placeholder.png"}
              alt={data?.name || "Product image"}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            />
            {outOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[1px]">
                <span className="rounded-md bg-foreground/90 px-3 py-1 text-xs font-semibold text-background">
                  Out of stock
                </span>
              </div>
            )}
          </div>
        </Link>

        <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleWishlistToggle}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={isWishlisted}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground cursor-pointer"
          >
            {isWishlisted ? (
              <AiFillHeart size={16} className="text-accent" aria-hidden="true" />
            ) : (
              <AiOutlineHeart size={16} className="text-muted-foreground" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
            aria-label="Quick view"
            aria-haspopup="dialog"
            aria-expanded={open}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground cursor-pointer"
          >
            <AiOutlineEye size={16} className="text-muted-foreground" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            aria-label={outOfStock ? "Out of stock" : "Add to cart"}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface/90 disabled:hover:text-current cursor-pointer"
          >
            <AiOutlineShoppingCart size={16} className="text-muted-foreground" aria-hidden="true" />
          </button>
        </div>

        <Link href={`/shop/preview/${data?.shop?._id}`}>
          <h5 className={`${styles.shop_name} mt-2`}>{data?.shop?.name}</h5>
        </Link>
        <Link href={`/product/${data?._id}`}>
          <h4 className="pb-3 font-medium text-foreground">
            {data?.name?.length > 40 ? data.name.slice(0, 40) + "..." : data?.name}
          </h4>

          <div className="flex items-center gap-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, index) =>
                index < Math.round(data?.ratings || 0) ? (
                  <AiFillStar key={index} className="mr-1 cursor-pointer" color="#F6BA00" size={16} />
                ) : (
                  <AiOutlineStar key={index} className="mr-1 cursor-pointer" color="#F6BA00" size={16} />
                )
              )}
            </div>
            <span className="text-xs text-muted-foreground">({data?.reviews?.length ?? 0})</span>
          </div>

          <div className="py-2 flex items-center justify-between">
            <div className="flex items-baseline">
              <h5 className={`${styles.productDiscountPrice}`}>{data?.discountPrice}$</h5>
              {data?.originalPrice ? <h4 className={`${styles.price}`}>{data.originalPrice}$</h4> : null}
            </div>
            <span className="text-xs text-muted-foreground">{data?.sold_out || 0} sold</span>
          </div>
        </Link>
      </div>
      {open ? <ProductDetailsCard setOpen={setOpen} data={data} /> : null}
    </>
  );
};

export default ProductCard;