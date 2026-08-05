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
  _id: string;
  name: string;
  shop_avatar: {
    url: string;
  };
  ratings: number;
}

export interface ProductImage {
  url: string;
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
  },
  {
    title: "FAQ",
    url: "/faq",
  },
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
      >
        <path
          d="M1 1H7L10.68 19.39C10.8068 20.0274 11.1448 20.5982 11.6375 21.0028C12.1302 21.4074 12.7447 21.6192 13.37L27.3 21.62C27.9253 21.6192 28.5398 21.4074 29.0325 21.0028C29.5252 20.5982 29.8632 20.0274 29.99 19.39L32.2 8H8.25"
          stroke="#3957DB"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="13" cy="30" r="3" fill="#3957DB" />
        <circle cx="27" cy="30" r="3" fill="#3957DB" />
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
      >
        <path
          d="M16 2L20.3262 10.7639L30 12.1764L23 19.0005L24.6524 28.6472L16 24.1L7.34762 28.6472L9 19.0005L2 12.1764L11.6738 10.7639L16 2Z"
          stroke="#3957DB"
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
      >
        <path
          d="M16 2V30M2 16H30"
          stroke="#3957DB"
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
      >
        <path
          d="M16 2L4 7V15C4 22.38 9.12 29.23 16 31C22.88 29.23 28 22.38 28 15V7L16 2Z"
          stroke="#3957DB"
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
      "https://cdn.shopify.com/s/files/1/1706/9177/products/NEWAppleMacbookProwithRetinaDisplay15_1024x1024.jpg?v=1569581963",
  },
  {
    id: 2,
    title: "Cosmetics and Body Care",
    subTitle: "",
    image_Url:
      "https://indian-cosmetics.ru/images/product_images/popup_images/140015_0.jpg",
  },
  {
    id: 3,
    title: "Accessories",
    subTitle: "",
    image_Url:
      "https://img.freepik.com/free-vector/set-icons-related-accessories_24908-55447.jpg",
  },
  {
    id: 4,
    title: "Clothes",
    subTitle: "",
    image_Url:
      "https://img.freepik.com/free-vector/set-icons-related-clothes_24908-55430.jpg",
  },
  {
    id: 5,
    title: "Shoes",
    subTitle: "",
    image_Url:
      "https://img.freepik.com/free-vector/set-icons-related-shoes_24908-55448.jpg",
  },
  {
    id: 6,
    title: "Gifts",
    subTitle: "",
    image_Url:
      "https://img.freepik.com/free-vector/set-icons-related-gifts_24908-55435.jpg",
  },
  {
    id: 7,
    title: "Pet Care",
    subTitle: "",
    image_Url:
      "https://img.freepik.com/free-vector/set-icons-related-pet-care_24908-55452.jpg",
  },
  {
    id: 8,
    title: "Mobile and Tablets",
    subTitle: "",
    image_Url:
      "https://img.freepik.com/free-vector/set-icons-related-mobile-tablets_24908-55444.jpg",
  },
  {
    id: 9,
    title: "Music and Gaming",
    subTitle: "",
    image_Url:
      "https://img.freepik.com/free-vector/set-icons-related-music-gaming_24908-55445.jpg",
  },
  {
    id: 10,
    title: "Others",
    subTitle: "",
    image_Url:
      "https://img.freepik.com/free-vector/set-icons-related-others_24908-55446.jpg",
  },
];

// Product Data
export const productData: Product[] = [
  {
    id: 1,
    category: "Computers and Laptops",
    name: "MacBook Pro M2 M2 Max 16-inch 2023 64 GB RAM 1TB SSD Space Gray",
    description:
      "Product details are a crucial part of any eCommerce business... Supercharged by M2 Pro or M2 Max, MacBook Pro takes its power and efficiency further than ever.",
    image_Url: [
      {
        url: "https://m.media-amazon.com/images/I/61fd2oCrvyL._AC_SL1500_.jpg",
      },
      {
        url: "https://m.media-amazon.com/images/I/61fd2oCrvyL._AC_SL1500_.jpg",
      },
    ],
    shop: {
      _id: "shop_1",
      name: "Apple Store Official",
      shop_avatar: {
        url: "https://www.hatchwise.com/wp-content/uploads/2022/05/amazon-logo-1024x683.png",
      },
      ratings: 4.8,
    },
    price: 1099,
    discount_price: 999,
    rating: 5,
    total_sell: 35,
    stock: 10,
  },
  {
    id: 2,
    category: "Mobile and Tablets",
    name: "IPhone 14 Pro Max 256GB Deep Purple",
    description:
      "Designed for durability. With Ceramic Shield, tougher than any smartphone glass. Water resistance. Surgical-grade stainless steel.",
    image_Url: [
      {
        url: "https://m.media-amazon.com/images/I/71yzJoE7WlL._AC_SL1500_.jpg",
      },
    ],
    shop: {
      _id: "shop_1",
      name: "Apple Store Official",
      shop_avatar: {
        url: "https://www.hatchwise.com/wp-content/uploads/2022/05/amazon-logo-1024x683.png",
      },
      ratings: 4.8,
    },
    price: 1299,
    discount_price: 1199,
    rating: 5,
    total_sell: 80,
    stock: 15,
  },
  {
    id: 3,
    category: "Music and Gaming",
    name: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
    description:
      "Industry-leading noise cancellation two processors and 8 microphones for unprecedented noise cancellation.",
    image_Url: [
      {
        url: "https://m.media-amazon.com/images/I/51SKmu235WL._AC_SL1500_.jpg",
      },
    ],
    shop: {
      _id: "shop_2",
      name: "Sony Tech Store",
      shop_avatar: {
        url: "https://www.hatchwise.com/wp-content/uploads/2022/05/amazon-logo-1024x683.png",
      },
      ratings: 4.5,
    },
    price: 399,
    discount_price: 349,
    rating: 4.5,
    total_sell: 120,
    stock: 25,
  },
  {
    id: 4,
    category: "Shoes",
    name: "Nike Air Max 270 Running Shoes for Men",
    description:
      "Nike's first lifestyle Air Max brings you style, comfort and big attitude in the Nike Air Max 270.",
    image_Url: [
      {
        url: "https://m.media-amazon.com/images/I/71oEKkghg-L._AC_UX679_.jpg",
      },
    ],
    shop: {
      _id: "shop_3",
      name: "Nike Official Store",
      shop_avatar: {
        url: "https://www.hatchwise.com/wp-content/uploads/2022/05/amazon-logo-1024x683.png",
      },
      ratings: 4.7,
    },
    price: 150,
    discount_price: 120,
    rating: 4,
    total_sell: 95,
    stock: 12,
  },
  {
    id: 5,
    category: "Accessories",
    name: "Gaming Mouse RGB Wireless 16000 DPI",
    description:
      "Ergonomic rechargeable wireless gaming mouse with customizable RGB lighting and programmable side buttons.",
    image_Url: [
      {
        url: "https://m.media-amazon.com/images/I/61l1Ij230SL._AC_SL1500_.jpg",
      },
    ],
    shop: {
      _id: "shop_4",
      name: "Razer Official",
      shop_avatar: {
        url: "https://www.hatchwise.com/wp-content/uploads/2022/05/amazon-logo-1024x683.png",
      },
      ratings: 4.6,
    },
    price: 79,
    discount_price: 59,
    rating: 4.5,
    total_sell: 210,
    stock: 40,
  },
];

export interface FooterLink {
  name: string;
  link: string;
}

export const footerProductLinks: FooterLink[] = [
  { name: "About us", link: "/about" },
  { name: "Careers", link: "/careers" },
  { name: "Store Locations", link: "/locations" },
  { name: "Our Blog", link: "/blog" },
  { name: "Reviews", link: "/reviews" },
];

export const footerCompanyLinks: FooterLink[] = [
  { name: "Game & Video", link: "/products?category=gaming" },
  { name: "Phone & Tablets", link: "/products?category=mobile" },
  { name: "Computers & Laptop", link: "/products?category=laptops" },
  { name: "Sport Shoes", link: "/products?category=shoes" },
  { name: "Events", link: "/events" },
];

export const footerSupportLinks: FooterLink[] = [
  { name: "FAQ", link: "/faq" },
  { name: "Reviews", link: "/reviews" },
  { name: "Contact Us", link: "/contact" },
  { name: "Shipping", link: "/shipping" },
  { name: "Live chat", link: "/chat" },
];