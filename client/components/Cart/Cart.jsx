"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RxCross1 } from "react-icons/rx";
import { IoBagHandleOutline } from "react-icons/io5";
import { HiOutlineMinus, HiPlus } from "react-icons/hi";
import styles from "@/styles/styles";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { removeItem, updateQty, selectCartItems, selectCartSubtotal } from "@/features/cart/cartSlice";

const Cart = ({ setOpenCart }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const cartData = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);

  const handleCheckout = () => {
    setOpenCart(false);
    router.push("/checkout");
  };

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

          <div className={`${styles.normalFlex} p-4`}>
            <IoBagHandleOutline size={25} />
            <h5 className="pl-2 text-[20px] font-medium">
              {cartData.length} items
            </h5>
          </div>

          <br />
          {cartData.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center py-16 px-4 text-center">
              <IoBagHandleOutline size={50} className="text-gray-300 mb-3" />
              <p className="text-[#00000082]">Your cart is empty.</p>
              <Link
                href="/products"
                onClick={() => setOpenCart(false)}
                className="mt-3 text-[#3957db] hover:underline"
              >
                Browse products
              </Link>
            </div>
          ) : (
            <div className="w-full border-t">
              {cartData.map((item) => (
                <CartSingle
                  key={item.productId}
                  data={item}
                  onRemove={() => dispatch(removeItem({ productId: item.productId }))}
                  onQtyChange={(qty) => dispatch(updateQty({ productId: item.productId, qty }))}
                />
              ))}
            </div>
          )}
        </div>

        {cartData.length > 0 && (
          <div className="px-5 mb-3">
            <button
              onClick={handleCheckout}
              className="h-11.25 flex items-center justify-center w-full bg-[#e44343] rounded-[5px] cursor-pointer"
            >
              <h1 className="text-white text-[18px] font-semibold">
                Checkout Now (USD ${subtotal.toFixed(2)})
              </h1>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const CartSingle = ({ data, onRemove, onQtyChange }) => {
  const totalPrice = data.price * data.qty;

  return (
    <div className="border-b p-4 flex items-center justify-between">
      <div className="flex items-center">
        <div>
          <div
            className={`bg-[#e44343] border border-[#e44343c3] rounded-full w-6.25 h-6.25 flex items-center justify-center ${
              data.qty >= data.stock && data.stock > 0 ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
            }`}
            onClick={() => (data.stock <= 0 || data.qty < data.stock) && onQtyChange(data.qty + 1)}
          >
            <HiPlus size={18} color="#fff" />
          </div>
          <span className="pl-2.5">{data.qty}</span>
          <div
            className="bg-[#a7abb14d] rounded-full w-6.25 h-6.25 flex items-center justify-center cursor-pointer mt-1"
            onClick={() => onQtyChange(data.qty > 1 ? data.qty - 1 : 1)}
          >
            <HiOutlineMinus size={16} color="#7d879c" />
          </div>
        </div>

        <div className="relative w-20 h-20 ml-3">
          <Image
            src={data.image}
            alt={data.name}
            fill
            className="object-cover rounded-[5px]"
          />
        </div>

        <div className="pl-1.25">
          <h1>{data.name?.length > 20 ? `${data.name.slice(0, 20)}...` : data.name}</h1>
          <h4 className="font-normal text-[15px] text-[#00000082]">
            ${data.price} x {data.qty}
          </h4>
          <h4 className="font-semibold text-[17px] pt-0.75 text-[#d02222] font-Roboto">
            US${totalPrice.toFixed(2)}
          </h4>
        </div>
      </div>
      <RxCross1 className="cursor-pointer font-bold" onClick={onRemove} />
    </div>
  );
};

export default Cart;