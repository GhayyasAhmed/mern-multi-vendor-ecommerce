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


export interface CreateProductRequest {
  name: string;
  description: string;
  category: string;
  tags?: string;
  originalPrice?: number;
  discountPrice: number;
  stock: number;
  images: string[];
  shopId: string;
}

export interface CreateProductResponse {
  success: boolean;
  product: IProduct;
}

export interface DeleteProductResponse {
  success: boolean;
  message: string;
}

export interface GetShopProductsParams {
  shopId: string;
  page?: number;
  limit?: number;
}

export interface GetShopProductsResponse {
  success: boolean;
  products: IProduct[];
  pagination: ProductsPagination;
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

    getShopProducts: builder.query<GetShopProductsResponse, GetShopProductsParams>({
      query: ({ shopId, page, limit }) => {
        const params = new URLSearchParams();
        if (page) params.set("page", String(page));
        if (limit) params.set("limit", String(limit));
        const qs = params.toString();
        return {
          url: `/product/get-all-products-shop/${shopId}${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      providesTags: (result, _error, { shopId }) =>
        result
          ? [
              ...result.products.map((p) => ({ type: "Product" as const, id: p._id })),
              { type: "Product" as const, id: `SHOP-${shopId}` },
            ]
          : [{ type: "Product" as const, id: `SHOP-${shopId}` }],
    }),

    createProduct: builder.mutation<CreateProductResponse, CreateProductRequest>({
      query: (body) => ({
        url: "/product/create-product",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Product", id: "LIST" },
        { type: "Product", id: `SHOP-${body.shopId}` },
      ],
    }),

    deleteProduct: builder.mutation<DeleteProductResponse, { id: string; shopId: string }>({
      query: ({ id }) => ({
        url: `/product/delete-shop-product/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { id, shopId }) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
        { type: "Product", id: `SHOP-${shopId}` },
      ],
    }),
    
  }),
  overrideExisting: false,
});

export const {
  useGetAllProductsQuery,
  useGetProductByIdQuery,
  useGetRelatedProductsQuery,
  useLazyGetAllProductsQuery,
  useGetShopProductsQuery,
  useCreateProductMutation,
  useDeleteProductMutation,
} = productApiSlice;