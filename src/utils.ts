'use strict';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const path = (__dirname).replace('/src', '');

function isNumeric(str: unknown): boolean {
  if (typeof str == "number") return true;
  if (typeof str != "string") return false;
  try {
    return (!isNaN(parseFloat(str)));
  }
  catch (error) {
    return false;
  }
}

function isInteger(str: unknown): boolean {
  if (typeof str == "number") return true;
  if (typeof str != "string") return false;
  if (!isNumeric(str)) return false;
  try {
    return (!isNaN(parseInt(str)));
  }
  catch (error) {
    return false;
  }
}

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function randStr(length: number): string {
  let result = '';
  for (let i in Array(length).keys()) result += characters[Math.floor(Math.random() * characters.length)];
  return result;
}


export {
  isNumeric, isInteger, randStr, path, __dirname
};