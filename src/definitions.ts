'use strict';

const errorTypes: { [key: number]: string[] } = {
  400: ['Bad Request', 'Missing or invalid information sent to server(s).'],
  401: ['Unauthorized', 'Your account login has expired. You may have been logged out from another device using your account.'],
  403: ['Forbidden', 'Unauthorized usage or request.'],
  404: ['Resource Not Found', 'The requested page was not found.'],
  409: ['Conflict', 'Attempted to create a resource that already exists. Overwrite prevented.'],
  498: ['Failed reCAPTCHA', 'This action could not be completed because reCAPTCHA did not verify that you are not a robot. This occurs when automated/spam-like traffic is detected from your device and/or network. This may occur if you are using a VPN, or have a failed, expired, or missing reCAPTCHA ("I am not a robot") test.'],
  500: ['Internal Server Error', 'You may try to repeat your request, or report this error and what you were doing prior to its occurrence.']
}

export {
  errorTypes
};