"use client";
import React, { useState } from "react";
import Image from "next/image";
import { RxCross1 } from "react-icons/rx";
import { IoBagHandleOutline } from "react-icons/io5";
import { HiOutlineMinus, HiPlus } from "react-icons/hi";
import styles from "@/styles/styles";

const Cart = ({ setOpenCart }) => {
  const cartData = [
    {
      name: "IPhone 14 Pro Max 256GB Deep Purple",
      description: "Designed for durability.",
      price: 999,
      qty: 1,
      image_Url:
        "https://m.media-amazon.com/images/I/71yzJoE7WlL._AC_SL1500_.jpg",
    },
    {
      name: "Shoes Nike Air Max 270 Running",
      description: "Nike Air Max 270",
      price: 120,
      qty: 1,
      image_Url:
        "https://m.media-amazon.com/images/I/71oEKkghg-L._AC_UX679_.jpg",
    },
  ];

  return (
    <div className="fixed top-0 left-0 w-full bg-[#0000004b] h-screen z-50">
      <div className="fixed top-0 right-0 h-full w-[80%] 800px:w-[25%] bg-white flex flex-col justify-between shadow-sm overflow-y-scroll">
        <div>
          <div className="flex w-full justify-end pt-5 pr-5">
            <RxCross1
              size={25}
              className="cursor-pointer"
              onClick={() => setOpenCart(false)}
            />
          </div>

          {/* Item length */}
          <div className={`${styles.normalFlex} p-4`}>
            <IoBagHandleOutline size={25} />
            <h5 className="pl-2 text-[20px] font-medium">
              {cartData.length} items
            </h5>
          </div>

          {/* Cart Single Items */}
          <br />
          <div className="w-full border-t">
            {cartData.map((item, index) => (
              <CartSingle key={index} data={item} />
            ))}
          </div>
        </div>

        <div className="px-5 mb-3">
          <button className="h-11.25 flex items-center justify-center w-full bg-[#e44343] rounded-[5px]">
            <h1 className="text-white text-[18px] font-semibold">
              Checkout Now (USD $1119)
            </h1>
          </button>
        </div>
      </div>
    </div>
  );
};

const CartSingle = ({ data }) => {
  const [value, setValue] = useState(data.qty);
  const totalPrice = data.price * value;

  return (
    <div className="border-b p-4 flex items-center justify-between">
      <div className="flex items-center">
        <div>
          <div
            className="bg-[#e44343] border border-[#e44343c3] rounded-full w-6.25 h-6.25 flex items-center justify-center cursor-pointer"
            onClick={() => setValue(value + 1)}
          >
            <HiPlus size={18} color="#fff" />
          </div>
          <span className="pl-2.5">{value}</span>
          <div
            className="bg-[#a7abb14d] rounded-full w-6.25 h-6.25 flex items-center justify-center cursor-pointer mt-1"
            onClick={() => setValue(value > 1 ? value - 1 : 1)}
          >
            <HiOutlineMinus size={16} color="#7d879c" />
          </div>
        </div>

        <div className="relative w-20 h-20 ml-3">
          <Image
            src={data.image_Url}
            alt={data.name}
            fill
            className="object-cover rounded-[5px]"
          />
        </div>

        <div className="pl-1.25">
          <h1>{data.name.slice(0, 20)}...</h1>
          <h4 className="font-normal text-[15px] text-[#00000082]">
            ${data.price} * {value}
          </h4>
          <h4 className="font-semibold text-[17px] pt-0.75 text-[#d02222] font-Roboto">
            US${totalPrice}
          </h4>
        </div>
      </div>
      <RxCross1 className="cursor-pointer font-bold" />
    </div>
  );
};

export default Cart;