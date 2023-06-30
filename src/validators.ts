'use strict';
import { validationResult, check, body, cookie, param, query, ValidationChain, ValidationError } from 'express-validator';

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors: ValidationError[] = errors.array();

  return res.status(400).json({
    errors: extractedErrors,
    message: extractedErrors[0].msg
  });
}

const eventValidation = (): ValidationChain[] => {
  return [
    param("event").notEmpty().isString()
      .isLength({ min: 1, max: 32 }).withMessage("Invalid event ID length")
      .matches(/^[\w-]+$/).withMessage("Event ID contains invalid characters (may only contain alphanumeric characters, _, and -)")
  ];
}


export {
  eventValidation, validate
}