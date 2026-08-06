"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AiFillHeart,
  AiOutlineHeart,
  AiOutlineMessage,
  AiOutlineShoppingCart,
} from "react-icons/ai";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import ProductCard from "@/components/Route/ProductCard/ProductCard";
import styles from "@/styles/styles";
import {
  useGetProductByIdQuery,
  useGetRelatedProductsQuery,
} from "@/features/products/productApiSlice";
import { getErrorMessage } from "@/features/auth/utils";

const ProductDetails = ({ productId }) => {
  const [count, setCount] = useState(1);
  const [click, setClick] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const {
    data: productData,
    isLoading,
    isError,
    error,
  } = useGetProductByIdQuery(productId, { skip: !productId });

  const product = productData?.product;

  const { data: relatedData } = useGetRelatedProductsQuery(
    { id: productId, limit: 5 },
    { skip: !productId }
  );
  const relatedProducts = relatedData?.products ?? [];

  const decrementCount = () => {
    if (count > 1) setCount(count - 1);
  };
  const incrementCount = () => setCount(count + 1);

  const handleMessageSubmit = () => {
    // Message handler logic
  };

  if (isLoading) {
    return (
      <div>
        <Header activeHeading={3} />
        <div className="w-full flex items-center justify-center py-20 min-h-[60vh]">
          <p className="text-[18px] text-[#00000082]">Loading product...</p>
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
          <p className="text-[18px] text-red-500">
            {getErrorMessage(error, "This product could not be found.")}
          </p>
          <Link href="/products" className="text-[#3957db] hover:underline">
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
        <div className="block w-full md:flex p-2 md:p-6 bg-white rounded-md shadow-sm">
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
                    className={`relative w-16 h-16 shrink-0 rounded-md border-2 ${
                      activeImage === index ? "border-[#3957db]" : "border-transparent"
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
              <Link href={`/shop/preview/${product.shop?._id}`} className="flex items-center">
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
                  <h5 className="pb-1 text-[15px]">({product.shop?.ratings || 0}) Ratings</h5>
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
              ({product.sold_out || 0}) Sold
            </h5>
          </div>

          <div className="w-full md:w-1/2 pt-5 md:pt-0 pl-0 md:pl-5">
            <h1 className={`${styles.productTitle} text-[20px]`}>{product.name}</h1>
            <p className="py-3 text-[14px] text-[#555] leading-6">{product.description}</p>

            <div className="flex pt-3">
              <h4 className={`${styles.productDiscountPrice}`}>{product.discountPrice}$</h4>
              {product.originalPrice ? (
                <h3 className={`${styles.price}`}>{product.originalPrice}$</h3>
              ) : null}
            </div>

            <p className="text-[14px] text-[#00000082]">
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </p>

            <div className="flex items-center mt-12 justify-between pr-3">
              <div className="flex items-center">
                <button
                  className="bg-linear-to-r from-teal-400 to-teal-500 text-white font-bold rounded-l px-4 py-2 shadow-lg hover:opacity-75 transition duration-300 ease-in-out cursor-pointer"
                  onClick={decrementCount}
                >
                  -
                </button>
                <span className="bg-gray-200 text-gray-800 font-medium px-4 py-2.25">{count}</span>
                <button
                  className="bg-linear-to-r from-teal-400 to-teal-500 text-white font-bold rounded-r px-4 py-2 shadow-lg hover:opacity-75 transition duration-300 ease-in-out cursor-pointer"
                  onClick={incrementCount}
                >
                  +
                </button>
              </div>

              <div>
                {click ? (
                  <AiFillHeart
                    size={30}
                    className="cursor-pointer"
                    onClick={() => setClick(!click)}
                    color="red"
                    title="Remove from wishlist"
                  />
                ) : (
                  <AiOutlineHeart
                    size={30}
                    className="cursor-pointer"
                    onClick={() => setClick(!click)}
                    color="#333"
                    title="Add to wishlist"
                  />
                )}
              </div>
            </div>

            <button
              className={`${styles.button} mt-6 rounded-md text-white font-medium flex items-center justify-center cursor-pointer`}
              disabled={product.stock <= 0}
            >
              <span className="text-white flex items-center">
                Add to cart <AiOutlineShoppingCart className="ml-1" />
              </span>
            </button>
          </div>
        </div>

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