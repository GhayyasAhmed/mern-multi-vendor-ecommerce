"use client";
import { useGetAllProductsQuery } from "@/features/products/productApiSlice";
import styles from "@/styles/styles";
import ProductCard from "../ProductCard/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/ProductCardSkeleton";

const FeaturedProduct = () => {
  const { data, isLoading, isError } = useGetAllProductsQuery({
    limit: 10,
    sortBy: "newest",
  });

  const products = data?.products ?? [];

  return (
    <div>
      <div className={`${styles.section}`}>
        <div className={`${styles.heading}`}>
          <h2>Featured Products</h2>
        </div>
        {isLoading ? (
          <ProductGridSkeleton count={10} />
        ) : isError ? (
          <p className="text-center text-[15px] text-error pb-12">Could not load featured products.</p>

        ) : products.length === 0 ? (
          <p className="text-center text-[15px] text-muted-foreground pb-12">No products available yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6.25 lg:grid-cols-4 lg:gap-6.25 xl:grid-cols-5 xl:gap-7.5 mb-12 border-0">
            {products.map((product) => (
              <ProductCard data={product} key={product._id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedProduct;