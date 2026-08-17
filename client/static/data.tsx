import React from "react";

// Types / Interfaces
export interface NavItem {
  title: string;
  url: string;
}

export interface BrandingData {
  id: number;
  title: string;
  Description: string;
  icon: React.ReactNode;
}

export interface CategoryData {
  id: number;
  title: string;
  subTitle: string;
  image_Url: string;
}

export interface Shop {
  _id?: string;
  name: string;
  shop_avatar: {
    public_id?: string;
    url: string;
  };
  ratings: number;
}

export interface ProductImage {
  public_id?: string;
  url: string;
}

export interface ProductReview {
  user: Record<string, unknown>;
  comment: string;
  rating: number;
}

export interface Product {
  id: number;
  category: string;
  name: string;
  description: string;
  image_Url: ProductImage[];
  shop: Shop;
  price: number;
  discount_price: number;
  rating: number;
  total_sell: number;
  stock: number;
  reviews?: ProductReview[];
}

// Navigation Items
export const navItems: NavItem[] = [
  {
    title: "Home",
    url: "/",
  },
  {
    title: "Best Selling",
    url: "/best-selling",
  },
  {
    title: "Products",
    url: "/products",
  },
  {
    title: "Events",
    url: "/events",
  }
];

// Branding Data
export const brandingData: BrandingData[] = [
  {
    id: 1,
    title: "Free Shipping",
    Description: "From all orders over $100",
    icon: (
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary shrink-0"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M1 1H7L10.68 19.39C10.8068 20.0274 11.1448 20.5982 11.6375 21.0028C12.1302 21.4074 12.7447 21.6192 13.37L27.3 21.62C27.9253 21.6192 28.5398 21.4074 29.0325 21.0028C29.5252 20.5982 29.8632 20.0274 29.99 19.39L32.2 8H8.25"
          // stroke="#3957DB"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="13" cy="30" r="3" fill="currentColor" />
        <circle cx="27" cy="30" r="3" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 2,
    title: "Daily Surprise Offers",
    Description: "Save up to 25% off",
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary shrink-0"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M16 2L20.3262 10.7639L30 12.1764L23 19.0005L24.6524 28.6472L16 24.1L7.34762 28.6472L9 19.0005L2 12.1764L11.6738 10.7639L16 2Z"
          // stroke="#3957DB"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 4,
    title: "Affordable Prices",
    Description: "Get Factory direct price",
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary shrink-0"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M16 2V30M2 16H30"
          // stroke="#3957DB"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 5,
    title: "Secure Payments",
    Description: "100% protected payments",
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary shrink-0"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M16 2L4 7V15C4 22.38 9.12 29.23 16 31C22.88 29.23 28 22.38 28 15V7L16 2Z"
          // stroke="#3957DB"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

// Categories Data
export const categoriesData: CategoryData[] = [
  {
    id: 1,
    title: "Computers and Laptops",
    subTitle: "",
    image_Url:
      "https://cdn.shopify.com/s/files/1/1706/9177/products/NEWAppleMacbookProwithM1ProChip14InchLaptop2021ModelMKGQ3LL_A_16GB_1TBSSD_custommacbd.jpg?v=1659592838",
  },
  {
    id: 2,
    title: "cosmetics and body care",
    subTitle: "",
    image_Url:
      "https://indian-retailer.s3.ap-south-1.amazonaws.com/s3fs-public/2021-07/kosme1.png",
  },
  {
    id: 3,
    title: "Accesories",
    subTitle: "",
    image_Url:
      "https://img.freepik.com/free-vector/ordering-goods-online-internet-store-online-shopping-niche-e-commerce-website-mother-buying-babies-clothes-footwear-toys-infant-accessories_335657-2345.jpg?w=2000",
  },
  {
    id: 4,
    title: "Cloths",
    subTitle: "",
    image_Url:
      "https://www.shift4shop.com/2015/images/industries/clothing/clothing-apparel.png",
  },
  {
    id: 5,
    title: "Shoes",
    subTitle: "",
    image_Url:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
  },
  {
    id: 6,
    title: "Gifts",
    subTitle: "",
    image_Url:
      "https://img.freepik.com/free-vector/gift-card-template-modern-swirl-decor_1017-8149.jpg",
  },
  {
    id: 7,
    title: "Pet Care",
    subTitle: "",
    image_Url: 
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee",
  },
  {
    id: 8,
    title: "Mobile and Tablets",
    subTitle: "",
    image_Url:
      "https://st-troy.mncdn.com/mnresize/1500/1500/Content/media/ProductImg/original/mpwp3tua-apple-iphone-14-256gb-mavi-mpwp3tua-637986832343472449.jpg",
  },
  {
    id: 9,
    title: "Music and Gaming",
    subTitle: "",
    image_Url:
      "https://static.vecteezy.com/system/resources/previews/011/996/555/original/3d-black-headphone-illustration-ecommerce-icon-png.png",
  },
  {
    id: 10,
    title: "Others",
    subTitle: "",
    image_Url:
      "https://searchspring.com/wp-content/uploads/2022/10/Hero-Image-Platform-Others-2.png",
  },
];


export interface FooterLink {
  name: string;
  link: string;
}

export const footerCompanyLinks: FooterLink[] = [
  { name: "Game & Video", link: "/products?category=gaming" },
  { name: "Phone & Tablets", link: "/products?category=mobile" },
  { name: "Computers & Laptop", link: "/products?category=laptops" },
  { name: "Sport Shoes", link: "/products?category=shoes" },
  { name: "Events", link: "/events" },
  { name: "Best Selling", link: "/best-selling" }
];