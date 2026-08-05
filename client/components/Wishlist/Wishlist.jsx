"use client";
import styles from "@/styles/styles";
import Image from "next/image";
import { AiOutlineHeart } from "react-icons/ai";
import { BsCartPlus } from "react-icons/bs";
import { RxCross1 } from "react-icons/rx";

const Wishlist = ({ setOpenWishlist }) => {
  const wishlistData = [
    {
      id: 1,
      name: "IPhone 14 Pro Max 256GB Deep Purple",
      description: "Designed for durability.",
      price: 999,
      image_Url:
        "https://m.media-amazon.com/images/I/71yzJoE7WlL._AC_SL1500_.jpg",
    },
    {
      id: 2,
      name: "Shoes Nike Air Max 270 Running",
      description: "Nike Air Max 270",
      price: 120,
      image_Url:
        "https://m.media-amazon.com/images/I/71oEKkghg-L._AC_UX679_.jpg",
    },
  ];

  return (
    <div className="fixed top-0 left-0 w-full bg-[#0000004b] h-screen z-50">
      <div className="fixed top-0 right-0 h-full w-[80%] 800px:w-[25%] bg-white flex flex-col justify-between shadow-sm overflow-y-scroll">
        <div>
          {/* Close Header */}
          <div className="flex w-full justify-end pt-5 pr-5">
            <RxCross1
              size={25}
              className="cursor-pointer"
              onClick={() => setOpenWishlist(false)}
            />
          </div>

          {/* Item Count */}
          <div className={`${styles.normalFlex} p-4`}>
            <AiOutlineHeart size={25} />
            <h5 className="pl-2 text-[20px] font-medium">
              {wishlistData.length} items
            </h5>
          </div>

          {/* Wishlist Single Items */}
          <br />
          <div className="w-full border-t">
            {wishlistData.map((item, index) => (
              <WishlistSingle key={index} data={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const WishlistSingle = ({ data }) => {
  return (
    <div className="border-b p-4 flex items-center justify-between">
      <div className="flex items-center">
        <RxCross1 className="cursor-pointer font-bold mr-2 text-gray-600 hover:text-red-500" />

        <div className="relative w-20 h-20 ml-2">
          <Image
            src={data.image_Url}
            alt={data.name}
            fill
            className="object-cover rounded-[5px]"
          />
        </div>

        <div className="pl-2.5">
          <h1 className="text-[15px] font-medium">{data.name.slice(0, 20)}...</h1>
          <h4 className="font-semibold text-[17px] pt-0.75 text-[#d02222] font-Roboto">
            US${data.price}
          </h4>
        </div>
      </div>

      <div>
        <BsCartPlus
          size={22}
          className="cursor-pointer text-gray-700 hover:text-[#3bc177]"
          title="Add to cart"
        />
      </div>
    </div>
  );
};

export default Wishlist;