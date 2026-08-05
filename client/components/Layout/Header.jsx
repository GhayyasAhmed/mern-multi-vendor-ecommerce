"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "@/styles/styles";
import { categoriesData, productData } from "@/static/data";
import {
  AiOutlineHeart,
  AiOutlineSearch,
  AiOutlineShoppingCart,
} from "react-icons/ai";
import { IoIosArrowDown, IoIosArrowForward } from "react-icons/io";
import { BiMenuAltLeft } from "react-icons/bi";
import { RxCross1 } from "react-icons/rx";
import DropDown from "./DropDown";
import Navbar from "./Navbar";
import Cart from "@/components/Cart/Cart";
import Wishlist from "@/components/Wishlist/Wishlist.jsx";

const Header = ({ activeHeading }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchData, setSearchData] = useState(null);
  const [active, setActive] = useState(false);
  const [dropDown, setDropDown] = useState(false);
  const [openCart, setOpenCart] = useState(false);
  const [openWishlist, setOpenWishlist] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    const filteredProducts =
      productData &&
      productData.filter((product) =>
        product.name.toLowerCase().includes(term.toLowerCase())
      );
    setSearchData(filteredProducts);
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

  return (
    <>
      <div className={`${styles.section}`}>
        <div className="hidden 800px:h-[50px] 800px:my-[20px] 800px:flex items-center justify-between">
          <div>
            <Link href="/">
              <Image
                src="/svg-image-1.svg"
                alt="Logo"
                width={150}
                height={50}
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
            {searchData && searchData.length !== 0 ? (
              <div className="absolute min-h-[30vh] bg-slate-50 shadow-sm-2 z-9 p-4 w-full left-0 top-11.25">
                {searchData.map((i, index) => {
                  const d = i.name;
                  const Product_name = d.replace(/\s+/g, "-");
                  return (
                    <Link href={`/product/${Product_name}`} key={index}>
                      <div className="w-full flex items-start py-3">
                        <Image
                          src={i.image_Url[0]?.url}
                          alt={i.name || "Product image"}
                          width={40}
                          height={40}
                          className="w-10 h-10 mr-2.5 object-cover"
                        />
                        <h1>{i.name}</h1>
                      </div>
                    </Link>
                  );
                })}
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
        className={`${
          active === true ? "shadow-sm fixed top-0 left-0 z-10" : null
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
                  0
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
                  1
                </span>
              </div>
            </div>

            <div className={`${styles.normalFlex}`}>
              <div className="relative cursor-pointer mr-3.75">
                <Link href="/login">
                  <div className="w-7.5 h-7.5 rounded-full bg-slate-300 flex items-center justify-center font-bold text-gray-700">
                    U
                  </div>
                </Link>
              </div>
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
        className={`${
          active === true ? "shadow-sm fixed top-0 left-0 z-10" : null
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
              src="/svg-image-1.svg"
              alt="Logo"
              width={120}
              height={40}
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
              1
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
                    0
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
              {searchData && searchData.length !== 0 ? (
                <div className="absolute bg-white z-10 shadow w-full left-0 p-3 top-11.25">
                  {searchData.map((i, index) => {
                    const d = i.name;
                    const Product_name = d.replace(/\s+/g, "-");
                    return (
                      <Link href={`/product/${Product_name}`} key={index}>
                        <div className="flex items-center py-2">
                          <Image
                            src={i.image_Url[0]?.url}
                            alt={i.name || "Product image"}
                            width={30}
                            height={30}
                            className="w-7.5 h-7.5 mr-2 object-cover"
                          />
                          <h5>{i.name}</h5>
                        </div>
                      </Link>
                    );
                  })}
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
          </div>
        </div>
      )}
    </>
  );
};

export default Header;