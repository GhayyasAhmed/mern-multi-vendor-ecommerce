class ErrorHandler extends Error{
    statusCode: Number;
    isOperational: boolean;
    constructor(message: any, statusCode: Number){
        super(message)
        this.statusCode = statusCode
        this.isOperational = true
        Error.captureStackTrace(this, this.constructor)
    }
}

export default ErrorHandler