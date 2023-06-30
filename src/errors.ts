'use strict';
import { errorTypes } from "./definitions.js";

interface ErrInfo {
  error: number,
  code: string,
  summary: string,
  message: string
}

function parseError(error: Error): ErrInfo {
  let message: string[] = (error.message ?? '500').split(': ');
  let code: number = Number.parseInt(message[0]);
  if (Number.isNaN(code)) code = 500;
  return errorInfo(code, message[1] ?? null);
}

function errorInfo(code: number, message: string = ''): ErrInfo {
  if ((!message || message.length === 0) && errorTypes[code][1] !== null) message = errorTypes[code][1];
  return {
    error: code,
    code: code.toString(),
    summary: errorTypes[code][0] ?? "",
    message: message
  };
}

export { ErrInfo, parseError, errorInfo };