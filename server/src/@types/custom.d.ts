import {Request} from "express"
import {IUser} from "../models/user.model.ts"
import {IShop} from "../models/shop.model.ts"

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
            seller?: IShop;
        }
    }
}
