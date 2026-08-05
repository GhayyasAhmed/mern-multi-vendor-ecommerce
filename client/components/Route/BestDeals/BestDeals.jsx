"use client";
import { productData } from "@/static/data";
import styles from "@/styles/styles";
import { useMemo } from "react";
import ProductCard from "../ProductCard/ProductCard";

const BestDeals = () => {
  // Derive top 5 products directly without triggering effect-based re-renders
  const bestDeals = useMemo(() => {
    if (!productData) return [];
    
    // Use toSorted (or shallow copy) to prevent in-place mutation of productData
    return [...productData]
      .sort((a, b) => b.total_sell - a.total_sell)
      .slice(0, 5);
  }, []);

  return (
    <div>
      <div className={`${styles.section}`}>
        <div className={`${styles.heading}`}>
          <h1>Best Deals</h1>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6.25 lg:grid-cols-4 lg:gap-6.25 xl:grid-cols-5 xl:gap-7.5 mb-12 border-0">
          {bestDeals.length > 0 &&
            bestDeals.map((item, index) => (
              <ProductCard data={item} key={item.id || index} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default BestDeals;