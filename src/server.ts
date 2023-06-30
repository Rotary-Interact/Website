'use strict';
import { captchaCheck } from "./captcha.js";
import { time, errorPage, getPage, template, safeTemplate } from "./render.js";
import { ErrInfo, parseError } from "./errors.js";
import { validate, eventValidation } from "./validators.js";
import { events, Event, EventInfo } from "./database.js";
import express from 'express';
const app = express();
import * as http from 'http';
const server = http.createServer(app);
import { body, validationResult, check, param, query } from 'express-validator';
import crypto from 'crypto';
import compression from 'compression';
app.use(compression());
import cors from 'cors';

app.use(cors({
  //origin: ['https://www.example.com', 'https://www.example.io']
}));

app.set('trust proxy', true);

import helmet from 'helmet';
app.use(helmet.frameguard());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

type Request = Record<string, any>;
type Response = Record<string, any>;

app.get('/', (req: Request, res: Response) => {
  return res.status(200).send(getPage('landing'));
});

const whitelistedURLs = [];

app.get('/redirect', async (req: Request, res: Response) => {
  try {
    const url: URL = new URL(req.query.url);
    if (!whitelistedURLs.includes(url.hostname)) return res.status(200).send(safeTemplate(getPage('outlink'), {
      host: url.hostname,
      redirect: url
    }));
    return res.redirect(url);
  }
  catch (err) {
    return res.status(400).send(errorPage(400, "Invalid redirect URL"));
  }
});

app.route('/events')
  .get(eventValidation(), validate, async (req: Request, res: Response) => {
    try {
      const event: EventInfo = await events.get(req.params.id);
      let HTML: string = ``;
      for (const event of events) {
        HTML += `${event.name}`;
      }
      return res.status(200).send(safeTemplate(getPage('event'), {
        eventsHTML: HTML
      }));
    } catch (err) {
      const error: ErrInfo = parseError(err);
      return res.status(error.error).send(errorPage(error.error, error.message));
    }
  });

app.route('/events/:id')
  .get(eventValidation(), validate, async (req: Request, res: Response) => {
    try {
      //if (!(await captchaCheck(req.body['g-recaptcha-response'], 'room_join'))) throw new Error("498: ReCAPTCHA verification failed.");
      const event: Event = db.events[req.params.id];
      if (!event) throw new Error("404: Event not found.");
      const info: EventInfo = await event.getInfo();
      return res.status(200).send(template(getPage('event'), {
        id: event.id,
        name: event.name,
        description: event.description,
        start: event.start,
        end: event.end,
        location: event.location, //TODO: Maybe have a Google Maps embed with the location?
        image: event.image,
        officer: event.officer,
        organizer: event.organizer,
        credits: event.credits
      }));
    } catch (err) {
      const error: ErrInfo = parseError(err);
      return res.status(error.error).send(errorPage(error.error, error.message));
    }
  });

app.use((req, res, next) => {
  res.status(404);
  switch (req.get('Accept')) {
    case 'text/javascript':
      res.send('');
      break;
    case 'text/css':
      res.send('');
      break;
    case 'text/html':
      res.send(errorPage(404));
      break;
    default:
      res.send(errorPage(404));
  }
});

export {
  server
};