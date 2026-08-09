"use client";
import Footer from "@/components/Layout/Footer";
import Header from "@/components/Layout/Header";
import ProductCard from "@/components/Route/ProductCard/ProductCard";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import { ProductGridSkeleton } from "@/components/ui/ProductCardSkeleton";
import { getErrorMessage } from "@/features/auth/utils";
import { useGetAllProductsQuery } from "@/features/products/productApiSlice";
import styles from "@/styles/styles";
import { useState } from "react";
import { AiOutlineShoppingCart } from "react-icons/ai";

const PRODUCTS_PER_PAGE = 12;

const BestSellingListing = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError, error } = useGetAllProductsQuery({
    page,
    limit: PRODUCTS_PER_PAGE,
    sortBy: "best-selling",
  });

  const products = data?.products ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <Header activeHeading={2} />
      <div className={`${styles.section} py-8 min-h-[60vh]`}>
        <div className={`${styles.heading}`}>
          <h1>Best Selling</h1>
        </div>

        {isLoading ? (
          <ProductGridSkeleton count={12} />
        ) : isError ? (
          <div className="w-full flex items-center justify-center py-20">
            <p className="text-[18px] text-red-500">
              {getErrorMessage(error, "Failed to load best sellers. Please try again.")}
            </p>
          </div>
        ) : products.length === 0 ? (
          <EmptyState icon={<AiOutlineShoppingCart size={26} />} title="No products found" />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6.25 lg:grid-cols-4 lg:gap-6.25 xl:grid-cols-5 xl:gap-7.5 mb-12 border-0">
              {products.map((product) => (
                <ProductCard data={product} key={product._id} />
              ))}
            </div>

            {pagination && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
                disabled={isFetching}
              />
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default BestSellingListing;