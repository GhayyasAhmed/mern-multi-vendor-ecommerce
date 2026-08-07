export interface IAddress {
  _id?: string;
  country?: string;
  city?: string;
  address1?: string;
  address2?: string;
  zipCode?: number;
  addressType?: string;
}

export interface IAvatar {
  public_id?: string;
  url?: string;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  phoneNumber?: number;
  addresses?: IAddress[];
  avatar?: IAvatar;
  wishlist?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IShop {
  _id: string;
  name: string;
  email: string;
  role: "Seller";
  description?: string;
  address: string;
  phoneNumber: number;
  zipCode: number;
  avatar: IAvatar;
  availableBalance: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export type IApiError = {
  success: false;
  message: string;
};


export interface IProductImage {
  public_id: string;
  url: string;
}

export interface IProductReview {
  _id?: string;
  user: Record<string, unknown> | string;
  rating: number;
  comment?: string;
  productId: string;
  createdAt?: string;
}

export interface IProduct {
  _id: string;
  name: string;
  description: string;
  category: string;
  tags?: string;
  originalPrice?: number;
  discountPrice: number;
  stock: number;
  images: IProductImage[];
  reviews?: IProductReview[];
  ratings?: number;
  shopId: string;
  shop: IShop;
  sold_out?: number;
  createdAt?: string;
  updatedAt?: string;
}