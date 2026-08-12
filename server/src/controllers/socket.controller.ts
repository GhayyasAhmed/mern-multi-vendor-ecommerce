// import { Request, Response, NextFunction } from "express";
// import catchAsyncErrors from "../middlewares/catchAsyncError.js";
// import ErrorHandler from "../utils/errorhandler.js";
// import { createSocketTicket } from "../utils/socketTicket.js";

// export const issueSocketTicket = catchAsyncErrors(
//   async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     if (req.user) {
//       const ticket = await createSocketTicket({ role: "user", payload: req.user });
//       res.status(200).json({ success: true, ticket });
//       return;
//     }

//     if (req.seller) {
//       const ticket = await createSocketTicket({ role: "seller", payload: req.seller });
//       res.status(200).json({ success: true, ticket });
//       return;
//     }

//     return next(new ErrorHandler("Please login to access this resource", 401));
//   }
// );