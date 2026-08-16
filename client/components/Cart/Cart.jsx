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
    <div className="fixed top-0 left-0 w-full bg-black/50 h-screen z-50">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className="fixed top-0 right-0 h-full w-[80%] 800px:w-[25%] bg-surface border-l border-border-strong flex flex-col justify-between shadow-lg overflow-y-auto"
      >
        <div>
          {/* Header with item count and close button on the same line */}
          <div className="flex w-full items-center justify-between p-4 pt-5">
            <div className={`${styles.normalFlex}`}>
              <IoBagHandleOutline size={25} className="text-foreground" />
              <h5 className="pl-2 text-[20px] font-medium text-foreground">
                {cartData.length} items
              </h5>
            </div>
            <button
              type="button"
              onClick={() => setOpenCart(false)}
              aria-label="Close cart"
              className="min-h-11 min-w-11 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <RxCross1 size={22} aria-hidden="true" />
            </button>
          </div>

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
                  className="text-primary hover:underline text-sm font-medium"
                >
                  Browse products
                </Link>
              </div>
            </div>
          ) : (
            <div className="w-full border-t border-border-strong">
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
          <div className="p-4 border-t border-border-strong bg-surface shrink-0">
            <button
              type="button"
              onClick={handleCheckout}
              disabled={hasBlockingStockIssues}
              className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover text-white rounded-md font-medium text-sm transition-colors cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary flex items-center justify-center"
            >
              {hasBlockingStockIssues
                ? "Resolve stock issues to continue"
                : `Checkout Now (USD $${subtotal.toFixed(2)})`}
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
    <div className="border-b border-border-strong p-4">
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
              <span className="bg-primary rounded-full w-6.25 h-6.25 flex items-center justify-center">
                <HiPlus size={18} className="text-primary-foreground" />
              </span>
            </button>
            <span className="text-sm text-foreground">{data.qty}</span>
            <button
              type="button"
              aria-label={`Decrease quantity of ${data.name}`}
              onClick={() => onQtyChange(data.qty > 1 ? data.qty - 1 : 1)}
              className="min-h-11 min-w-11 flex items-center justify-center cursor-pointer"
            >
              <span className="bg-muted rounded-full w-6.25 h-6.25 flex items-center justify-center">
                <HiOutlineMinus size={16} className="text-muted-foreground" />
              </span>
            </button>
          </div>

          <div className="relative w-20 h-20 ml-3 rounded-md overflow-hidden bg-muted shrink-0">
            <Image
              src={data.image}
              alt={data.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>

          <div className="pl-2.5">
            <h1 className="text-[15px] font-medium text-foreground">
              {data.name?.length > 20
                ? `${data.name.slice(0, 20)}...`
                : data.name}
            </h1>
            <h4 className="font-normal text-[13px] text-muted-foreground">
              ${data.price} x {data.qty}
            </h4>
            <h4 className="font-semibold text-[17px] pt-0.75 text-foreground font-Roboto">
              US${totalPrice.toFixed(2)}
            </h4>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${data.name} from cart`}
          className="min-h-11 min-w-11 flex items-center justify-center text-muted-foreground hover:text-error cursor-pointer"
        >
          <RxCross1 className="font-bold" aria-hidden="true" />
        </button>
      </div>
      {warning && (
        <p className="mt-2 text-xs text-warning font-medium">{warning}</p>
      )}
    </div>
  );
};

export default Cart;