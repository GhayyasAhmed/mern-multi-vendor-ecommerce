"use client";
import Cart from "@/components/Cart/Cart";
import Wishlist from "@/components/Wishlist/Wishlist.jsx";
import LogoutButton from "@/features/auth/components/LogoutButton";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { selectCartCount } from "@/features/cart/cartSlice";
import { useGetAllProductsQuery } from "@/features/products/productApiSlice";
import { useDebounce } from "@/hooks/use-debounce";
import { categoriesData } from "@/static/data";
import { useAppSelector } from "@/store/hooks";
import styles from "@/styles/styles";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AiOutlineHeart,
  AiOutlineSearch,
  AiOutlineShoppingCart,
} from "react-icons/ai";
import { BiMenuAltLeft } from "react-icons/bi";
import { CgProfile } from "react-icons/cg";
import { IoIosArrowDown, IoIosArrowForward } from "react-icons/io";
import { RxCross1 } from "react-icons/rx";
import DropDown from "./DropDown";
import Navbar from "./Navbar";
import NotificationBell from "@/components/Layout/NotificationBell"

const Header = ({ activeHeading }) => {
  const cartCount = useAppSelector(selectCartCount);
  const [searchTerm, setSearchTerm] = useState("");
  const [active, setActive] = useState(false);
  const [dropDown, setDropDown] = useState(false);
  const [openCart, setOpenCart] = useState(false);
  const [openWishlist, setOpenWishlist] = useState(false);
  const [open, setOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);
  // Single source of truth for auth state, shared with AuthProvider's
  // subscription — no extra network request is triggered here.
  const { user, isAuthenticated, isLoading } = useCurrentUser();

  const debouncedSearchTerm = useDebounce(searchTerm.trim(), 300);
  const { data: searchResults, isFetching: isSearching } = useGetAllProductsQuery(
    { search: debouncedSearchTerm, limit: 8 },
    { skip: debouncedSearchTerm.length < 2 }
  );
  const searchData = debouncedSearchTerm.length < 2 ? null : searchResults?.products ?? [];


  const handleSearchChange = (e) => {
    // const term = e.target.value;
    setSearchTerm(e.target.value);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 70) {
        setActive(true);
      } else {
        setActive(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const handleClickOutside = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [accountMenuOpen]);
  return (
    <>
      <div className={`${styles.section}`}>
        <div className="hidden 800px:h-12.5 800px:my-5 800px:flex items-center justify-between">
          <div>
            <Link href="/">
              <Image
                src="/svg-image-2.svg"
                alt="Logo"
                width={250}
                height={250}
              />
            </Link>
          </div>
          {/* Search Box */}
          <div className="w-[50%] relative">
            <input
              type="text"
              placeholder="Search Product..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="h-10 w-full px-2 border-[#3957db] border-2 rounded-md"
            />
            <AiOutlineSearch
              size={30}
              className="absolute right-2 top-1.5 cursor-pointer"
            />
            {searchData !== null ? (
              <div className="absolute min-h-[30vh] bg-slate-50 shadow-sm-2 z-9 p-4 w-full left-0 top-11.25">
                {isSearching ? (
                  <p className="text-sm text-gray-500 px-2 py-3">Searching...</p>
                ) : searchData.length === 0 ? (
                  <p className="text-sm text-gray-500 px-2 py-3">No products found.</p>
                ) : (
                  searchData.map((product) => (
                    <Link href={`/product/${product._id}`} key={product._id}>
                      <div className="w-full flex items-start py-3">
                        <Image
                          src={product.images?.[0]?.url || "/placeholder.png"}
                          alt={product.name || "Product image"}
                          width={40}
                          height={40}
                          className="w-10 h-10 mr-2.5 object-cover"
                        />
                        <h1>{product.name}</h1>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            ) : null}
          </div>

          <div className={`${styles.button}`}>
            <Link href="/seller">
              <h1 className="text-white flex items-center">
                Become Seller <IoIosArrowForward className="ml-1" />
              </h1>
            </Link>
          </div>
        </div>
      </div>

      <div
        className={`${active === true ? "shadow-sm fixed top-0 left-0 z-10" : null
          } transition hidden 800px:flex items-center justify-between w-full bg-[#3321c8] h-17.5`}
      >
        <div className={`${styles.section} relative ${styles.normalFlex} justify-between`}>
          {/* Categories */}
          <div onClick={() => setDropDown(!dropDown)}>
            <div className="relative h-15 mt-2.5 w-67.5 hidden 1000px:block">
              <BiMenuAltLeft size={30} className="absolute top-3 left-2" />
              <button
                className={`h-full w-full flex justify-between items-center pl-10 bg-white font-sans text-lg font-medium select-none rounded-t-md`}
              >
                All Categories
              </button>
              <IoIosArrowDown
                size={20}
                className="absolute right-2 top-4 cursor-pointer"
                onClick={() => setDropDown(!dropDown)}
              />
              {dropDown ? (
                <DropDown
                  categoriesData={categoriesData}
                  setDropDown={setDropDown}
                />
              ) : null}
            </div>
          </div>

          {/* Navitems */}
          <div className={`${styles.normalFlex}`}>
            <Navbar active={activeHeading} />
          </div>

          <div className="flex">
            <div className={`${styles.normalFlex}`}>
              <div
                className="relative cursor-pointer mr-3.75"
                onClick={() => setOpenWishlist(true)}
              >
                <AiOutlineHeart size={30} color="rgb(255 255 255 / 83%)" />
                <span className="absolute right-0 top-0 rounded-full bg-[#3bc177] w-4 h-4 p-0 m-0 text-white font-mono text-[12px] leading-tight text-center">
                  {user?.wishlist?.length ?? 0}
                </span>
              </div>
            </div>

            <div className={`${styles.normalFlex}`}>
              <div
                className="relative cursor-pointer mr-3.75"
                onClick={() => setOpenCart(true)}
              >
                <AiOutlineShoppingCart
                  size={30}
                  color="rgb(255 255 255 / 83%)"
                />
                <span className="absolute right-0 top-0 rounded-full bg-[#3bc177] w-4 h-4 p-0 m-0 text-white font-mono text-[12px] leading-tight text-center">
                  {cartCount}
                </span>
              </div>
            </div>

            <div className={`${styles.normalFlex} mr-3.75`}>
              <NotificationBell enabled={isAuthenticated} iconColor="rgb(255 255 255 / 83%)" />
            </div>

            <div className={`${styles.normalFlex}`}>
              {isLoading ? (
                <div className="w-7.5 h-7.5 rounded-full bg-slate-200 animate-pulse mr-3.75" />
              ) : isAuthenticated ? (
                <div className="relative mr-3.75" ref={accountMenuRef}>
                  <button
                    type="button"
                    onClick={() => setAccountMenuOpen((prev) => !prev)}
                    className="w-7.5 h-7.5 rounded-full bg-slate-300 flex items-center justify-center font-bold text-gray-700 overflow-hidden cursor-pointer"
                    aria-haspopup="menu"
                    aria-expanded={accountMenuOpen}
                  >
                    {user?.avatar?.url ? (
                      <Image
                        src={user.avatar.url}
                        alt={user.name || "Account"}
                        width={30}
                        height={30}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (user?.name?.[0] || "U").toUpperCase()
                    )}
                  </button>
                  {accountMenuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-10 w-45 bg-white rounded-md shadow-sm py-2 z-20"
                    >
                      {user?.name && (
                        <p className="px-4 py-1 text-sm font-medium text-gray-700 truncate">
                          {user.name}
                        </p>
                      )}
                      {user?.role === "admin" && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-slate-100"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          Admin panel
                        </Link>
                      )}
                      {/* {user?.role === "user" && ( */}
                        <Link
                          href="/orders"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-slate-100"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          My Orders
                        </Link>
                      {/* )} */}
                      <Link
                        href="/account"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-slate-100"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        Account settings
                      </Link>
                      <LogoutButton
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-slate-100 disabled:opacity-60"
                        onLoggedOut={() => setAccountMenuOpen(false)}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative cursor-pointer mr-3.75">
                  <Link href="/login">
                    {/* <div className="w-7.5 h-7.5 rounded-full bg-slate-300 flex items-center justify-center font-bold text-gray-700"> */}
                    <CgProfile size={30} color="rgb(255 255 255 / 83%)" />
                    {/* </div> */}
                  </Link>
                </div>
              )}
            </div>

            {/* Cart popup */}
            {openCart ? <Cart setOpenCart={setOpenCart} /> : null}

            {/* Wishlist popup */}
            {openWishlist ? (
              <Wishlist setOpenWishlist={setOpenWishlist} />
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div
        className={`${active === true ? "shadow-sm fixed top-0 left-0 z-10" : null
          } w-full h-15 bg-white z-50 top-0 left-0 shadow-sm 800px:hidden flex items-center justify-between px-4`}
      >
        <div>
          <BiMenuAltLeft
            size={40}
            className="cursor-pointer"
            onClick={() => setOpen(true)}
          />
        </div>
        <div>
          <Link href="/">
            <Image
              src="/svg-image-2.svg"
              alt="Logo"
              width={250}
              height={250}
            />
          </Link>
        </div>
        <div>
          <div
            className="relative cursor-pointer mr-3.75"
            onClick={() => setOpenCart(true)}
          >
            <AiOutlineShoppingCart size={30} />
            <span className="absolute right-0 top-0 rounded-full bg-[#3bc177] w-4 h-4 p-0 m-0 text-white font-mono text-[12px] leading-tight text-center">
              {cartCount}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {open && (
        <div className="fixed w-full bg-[#0000005f] z-20 h-full top-0 left-0">
          <div className="fixed w-[60%] bg-white h-full top-0 left-0 z-10 overflow-y-scroll">
            <div className="w-full justify-between flex pr-3 pt-3">
              <div>
                <div
                  className="relative mr-3.75"
                  onClick={() => setOpenWishlist(true) || setOpen(false)}
                >
                  <AiOutlineHeart size={30} className="ml-3 mt-5" />
                  <span className="absolute right-0 top-0 rounded-full bg-[#3bc177] w-4 h-4 p-0 m-0 text-white font-mono text-[12px] leading-tight text-center">
                    {user?.wishlist?.length ?? 0}
                  </span>
                </div>
              </div>
              <RxCross1
                size={30}
                className="ml-4 mt-5 cursor-pointer"
                onClick={() => setOpen(false)}
              />
            </div>

            <div className="my-8 w-[92%] m-auto h-10 relative">
              <input
                type="search"
                placeholder="Search Product..."
                className="h-10 w-full px-2 border-[#3957db] border-2 rounded-md"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {searchData !== null ? (
                <div className="absolute bg-white z-10 shadow w-full left-0 p-3 top-11.25">
                  {isSearching ? (
                    <p className="text-sm text-gray-500 px-2 py-2">Searching...</p>
                  ) : searchData.length === 0 ? (
                    <p className="text-sm text-gray-500 px-2 py-2">No products found.</p>
                  ) : (
                    searchData.map((product) => (
                      <Link href={`/product/${product._id}`} key={product._id}>
                        <div className="flex items-center py-2">
                          <Image
                            src={product.images?.[0]?.url || "/placeholder.png"}
                            alt={product.name || "Product image"}
                            width={30}
                            height={30}
                            className="w-7.5 h-7.5 mr-2 object-cover"
                          />
                          <h5>{product.name}</h5>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              ) : null}
            </div>

            <Navbar active={activeHeading} />
            <div className={`${styles.button} ml-4 rounded-sm!`}>
              <Link href="/seller">
                <h1 className="text-white flex items-center">
                  Become Seller <IoIosArrowForward className="ml-1" />
                </h1>
              </Link>
            </div>
            <br />
            <br />
            <br />
            {isAuthenticated ? (
              <div className="flex w-full flex-col items-center gap-2">
                {user?.name && (
                  <span className="text-[16px] text-[#000000b7]">{user.name}</span>
                )}
                <LogoutButton
                  className="text-[18px] text-[#000000b7] disabled:opacity-60"
                  onLoggedOut={() => setOpen(false)}
                />
              </div>
            ) : (
              <div className="flex w-full justify-center">
                <Link
                  href="/login"
                  className="text-[18px] pr-2 text-[#000000b7]"
                >
                  Login /
                </Link>
                <Link href="/signup" className="text-[18px] text-[#000000b7]">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;