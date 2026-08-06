import { apiSlice } from "@/lib/api/apiSlice";
import type { IProduct } from "@/types";

export interface ProductsPagination {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  limit: number;
}

export interface GetAllProductsResponse {
  success: boolean;
  products: IProduct[];
  pagination: ProductsPagination;
}

export interface GetProductResponse {
  success: boolean;
  product: IProduct;
}

export interface GetRelatedProductsResponse {
  success: boolean;
  products: IProduct[];
}

export interface GetAllProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sortBy?: "newest" | "oldest" | "best-selling" | "price-low" | "price-high";
}

function buildQueryString(params: GetAllProductsParams): string {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.category) query.set("category", params.category);
  if (params.search) query.set("search", params.search);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export const productApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllProducts: builder.query<GetAllProductsResponse, GetAllProductsParams | void>({
      query: (params) => ({
        url: `/product/get-all-products${buildQueryString(params ?? {})}`,
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.products.map((p) => ({ type: "Product" as const, id: p._id })),
              { type: "Product" as const, id: "LIST" },
            ]
          : [{ type: "Product" as const, id: "LIST" }],
    }),

    getProductById: builder.query<GetProductResponse, string>({
      query: (id) => ({
        url: `/product/get-product/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Product", id }],
    }),

    getRelatedProducts: builder.query<GetRelatedProductsResponse,{ id: string; limit?: number }>({
      query: ({ id, limit }) => ({
        url: `/product/get-related-products/${id}${limit ? `?limit=${limit}` : ""}`,
        method: "GET",
      }),
      providesTags: (_result, _error, { id }) => [{ type: "Product", id: `RELATED-${id}` }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllProductsQuery,
  useGetProductByIdQuery,
  useGetRelatedProductsQuery,
  useLazyGetAllProductsQuery,
} = productApiSlice;