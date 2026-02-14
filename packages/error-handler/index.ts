export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly details?: any;

    constructor(message: string, statusCode: number, details?: any) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Not found error
export class NotFoundError extends AppError {
    constructor(message: string = "Resource not found") {
        super(message, 404);
    }
}

// Validation error
export class ValidationError extends AppError {
    constructor(message: string = "Invalid request data", details?: any) {
        super(message, 400, details);
    }
}

// Authentication error
export class AuthenticationError extends AppError {
    constructor(message: string = "Authentication failed") {
        super(message, 401);
    }
}

// Authorization error
export class AuthorizationError extends AppError {
    constructor(message: string = "Unauthorized access") {
        super(message, 403);
    }
}

// Internal server error
export class InternalServerError extends AppError {
    constructor(message: string = "Internal server error") {
        super(message, 500);
    }
}   

// Database error
export class DatabaseError extends AppError {
    constructor(message: string = "Database error") {
        super(message, 500);
    }
}

// Forbidden error
export class ForbiddenError extends AppError {
    constructor(message: string = "Forbidden") {
        super(message, 403);
    }
}

// Rate limit error
export class RateLimitError extends AppError {
    constructor(message: string = "Too many requests, please try again later.") {
        super(message, 429);
    }
}
