"use client";
import Footer from "@/components/Layout/Footer";
import Header from "@/components/Layout/Header";
import ProductCard from "@/components/Route/ProductCard/ProductCard";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getErrorMessage } from "@/features/auth/utils";
import { addItem, productToCartItem } from "@/features/cart/cartSlice";
import { useCreateConversationMutation } from "@/features/messaging/conversationApiSlice";
import {
  useGetProductByIdQuery,
  useGetRelatedProductsQuery,
} from "@/features/products/productApiSlice";
import { useAddToWishlistMutation, useRemoveFromWishlistMutation } from "@/features/wishlist/wishlistApiSlice";
import { useAppDispatch } from "@/store/hooks";
import styles from "@/styles/styles";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AiFillHeart,
  AiOutlineHeart,
  AiOutlineMessage,
  AiOutlineShoppingCart,
} from "react-icons/ai";
import ProductReviews from "./ProductReviews";

const ProductDetails = ({ productId }) => {
  const [count, setCount] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useCurrentUser();
  const [createConversation, { isLoading: isStartingChat }] = useCreateConversationMutation();
  const [addToWishlist] = useAddToWishlistMutation();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();

  const {
    data: productData,
    isLoading,
    isError,
    error,
  } = useGetProductByIdQuery(productId, { skip: !productId });
  const product = productData?.product;
  const outOfStock = (product?.stock ?? 0) <= 0;

  const isWishlisted = Boolean(product?._id && user?.wishlist?.includes(product._id));

  const handleWishlistToggle = () => {
    if (!product?._id) return;
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/product/${productId}`)}`);
      return;
    }
    if (isWishlisted) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product._id);
    }
  };

  const handleAddToCart = () => {
    if (outOfStock || !product) return;
    dispatch(addItem({ item: productToCartItem(product, count) }));
  };

  const { data: relatedData } = useGetRelatedProductsQuery(
    { id: productId, limit: 5 },
    { skip: !productId }
  );
  const relatedProducts = relatedData?.products ?? [];

  const decrementCount = () => {
    if (count > 1) setCount(count - 1);
  };
  const incrementCount = () => setCount(count + 1);

  const handleMessageSubmit = async () => {
    if (!product?.shopId) return;

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/product/${productId}`)}`);
      return;
    }

    try {
      const result = await createConversation({ sellerId: product.shopId }).unwrap();
      router.push(`/inbox?conversation=${result.conversation._id}`);
    } catch {
      // Best-effort: the user can retry from the product page if this fails.
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header activeHeading={3} />
        <div className="w-full flex items-center justify-center py-20 min-h-[60vh]">
          <p className="text-[18px] text-muted-foreground">Loading product...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div>
        <Header activeHeading={3} />
        <div className="w-full flex flex-col items-center justify-center py-20 min-h-[60vh] gap-4">
          <p className="text-[18px] text-error">
            {getErrorMessage(error, "This product could not be found.")}
          </p>
          <Link href="/products" className="text-primary hover:underline">
            Back to products
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header activeHeading={3} />
      <div className={`${styles.section} py-8`}>
        <div className="block w-full md:flex p-2 md:p-6 bg-surface rounded-md shadow-sm border border-border">
          <div className="w-full md:w-1/2">
            <div className="relative w-full h-75">
              <Image
                src={product.images?.[activeImage]?.url || "/placeholder.png"}
                alt={product.name}
                fill
                className="object-contain"
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {product.images.map((img, index) => (
                  <button
                    type="button"
                    key={img.public_id || index}
                    onClick={() => setActiveImage(index)}
                    className={`relative w-16 h-16 shrink-0 rounded-md border-2 cursor-pointer ${
                      activeImage === index ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover rounded-md"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="flex pt-4 items-center">
              <Link href={`/shop/preview/${product.shopId}`} className="flex items-center">
                <div className="relative w-12.5 h-12.5 rounded-full overflow-hidden mr-2">
                  <Image
                    src={product.shop?.avatar?.url || "/placeholder.png"}
                    alt={product.shop?.name || "Shop Avatar"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className={`${styles.shop_name}`}>{product.shop?.name}</h3>
                  <h5 className="pb-1 text-[15px] text-muted-foreground">({product.shop?.ratings || 0}) Ratings</h5>
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

            <h5 className="text-[16px] text-error mt-5 font-Roboto">
              ({product.sold_out || 0}) Sold
            </h5>
          </div>

          <div className="w-full md:w-1/2 pt-5 md:pt-0 pl-0 md:pl-5">
            <h1 className={`${styles.productTitle} text-[20px]`}>{product.name}</h1>
            <p className="py-3 text-[14px] text-muted-foreground leading-6">{product.description}</p>

            <div className="flex pt-3 items-center">
              <h4 className={`${styles.productDiscountPrice}`}>{product.discountPrice}$</h4>
              {product.originalPrice ? (
                <h3 className={`${styles.price}`}>{product.originalPrice}$</h3>
              ) : null}
            </div>

            <p className="text-[14px] text-muted-foreground mt-1">
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </p>

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
                <span className="bg-surface border-y border-border text-foreground font-medium px-4 py-2">{count}</span>
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
                  className="min-h-11 min-w-11 flex items-center justify-center cursor-pointer rounded-full hover:bg-surface-hover transition-colors"
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
              onClick={handleAddToCart}
              disabled={outOfStock}
              className={`${styles.button} mt-6 rounded-md font-medium flex items-center justify-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <span className="flex items-center">
                {outOfStock ? "Out of stock" : "Add to cart"} <AiOutlineShoppingCart className="ml-1" />
              </span>
            </button>
          </div>
        </div>

        <ProductReviews product={product} productId={productId} />

        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className={`${styles.heading}`}>
              <h1>Related Products</h1>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6.25 lg:grid-cols-4 lg:gap-6.25 xl:grid-cols-5 xl:gap-7.5 mb-12 border-0">
              {relatedProducts.map((related) => (
                <ProductCard data={related} key={related._id} />
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ProductDetails;