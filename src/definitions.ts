'use strict';

const errorTypes: { [key: number]: string[] } = {
  400: ['Bad Request', 'Missing or invalid information entered.'],
  401: ['Unauthorized', 'Your account login failed and may have expired. Try logging in again.'],
  403: ['Forbidden', 'Unauthorized usage or request.'],
  404: ['Resource Not Found', 'The requested page was not found.'],
  409: ['Conflict', 'Attempted to create a resource that already exists. Overwrite prevented.'],
  498: ['Failed reCAPTCHA', 'This action could not be completed because reCAPTCHA did not verify that you are not a robot. This occurs when automated/spam-like traffic is detected from your device and/or network. This may occur if you are using a VPN, or have a failed, expired, or missing reCAPTCHA ("I am not a robot") test.'],
  500: ['Internal Server Error', 'You may try to repeat your request, or report this error and what you were doing prior to its occurrence.']
}

type Name = {
  first: string;
  last: string;
};

type Coordinates = {
  lat: number;
  long: number;
};

type Location = {
  address: string;
  coordinates?: Coordinates;
  radius?: number;
};

type Grade = 9 | 10 | 11 | 12;

type SchoolMonth = "September" | "October" | "November" | "December" | "January" | "February" | "March" | "April" | "May" | "June";
/*
type Credits = {
  "OYO": number;
  "Organized": OrganizedCredits;
};

type OrganizedCredits = {
  "September": CreditMonth;
  "October": CreditMonth;
  "November": CreditMonth;
  "December": CreditMonth;
  "January": CreditMonth;
  "February": CreditMonth;
  "March": CreditMonth;
  "April": CreditMonth;
  "May": CreditMonth;
  "June": CreditMonth;
};
*/

type Credits = {
  "September": CreditMonth;
  "October": CreditMonth;
  "November": CreditMonth;
  "December": CreditMonth;
  "January": CreditMonth;
  "February": CreditMonth;
  "March": CreditMonth;
  "April": CreditMonth;
  "May": CreditMonth;
  "June": CreditMonth;
};

type CreditMonth = {
  meeting: boolean;
  events: number;
};

export {
    errorTypes,
    Name, Grade, Credits, CreditMonth, SchoolMonth,
    Location, Coordinates
};