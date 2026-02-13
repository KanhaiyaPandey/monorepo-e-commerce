import { NextFunction, Response, Request } from "express";
import { AppError } from "./index";

export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
   if (err instanceof AppError) {
        console.log(`Error ${req.method} ${req.url} - ${err.message}`); 
        res.status(err.statusCode).json({
            status: "error",
            message: err.message,
            details: err.details || null
        });
    } else {
        console.error("Unexpected error:", err);
        res.status(500).json({
            status: "error",
            message: "An unexpected error occurred"
        });   
   }
}