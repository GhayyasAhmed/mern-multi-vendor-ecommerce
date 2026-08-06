"use client";
import styles from "@/styles/styles";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  AiFillHeart,
  AiFillStar,
  AiOutlineEye,
  AiOutlineHeart,
  AiOutlineShoppingCart,
  AiOutlineStar,
} from "react-icons/ai";
import ProductDetailsCard from "@/components/Route/ProductDetailsCard/ProductDetailsCard";

const ProductCard = ({ data }) => {
  const [click, setClick] = useState(false);
  const [open, setOpen] = useState(false);

  // const productName = data?.name ? data.name.replace(/\s+/g, "-") : "";

  return (
    <>
      <div className="w-full h-92.5 bg-white rounded-lg shadow-sm p-3 relative cursor-pointer">
        <div className="flex justify-end">
          {click ? (
            <AiFillHeart
              size={22}
              className="cursor-pointer absolute right-2 top-5"
              onClick={() => setClick(!click)}
              color="red"
              title="Remove from wishlist"
            />
          ) : (
            <AiOutlineHeart
              size={22}
              className="cursor-pointer absolute right-2 top-5"
              onClick={() => setClick(!click)}
              color="#333"
              title="Add to wishlist"
            />
          )}
        </div>
        <Link href={`/product/${data?._id}`}>
          <Image
            src={data?.images?.[0]?.url || "/placeholder.png"}
            alt={data?.name || "Product image"}
            width={300}
            height={170}
            className="w-full h-42.5 object-contain"
          />
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

          <div className="flex">
            {Array.from({ length: 5 }).map((_, index) =>
              index < Math.round(data?.ratings || 0) ? (
                <AiFillStar key={index} className="mr-2 cursor-pointer" color="#F6BA00" size={20} />
              ) : (
                <AiOutlineStar key={index} className="mr-2 cursor-pointer" color="#F6BA00" size={20} />
              )
            )}
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
          <AiOutlineEye
            size={22}
            className="cursor-pointer absolute right-2 top-14"
            onClick={() => setOpen(!open)}
            color="#333"
            title="Quick view"
          />
          <AiOutlineShoppingCart
            size={25}
            className="cursor-pointer absolute right-2 top-24"
            onClick={() => setOpen(!open)}
            color="#444"
            title="Add to cart"
          />
          {open ? <ProductDetailsCard setOpen={setOpen} data={data} /> : null}
        </div>
      </div>
    </>
  );
};

export default ProductCard;