"use client";
import EmptyState from "@/components/ui/EmptyState";
import {
  removeItem,
  selectCartItems,
  selectCartSubtotal,
  syncItemAvailability,
  updateQty,
} from "@/features/cart/cartSlice";
import { useCheckAvailabilityMutation } from "@/features/products/productApiSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import styles from "@/styles/styles";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HiOutlineMinus, HiPlus } from "react-icons/hi";
import { IoBagHandleOutline } from "react-icons/io5";
import { RxCross1 } from "react-icons/rx";

const Cart = ({ setOpenCart }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const cartData = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);
  const [checkAvailability] = useCheckAvailabilityMutation();
  const [stockIssues, setStockIssues] = useState({});

  useEffect(() => {
    if (cartData.length === 0) {
      queueMicrotask(() => setStockIssues({}));
      return;
    }

    let cancelled = false;

    checkAvailability(
      cartData.map((item) => ({ _id: item.productId, kind: item.kind }))
    )
      .unwrap()
      .then((result) => {
        if (cancelled) return;
        const issues = {};
        result.items.forEach((resultItem) => {
          const cartItem = cartData.find((i) => i.productId === resultItem._id);
          if (!cartItem) return;

          if (!resultItem.exists) {
            dispatch(
              syncItemAvailability({
                productId: resultItem._id,
                stock: 0,
                missing: true,
              })
            );
            return;
          }

          if (
            resultItem.stock !== cartItem.stock ||
            resultItem.discountPrice !== cartItem.price
          ) {
            dispatch(
              syncItemAvailability({
                productId: resultItem._id,
                stock: resultItem.stock,
                price: resultItem.discountPrice,
              })
            );
          }

          if (resultItem.stock < cartItem.qty) {
            issues[resultItem._id] =
              resultItem.stock > 0
                ? `Only ${resultItem.stock} left — quantity was adjusted.`
                : "Currently out of stock.";
          }
        });
        setStockIssues(issues);
      })
      .catch(() => {
        // Best-effort revalidation; checkout still enforces real stock
        // atomically server-side if this fails silently.
      });

    return () => {
      cancelled = true;
    };
  }, [cartData, cartData.length, checkAvailability, dispatch]);

  const hasBlockingStockIssues = Object.values(stockIssues).includes(
    "Currently out of stock."
  );

  const handleCheckout = () => {
    if (hasBlockingStockIssues) return;
    setOpenCart(false);
    router.push("/checkout");
  };


  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpenCart(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [setOpenCart]);

  return (
    <div className="fixed top-0 left-0 w-full bg-[#0000004b] h-screen z-50">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className="fixed top-0 right-0 h-full w-[80%] 800px:w-[25%] bg-white flex flex-col justify-between shadow-sm overflow-y-scroll"
      >
        <div>
          <div className="flex w-full justify-end pt-5 pr-5">
            <button type="button" onClick={() => setOpenCart(false)} aria-label="Close cart">
              <RxCross1 size={25} className="cursor-pointer" aria-hidden="true" />
            </button>
          </div>

          <div className={`${styles.normalFlex} p-4`}>
            <IoBagHandleOutline size={25} />
            <h5 className="pl-2 text-[20px] font-medium">
              {cartData.length} items
            </h5>
          </div>

          <br />
          {cartData.length === 0 ? (
             <div>
              <EmptyState
                icon={<IoBagHandleOutline size={26} />}
                title="Your cart is empty"
              />
              <div className="text-center pb-8 -mt-8">
                <Link
                  href="/products"
                  onClick={() => setOpenCart(false)}
                  className="text-primary hover:underline"
                >
                  Browse products
                </Link>
              </div>
            </div>
          ) : (
            <div className="w-full border-t">
              {cartData.map((item) => (
                <CartSingle
                  key={item.productId}
                  data={item}
                  warning={stockIssues[item.productId]}
                  onRemove={() =>
                    dispatch(removeItem({ productId: item.productId }))
                  }
                  onQtyChange={(qty) =>
                    dispatch(updateQty({ productId: item.productId, qty }))
                  }
                />
              ))}
            </div>
          )}
        </div>

        {cartData.length > 0 && (
          <div className="px-5 mb-3">
            <button
              onClick={handleCheckout}
              disabled={hasBlockingStockIssues}
              className="h-11.25 flex items-center justify-center w-full bg-[#e44343] rounded-[5px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <h1 className="text-white text-[18px] font-semibold">
                {hasBlockingStockIssues
                  ? "Resolve stock issues to continue"
                  : `Checkout Now (USD $${subtotal.toFixed(2)})`}
              </h1>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const CartSingle = ({ data, warning, onRemove, onQtyChange }) => {
  const totalPrice = data.price * data.qty;

  return (
    <div className="border-b p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex flex-col items-center">
            <button
              type="button"
              aria-label={`Increase quantity of ${data.name}`}
              disabled={data.qty >= data.stock && data.stock > 0}
              onClick={() =>
                (data.stock <= 0 || data.qty < data.stock) && onQtyChange(data.qty + 1)
              }
              className="min-h-11 min-w-11 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="bg-[#e44343] border border-[#e44343c3] rounded-full w-6.25 h-6.25 flex items-center justify-center">
                <HiPlus size={18} color="#fff" />
              </span>
            </button>
            <span className="text-sm">{data.qty}</span>
            <button
              type="button"
              aria-label={`Decrease quantity of ${data.name}`}
              onClick={() => onQtyChange(data.qty > 1 ? data.qty - 1 : 1)}
              className="min-h-11 min-w-11 flex items-center justify-center cursor-pointer"
            >
              <span className="bg-[#a7abb14d] rounded-full w-6.25 h-6.25 flex items-center justify-center">
                <HiOutlineMinus size={16} color="#7d879c" />
              </span>
            </button>
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
            <h1>
              {data.name?.length > 20
                ? `${data.name.slice(0, 20)}...`
                : data.name}
            </h1>
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
      {warning && (
        <p className="mt-2 text-xs text-amber-600 font-medium">{warning}</p>
      )}
    </div>
  );
};

export default Cart;