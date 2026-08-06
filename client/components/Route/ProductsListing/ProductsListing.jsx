"use client";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import ProductCard from "@/components/Route/ProductCard/ProductCard";
import styles from "@/styles/styles";
import { useGetAllProductsQuery } from "@/features/products/productApiSlice";
import { getErrorMessage } from "@/features/auth/utils";

const PRODUCTS_PER_PAGE = 12;

const ProductsListing = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const category = searchParams.get("category") || undefined;
  const search = searchParams.get("search") || undefined;
  const page = Number(searchParams.get("page")) || 1;

  const { data, isLoading, isFetching, isError, error } = useGetAllProductsQuery({
    page,
    limit: PRODUCTS_PER_PAGE,
    category,
    search,
    sortBy: "newest",
  });

  const products = data?.products ?? [];
  const pagination = data?.pagination;

  const goToPage = (nextPage) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  const heading = useMemo(() => {
    if (category) return category;
    if (search) return `Results for "${search}"`;
    return "All Products";
  }, [category, search]);

  return (
    <div>
      <Header activeHeading={3} />
      <div className={`${styles.section} py-8 min-h-[60vh]`}>
        <div className={`${styles.heading}`}>
          <h1>{heading}</h1>
        </div>

        {isLoading ? (
          <div className="w-full flex items-center justify-center py-20">
            <p className="text-[18px] text-[#00000082]">Loading products...</p>
          </div>
        ) : isError ? (
          <div className="w-full flex items-center justify-center py-20">
            <p className="text-[18px] text-red-500">
              {getErrorMessage(error, "Failed to load products. Please try again.")}
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="w-full flex items-center justify-center py-20">
            <p className="text-[18px] text-[#00000082]">No products found.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6.25 lg:grid-cols-4 lg:gap-6.25 xl:grid-cols-5 xl:gap-7.5 mb-12 border-0">
              {products.map((product) => (
                <ProductCard data={product} key={product._id} />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="w-full flex items-center justify-center gap-4 pb-12">
                <button
                  type="button"
                  disabled={pagination.currentPage <= 1 || isFetching}
                  onClick={() => goToPage(pagination.currentPage - 1)}
                  className="px-4 py-2 rounded-md bg-[#3957db] text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-[15px]">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={pagination.currentPage >= pagination.totalPages || isFetching}
                  onClick={() => goToPage(pagination.currentPage + 1)}
                  className="px-4 py-2 rounded-md bg-[#3957db] text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ProductsListing;