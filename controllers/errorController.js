const AppError = require("../utils/appError");

const handleCastErrorDB = (err) => {
  const message = `invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/);

  const message = `Duplicate field value: ${value}. please use another value`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 404);
};
const handleJWTError = () =>
  new AppError("Invalid token...please login again", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired...please login again", 401);

const sendErrorDev = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  //Rendered Website
  console.error("ERROR", err);
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong",
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  //A)API
  if (req.originalUrl.startsWith("/api")) {
    //operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        //|| 'Something went very wrong!',
      });
    }
    // B)programming or unknown error
    //1) log the error
    console.error("ERROR", err);
    //console.log(process.env);

    //send generic message
    return res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });

    //console.log(err);
  }
  //B) RENDERED WEBSITE
  //operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong",
      msg: err.message,
    });
  }
  //B)programming or unknown error
  //1) log the error
  console.error("ERROR", err);
  //console.log(process.env);

  //send generic message
  return res.status(err.statusCode).json({
    title: "Something went wrong",
    msg: "Pleasen try again",
  });
};

//error middleware
module.exports = (err, req, res, next) => {
  //console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    error.message = err.message;

    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();
    //console.log(err.message);
    //console.log(error.message);

    sendErrorProd(err, req, res);
  }

  next();
};
