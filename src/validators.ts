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
    body("member").notEmpty().withMessage("Missing member ID. Please login again.").isString().withMessage("Invalid member ID. Please login again.")
        .isLength({ min: 7, max: 7 }).withMessage("Invalid member ID. Please login again.")
        .matches(/^[a-zA-Z0-9]+$/).withMessage("Invalid member ID. Please login again."),
    body("password").notEmpty().withMessage("Missing password. Please login again.").isString().withMessage("Invalid password. Please login again.")
        .isLength({ min: 8, max: 32 }).withMessage("Invalid password (must be 8 to 32 characters). Please login again.")
        .matches(/^.{8,32}$/).withMessage("Invalid password. Please login again.")
  ];
}

const emailValidation = (): ValidationChain[] => {
  return [
    query("email").notEmpty().withMessage("Missing email. Please try again.").isString().withMessage("Invalid email. Please try again.")
        .isLength({ min: 3, max: 320 }).withMessage("Invalid email. Please try again.")
        .matches(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/).withMessage("Invalid email. Please try again.")
  ];
}

export {
  eventValidation, memberValidation, sessionValidation, loginValidation, emailValidation, validate
}