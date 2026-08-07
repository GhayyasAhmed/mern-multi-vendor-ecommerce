"use client";
import Image from "next/image";
import { useGetAllProductsAdminQuery } from "@/features/admin/adminApiSlice";

export default function AdminProductsPage() {
  const { data, isLoading, isError } = useGetAllProductsAdminQuery();
  const products = data?.products ?? [];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Products</h1>
      {isLoading ? (
        <p className="text-sm text-[#00000082]">Loading products...</p>
      ) : isError ? (
        <p className="text-sm text-red-500">Could not load products.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#f5f5f5] text-left">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id} className="border-t">
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
      )}
    </div>
  );
}