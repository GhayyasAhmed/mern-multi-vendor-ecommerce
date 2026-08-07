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

export interface CreateReviewRequest {
  productId: string;
  orderId: string;
  rating: number;
  comment?: string;
}

export interface ReviewEligibilityResponse {
  success: boolean;
  canReview: boolean;
  orderId: string | null;
  existingReview: { rating: number; comment?: string } | null;
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

export interface UpdateProductRequest {
  id: string;
  shopId: string;
  name?: string;
  description?: string;
  category?: string;
  tags?: string;
  originalPrice?: number;
  discountPrice?: number;
  stock?: number;
  images?: string[];
}

export interface UpdateProductResponse {
  success: boolean;
  product: IProduct;
}

export interface CheckAvailabilityItem {
  _id: string;
  kind?: "product" | "event";
}

export interface CheckAvailabilityResultItem {
  _id: string;
  kind: "product" | "event";
  exists: boolean;
  stock: number;
  discountPrice: number;
  name: string | null;
}

export interface CheckAvailabilityResponse {
  success: boolean;
  items: CheckAvailabilityResultItem[];
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

    getRelatedProducts: builder.query<GetRelatedProductsResponse, { id: string; limit?: number }>({
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

    updateProduct: builder.mutation<UpdateProductResponse, UpdateProductRequest>({
      query: ({ id, ...body }) => ({
        url: `/product/update-product/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id, shopId }) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
        { type: "Product", id: `SHOP-${shopId}` },
      ],
    }),

    checkAvailability: builder.mutation<CheckAvailabilityResponse, CheckAvailabilityItem[]>({
      query: (items) => ({
        url: "/product/check-availability",
        method: "POST",
        body: { items },
      }),
    }),

    createReview: builder.mutation<{ success: boolean; message: string }, CreateReviewRequest>({
      query: (body) => ({ url: "/product/create-new-review", method: "PUT", body }),
      invalidatesTags: (_result, _error, { productId }) => [{ type: "Product", id: productId }, { type: "Product", id: `REVIEW-${productId}` }],
    }),

    getReviewEligibility: builder.query<ReviewEligibilityResponse, string>({
      query: (productId) => ({ url: `/product/review-eligibility/${productId}`, method: "GET" }),
      providesTags: (_result, _error, productId) => [{ type: "Product", id: `REVIEW-${productId}` }],
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
  useUpdateProductMutation,
  useCheckAvailabilityMutation,
  useCreateReviewMutation,
  useGetReviewEligibilityQuery
} = productApiSlice;