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