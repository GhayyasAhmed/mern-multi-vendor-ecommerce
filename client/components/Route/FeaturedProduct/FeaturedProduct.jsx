"use client";
import { productData } from "@/static/data";
import styles from "@/styles/styles";
import ProductCard from "../ProductCard/ProductCard";

const FeaturedProduct = () => {
  return (
    <div>
      <div className={`${styles.section}`}>
        <div className={`${styles.heading}`}>
          <h1>Featured Products</h1>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6.25 lg:grid-cols-4 lg:gap-6.25 xl:grid-cols-5 xl:gap-7.5 mb-12 border-0">
          {productData &&
            productData.map((i, index) => (
              <ProductCard data={i} key={i.id || index} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedProduct;