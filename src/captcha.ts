'use strict';
import process from 'node:process';
import 'dotenv/config';

const captchaActions: { [key: string]: number } = {
  "event_register": 0.7,
  "event_deregister": 0.5,
  "event_confirm": 0.6,
  "login": 0.4,
  "signup": 0.7
}; //Action name: minimum score (0.0 to 1.0)

async function captchaCheck(token: unknown, action: string): Promise<boolean> {
  const result = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env['CAPTCHA-SECRET']}&response=${token}`, {
    method: 'POST'
  });
  const outcome: { [key: string]: any } = await result.json();
  if (outcome.action !== action) return false; //Action was modified on client side
  return (outcome.success && outcome.score >= captchaActions[outcome.action]); //Valid token and score >= the required score for this action.
}

export { captchaCheck };