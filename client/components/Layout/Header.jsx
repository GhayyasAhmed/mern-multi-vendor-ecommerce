"use client";
import Cart from "@/components/Cart/Cart";
import NotificationBell from "@/components/Layout/NotificationBell";
import ThemeToggle from "@/components/ui/ThemeToggle";
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

const Header = ({ activeHeading }) => {
  const cartCount = useAppSelector(selectCartCount);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropDown, setDropDown] = useState(false);
  const [openCart, setOpenCart] = useState(false);
  const [openWishlist, setOpenWishlist] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  const { user, isAuthenticated, isLoading } = useCurrentUser();

  const debouncedSearchTerm = useDebounce(searchTerm.trim(), 300);
  const { data: searchResults, isFetching: isSearching } = useGetAllProductsQuery(
    { search: debouncedSearchTerm, limit: 8 },
    { skip: debouncedSearchTerm.length < 2 }
  );
  const searchData = debouncedSearchTerm.length < 2 ? null : searchResults?.products ?? [];

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Scroll listener to toggle fixed state on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 70) {
        setActive(true);
      } else {
        setActive(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
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
    <header className="relative">
      <div className={`${styles.section}`}>
        <div className="hidden 800px:h-12.5 800px:my-5 800px:flex items-center justify-between">
          <div>
            <Link href="/">
              <div className="relative inline-block">
                <Image
                  src="/svg-image-2.svg"
                  alt="Logo"
                  width={250}
                  height={250}
                  className="dark:brightness-0 dark:invert"
                />
                <Image
                  src="/svg-image-2.svg"
                  alt="Logo Icon"
                  width={250}
                  height={250}
                  className="absolute inset-0 hidden dark:block [clip-path:inset(0_58%_0_0)] pointer-events-none"
                />
              </div>
            </Link>
          </div>
          {/* Search Box */}
          <div className="w-[50%] relative">
            <label htmlFor="header-search" className="sr-only">
              Search products
            </label>
            <input
              id="header-search"
              type="text"
              placeholder="Search Product..."
              value={searchTerm}
              onChange={handleSearchChange}
              role="combobox"
              aria-expanded={searchData !== null}
              aria-controls="header-search-results"
              aria-autocomplete="list"
              className="h-10 w-full px-3 rounded-md border border-border bg-surface text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-focus-ring focus:border-primary"
            />
            <AiOutlineSearch size={30} aria-hidden="true" className="absolute right-2 top-1.5 pointer-events-none" />
            {searchData !== null ? (
              <div
                id="header-search-results"
                role="region"
                aria-live="polite"
                className="absolute min-h-[30vh] bg-surface border border-border shadow-lg z-9 p-4 w-full left-0 top-11.25 rounded-md"
              >
                {isSearching ? (
                  <p className="text-sm text-muted-foreground px-2 py-3">Searching...</p>
                ) : searchData.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-2 py-3">No products found.</p>
                ) : (
                  searchData.map((product) => (
                    <Link href={`/product/${product._id}`} key={product._id}>
                      <div className="w-full flex items-start py-3 hover:bg-surface-hover rounded-md px-1 transition-colors">
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
              <h1 className="flex items-center">
                Become Seller <IoIosArrowForward className="ml-1" />
              </h1>
            </Link>
          </div>
        </div>
      </div>

      {/* Dynamic Desktop Navbar */}
      <div
        className={`${active
            ? "fixed top-0 left-0 z-40 bg-brand shadow-md"
            : "relative bg-brand"
          } transition hidden 800px:flex items-center justify-between w-full text-brand-foreground h-17.5`}
      >
        <div className={`${styles.section} relative ${styles.normalFlex} justify-between w-full h-full`}>
          {/* Categories */}
          <div onClick={() => setDropDown(!dropDown)} className="h-full border-border">
            <div className="relative h-full border-border w-67.5 hidden 800px:block">
              <button
                type="button"
                aria-expanded={dropDown}
                aria-haspopup="menu"
                className={`h-full w-full border-border flex justify-between items-center px-4 bg-surface text-foreground font-sans text-lg font-medium select-none`}
              >
                All Categories
                <IoIosArrowDown size={20} className="mr-2" aria-hidden="true" />
              </button>
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
              <button
                type="button"
                className="relative cursor-pointer mr-3.75"
                onClick={() => setOpenWishlist(true)}
                aria-label={`Open wishlist, ${user?.wishlist?.length ?? 0} items`}
              >
                <AiOutlineHeart size={30} color="rgb(255 255 255 / 83%)" aria-hidden="true" />
                <span aria-hidden="true" className="absolute right-0 top-0 rounded-full bg-accent w-4 h-4 p-0 m-0 text-accent-foreground font-mono text-[12px] leading-tight text-center">
                  {user?.wishlist?.length ?? 0}
                </span>
              </button>
            </div>

            <div className={`${styles.normalFlex}`}>
              <button
                type="button"
                className="relative cursor-pointer mr-3.75"
                onClick={() => setOpenCart(true)}
                aria-label={`Open cart, ${cartCount} items`}
              >
                <AiOutlineShoppingCart size={30} color="rgb(255 255 255 / 83%)" aria-hidden="true" />
                <span aria-hidden="true" className="absolute right-0 top-0 rounded-full bg-accent w-4 h-4 p-0 m-0 text-accent-foreground font-mono text-[12px] leading-tight text-center">
                  {cartCount}
                </span>
              </button>
            </div>

            <div className={`${styles.normalFlex} mr-3.75`}>
              <NotificationBell enabled={isAuthenticated} />
            </div>

            <div className={`${styles.normalFlex} mr-3.75`}>
              <ThemeToggle className="inline-flex h-9 w-9 items-center justify-center rounded-full  cursor-pointer" />
            </div>

            <div className={`${styles.normalFlex}`}>
              {isLoading ? (
                <div className="w-7.5 h-7.5 rounded-full bg-muted animate-pulse mr-3.75" />
              ) : isAuthenticated ? (
                <div className="relative mr-3.75" ref={accountMenuRef}>
                  <button
                    type="button"
                    onClick={() => setAccountMenuOpen((prev) => !prev)}
                    className="w-7.5 h-7.5 rounded-full bg-muted flex items-center justify-center font-bold text-foreground overflow-hidden cursor-pointer"
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
                      className="absolute right-0 top-10 w-45 bg-surface border border-border rounded-md shadow-lg py-2 z-100"
                    >
                      {user?.name && (
                        <p className="px-4 py-1 text-sm font-medium text-foreground truncate">
                          {user.name}
                        </p>
                      )}
                      {user?.role === "admin" && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-foreground hover:bg-surface-hover"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          Admin panel
                        </Link>
                      )}
                      <Link
                        href="/orders"
                        className="block px-4 py-2 text-sm text-foreground hover:bg-surface-hover"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        My Orders
                      </Link>
                      <Link
                        href="/inbox"
                        className="block px-4 py-2 text-sm text-foreground hover:bg-surface-hover"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        Inbox
                      </Link>
                      <Link
                        href="/account"
                        className="block px-4 py-2 text-sm text-foreground hover:bg-surface-hover"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        Account settings
                      </Link>
                      <LogoutButton
                        className="block w-full text-left px-4 py-2 text-sm cursor-pointer text-foreground hover:bg-surface-hover disabled:opacity-60"
                        onLoggedOut={() => setAccountMenuOpen(false)}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative cursor-pointer mr-3.75">
                  <Link href="/login">
                    <CgProfile size={30} color="rgb(255 255 255 / 83%)" />
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

      {/* Spacer to prevent content from jumping/collapsing when navbar turns fixed */}
      {active && <div className="hidden 800px:block h-17.5" />}

      {/* Mobile Header */}
      <div
        className="w-full bg-surface border-b border-border sticky top-0 left-0 z-50 shadow-sm 800px:hidden px-4 py-2.5 flex items-center justify-between gap-2.5"
      >
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="cursor-pointer shrink-0">
          <BiMenuAltLeft size={28} aria-hidden="true" />
        </button>

        <div className="relative flex-1">
          <label htmlFor="mobile-header-search" className="sr-only">
            Search products
          </label>
          <input
            id="mobile-header-search"
            type="text"
            placeholder="Search Product..."
            value={searchTerm}
            onChange={handleSearchChange}
            role="combobox"
            aria-expanded={searchData !== null}
            aria-controls="mobile-header-search-results"
            aria-autocomplete="list"
            className="h-9 w-full px-3 pr-8 rounded-md border border-border bg-surface text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-focus-ring focus:border-primary text-sm"
          />
          <AiOutlineSearch size={18} aria-hidden="true" className="absolute right-2.5 top-2.5 pointer-events-none text-muted-foreground" />
          {searchData !== null ? (
            <div
              id="mobile-header-search-results"
              role="region"
              aria-live="polite"
              className="absolute bg-surface border border-border shadow-lg z-20 p-3 w-full left-0 top-10 rounded-md max-h-[50vh] overflow-y-auto"
            >
              {isSearching ? (
                <p className="text-sm text-muted-foreground px-2 py-2">Searching...</p>
              ) : searchData.length === 0 ? (
                <p className="text-sm text-muted-foreground px-2 py-2">No products found.</p>
              ) : (
                searchData.map((product) => (
                  <Link
                    href={`/product/${product._id}`}
                    key={product._id}
                    onClick={() => setSearchTerm("")}
                  >
                    <div className="w-full flex items-center py-2 hover:bg-surface-hover rounded-md px-1 transition-colors">
                      <Image
                        src={product.images?.[0]?.url || "/placeholder.png"}
                        alt={product.name || "Product image"}
                        width={30}
                        height={30}
                        className="w-8 h-8 mr-2.5 object-cover rounded"
                      />
                      <h1 className="text-sm truncate">{product.name}</h1>
                    </div>
                  </Link>
                ))
              )}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            className="relative cursor-pointer"
            onClick={() => setOpenWishlist(true)}
            aria-label={`Open wishlist, ${user?.wishlist?.length ?? 0} items`}
          >
            <AiOutlineHeart size={24} aria-hidden="true" />
            <span aria-hidden="true" className="absolute -right-1 -top-1 rounded-full bg-accent w-3.5 h-3.5 p-0 m-0 text-accent-foreground font-mono text-[10px] leading-tight text-center flex items-center justify-center">
              {user?.wishlist?.length ?? 0}
            </span>
          </button>


          <button
            type="button"
            className="relative cursor-pointer"
            onClick={() => setOpenCart(true)}
            aria-label={`Open cart, ${cartCount} items`}
          >
            <AiOutlineShoppingCart size={24} aria-hidden="true" />
            <span aria-hidden="true" className="absolute -right-1 -top-1 rounded-full bg-accent w-3.5 h-3.5 p-0 m-0 text-accent-foreground font-mono text-[10px] leading-tight text-center flex items-center justify-center">
              {cartCount}
            </span>
          </button>

          <NotificationBell enabled={isAuthenticated} />

          <ThemeToggle className="inline-flex h-7 w-7 items-center justify-center rounded-full text-foreground hover:bg-surface-hover cursor-pointer" />
        </div>
      </div>

      {openCart ? <Cart setOpenCart={setOpenCart} /> : null}

      {openWishlist ? (
        <Wishlist setOpenWishlist={setOpenWishlist} />
      ) : null}

      {open && (
        <div className="fixed w-full bg-[#0000005f] z-100 h-full top-0 left-0">
          <div className="fixed w-[75%] max-w-[320px] bg-surface h-full top-0 left-0 z-101 overflow-y-scroll flex flex-col shadow-2xl">
            <div className="w-full justify-between flex items-center px-4 border-b border-border">
              <Link href="/" onClick={() => setOpen(false)}>
                <div className="relative inline-block">
                  <Image
                    src="/svg-image-2.svg"
                    alt="Logo"
                    width={180}
                    height={40}
                    className="dark:brightness-0 dark:invert object-contain"
                  />
                  <Image
                    src="/svg-image-2.svg"
                    alt="Logo Icon"
                    width={180}
                    height={40}
                    className="absolute inset-0 hidden dark:block [clip-path:inset(0_58%_0_0)] pointer-events-none object-contain"
                  />
                </div>
              </Link>
              <RxCross1
                size={24}
                className="cursor-pointer text-foreground"
                onClick={() => setOpen(false)}
              />
            </div>

            <div className="py-4 flex-1">
              <Navbar active={activeHeading} />

              <div className="px-4 my-4">
                <Link
                  href="/seller"
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center justify-center py-2.5 px-4 bg-primary text-white rounded-md font-medium text-sm transition-colors hover:bg-primary/90 shadow-sm"
                >
                  <span>Become Seller</span>
                  <IoIosArrowForward className="ml-1.5" size={16} />
                </Link>
              </div>
            </div>

            <br />
            {isAuthenticated ? (
              <div className="flex w-full flex-col items-center gap-2 mb-8 px-4 ">
                {user?.name && (
                  <span className="text-[16px] font-medium text-foreground mb-1">{user.name}</span>
                )}
                <div className="w-full pt-2 mt-2 border-t border-border-strong flex flex-col items-center justify-center">
                  {user?.role === "admin" && (
                    <Link
                      href="/admin"
                      className="text-[15px] text-primary py-1"
                      onClick={() => setOpen(false)}
                    >
                      Admin panel
                    </Link>
                  )}
                  <Link
                    href="/orders"
                    className="text-[15px] text-primary py-1"
                    onClick={() => setOpen(false)}
                  >
                    My Orders
                  </Link>
                  <Link
                    href="/inbox"
                    className="text-[15px] text-primary py-1"
                    onClick={() => setOpen(false)}
                  >
                    Inbox
                  </Link>
                  <Link
                    href="/account"
                    className="text-[15px] text-primary py-1"
                    onClick={() => setOpen(false)}
                  >
                    Account settings
                  </Link>
                </div>
                <div className="w-full pt-2 mt-2 border-t border-border flex justify-center">
                  <LogoutButton
                    className="text-sm cursor-pointer text-foreground font-medium disabled:opacity-60 py-1"
                    onLoggedOut={() => setOpen(false)}
                  />
                </div>
              </div>
            ) : (
              <div className="flex w-full justify-center mb-8 px-4">
                <Link
                  href="/login"
                  className="text-[16px] pr-2 text-foreground font-medium"
                  onClick={() => setOpen(false)}
                >
                  Login /
                </Link>
                <Link
                  href="/signup"
                  className="text-[16px] text-foreground font-medium"
                  onClick={() => setOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;