"use client";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { useGetAllProductsAdminQuery } from "@/features/admin/adminApiSlice";
import Image from "next/image";
import { useState } from "react";
import { AiOutlineShoppingCart } from "react-icons/ai";

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useGetAllProductsAdminQuery({
    page,
    limit: 20,
  });
  const products = data?.products ?? [];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Products</h1>
      {isLoading ? (
        <TableSkeleton rows={8} cols={4} />
      ) : isError ? (
        <p className="text-sm text-error">Could not load products.</p>
      ) : products.length === 0 ? (
        <EmptyState icon={<AiOutlineShoppingCart size={26} />} title="No products yet" />
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="md:hidden divide-y divide-border rounded-lg bg-surface shadow-sm overflow-hidden">
            {products.map((product) => (
              <div key={product._id} className="p-4 flex items-center gap-3">
                <div className="relative w-12 h-12 shrink-0">
                  <Image
                    src={product.images?.[0]?.url || "/placeholder.png"}
                    alt={product.name}
                    fill
                    className="object-cover rounded-[5px]"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{product.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{product.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-medium">${product.discountPrice}</p>
                  <p className="text-xs text-muted-foreground">{product.stock} in stock</p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block bg-surface rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="border-t border-border">
                    <td className="px-4 py-3 flex items-center gap-2">
                      <div className="relative w-10 h-10 shrink-0">
                        <Image
                          src={product.images?.[0]?.url || "/placeholder.png"}
                          alt={product.name}
                          fill
                          className="object-cover rounded-[5px]"
                        />
                      </div>
                      {product.name}
                    </td>
                    <td className="px-4 py-3">{product.category}</td>
                    <td className="px-4 py-3">${product.discountPrice}</td>
                    <td className="px-4 py-3">{product.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {data?.pagination && (
        <Pagination
          currentPage={data.pagination.currentPage}
          totalPages={data.pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}