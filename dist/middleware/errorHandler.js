"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const AppError_1 = require("../utils/AppError");
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};
const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }
    else {
        console.error("ERROR:", err);
        res.status(500).json({
            status: "error",
            message: "Something went wrong",
        });
    }
};
const handleJWTError = () => new AppError_1.AppError("Invalid token. Please log in again.", 401);
const handleJWTExpiredError = () => new AppError_1.AppError("Your token has expired. Please log in again.", 401);
const handleValidationError = (err) => {
    const message = err.details
        ? err.details.map((d) => d.message).join(", ")
        : err.message;
    return new AppError_1.AppError(message, 400);
};
const errorHandler = (err, _req, res, _next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";
    if (process.env.NODE_ENV === "development") {
        sendErrorDev(err, res);
    }
    else {
        let error = { ...err, message: err.message };
        if (err.name === "JsonWebTokenError")
            error = handleJWTError();
        if (err.name === "TokenExpiredError")
            error = handleJWTExpiredError();
        if (err.name === "ValidationError")
            error = handleValidationError(err);
        sendErrorProd(error, res);
    }
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map