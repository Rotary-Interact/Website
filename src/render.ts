'use strict';
let time = new Date().getTime();
let pageData = {};
import fs from "fs";
import * as utils from "./utils.js";
import { errorInfo } from "./errors.js";

const metadata = fs.readFileSync(utils.__dirname + '/metadata.html', 'utf8');
const footer = fs.readFileSync(utils.__dirname + '/footer.html', 'utf8');
const header = fs.readFileSync(utils.__dirname + '/header.html', 'utf8');

const template = (html: string, data: { [key: string]: any }): string => html.replace(/{{(\w*)}}/g, (m, key) => data.hasOwnProperty(key) ? data[key] : m);

const sanitize = (html: string): string => html.replace(/<|>/g, '');

const safeTemplate = (html: string, data: { [key: string]: any }): string => {
  html = html.replace(/{{(\w*)}}/g, (m, key) => data.hasOwnProperty(key) ? String(data[key]).replace(/<|>/g, '') : m);
  return html;
};

function errorPage(code: number, message: string = ''): string {
  const error = errorInfo(code, message);
  return template(getPage('error'), error);
}

function getPage(page: string): string {
  let content: string | false;
  if (pageData[page]) { // If the page is cached
    content = pageData[page].content;
  }
  else {
    content = refresh(page, true);
  }
  if (!content) return errorPage(404, 'Page not found');
  return content;
}

function refresh(page: string, init: boolean = false): string | false { // Refresh pageData cache
  if (!fs.existsSync(`${utils.path}/public/views/${page}.html`)) return false;
  if (init) pageData[page] = {}; // If first time, create empty object for this page
  pageData[page].content = template(fs.readFileSync(`${utils.path}/public/views/${page}.html`, 'utf8'), {
    metadata: template(metadata, {
      page: page
    }),
    header: header,
    footer: footer,
  });
  pageData[page].time = time;
  setTimeout(function() {
    refresh(page);
  }, 60000); //Refresh cache in 1 minute
  return pageData[page].content;
}

setInterval(() => time = Date.now(), 1000);

export { errorPage, getPage, template, safeTemplate, sanitize, time };