'use strict';
import { validationResult, check, body, cookie, param, query, ValidationChain, ValidationError } from 'express-validator';
import { template, getPage } from "./render.js";

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors: ValidationError[] = errors.array();

  return res.status(400).send(template(getPage("error"), {
    code: 400,
    summary: "Invalid input",
    message: extractedErrors[0].msg
  }));
}

const eventValidation = (): ValidationChain[] => {
  return [
    param("event").notEmpty().isString()
      .isLength({ min: 5, max: 5 }).withMessage("Invalid event ID length")
      .matches(/^[a-zA-Z0-9]+$/).withMessage("Event ID contains invalid characters (may only contain alphanumeric characters)")
  ];
}

const memberValidation = (): ValidationChain[] => {
  return [
    param("member").notEmpty().isString()
        .isLength({ min: 7, max: 7 }).withMessage("Invalid member ID length")
        .matches(/^[a-zA-Z0-9]+$/).withMessage("Member ID contains invalid characters (may only contain alphanumeric characters)")
  ];
}

//TODO: maybe there is signedCookie function instead of cookie function

const sessionValidation = (): ValidationChain[] => {
  return [
    cookie("member").notEmpty().withMessage("Missing member ID. Please login again.").isString().withMessage("Invalid member ID. Please login again.")
        .isLength({ min: 7, max: 7 }).withMessage("Invalid member ID. Please login again.")
        .matches(/^[a-zA-Z0-9]+$/).withMessage("Invalid member ID. Please login again."),
    cookie("token").notEmpty().withMessage("Missing token. Please login again.").isString().withMessage("Invalid token. Please login again.")
        .isLength({ min: 64, max: 64 }).withMessage("Invalid token. Please login again.")
        .matches(/^[\w-]+$/).withMessage("Invalid token. Please login again.")
  ];
}

const loginValidation = (): ValidationChain[] => {
  return [
    cookie("member").notEmpty().withMessage("Missing member ID. Please login again.").isString().withMessage("Invalid member ID. Please login again.")
        .isLength({ min: 7, max: 7 }).withMessage("Invalid member ID. Please login again.")
        .matches(/^[a-zA-Z0-9]+$/).withMessage("Invalid member ID. Please login again."),
    cookie("token").notEmpty().withMessage("Missing token. Please login again.").isString().withMessage("Invalid token. Please login again.")
        .isLength({ min: 64, max: 64 }).withMessage("Invalid token. Please login again.")
        .matches(/^[\w-]+$/).withMessage("Invalid token. Please login again.")
  ];
}


export {
  eventValidation, memberValidation, sessionValidation, loginValidation, validate
}