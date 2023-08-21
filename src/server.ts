'use strict';
import { captchaCheck } from "./captcha.js";
import { time, errorPage, getPage, template, safeTemplate, sanitize } from "./render.js";
import { ErrInfo, parseError } from "./errors.js";
import {
  validate,
  eventValidation,
  memberValidation,
  sessionValidation,
  loginValidation,
  emailValidation
} from "./validators.js";
import * as db from "./database.js";
import { RotaryEvent } from "./events.js";
import { Member } from "./members.js";
import express from 'express';
const app = express();
import * as http from 'http';
const server = http.createServer(app);
import { body, validationResult, check, param, query } from 'express-validator';
import compression from 'compression';
app.use(compression());
import cors from 'cors';

app.use(cors({
  //origin: ['https://www.example.com', 'https://www.example.io']
}));

app.set('trust proxy', true);

import helmet from 'helmet';
app.use(helmet.frameguard());

import cookieParser from 'cookie-parser';
import {log} from "util";
app.use(cookieParser());

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

const cookieOptions = {
    maxAge: 1000 * 60 * 60 * 24 * 7, //7 days
    httpOnly: true,
    signed: true,
};

app.route('/login')
    .get(async (req: Request, res: Response) => {
      try {
        /*
        TODO:
         - Form with fields whose action is to POST to this same route. Fields have name attributes of "member" (this is the member ID) and "password".
         - Link to signup ("https://forms.gle/mBDm3VDTCA42BAvB9")
         - Link to edit account password ("https://forms.gle/mBDm3VDTCA42BAvB9") (they should be signed into the same Google Account that they used to sign up and select "Edit your response")
         - Form that asks for email address and submission sends a get request to "/get_id?email=[email]" (this is for if they forgot their member ID)
         */
        return res.status(200).send(getPage('login'));
      } catch (err) {
        const error: ErrInfo = parseError(err);
        return res.status(error.error).send(errorPage(error.error, error.message));
      }
    })
    .post(loginValidation(), validate, async (req: Request, res: Response) => {
        try {
            if (!(await captchaCheck(req.body['g-recaptcha-response'], 'login'))) throw new Error("498: ReCAPTCHA verification failed.");
            const member: Member = await db.getMember(req.body['member'], true);
            if (!await member.comparePassword(req.body['password'])) throw new Error("401: Incorrect password");
            const token: string = member.startSession();
            return res.status(200).cookie('member', member.ID, cookieOptions).cookie('token', token, cookieOptions).redirect('/dashboard');
        } catch (err) {
            const error: ErrInfo = parseError(err);
            return res.status(error.error).send(errorPage(error.error, error.message));
        }
    });

app.get('/logout', async (req: Request, res: Response) => {
  try {
    const member: Member = await db.getMember(req.signedCookies['member']);
    try {
      member.endSession(req.signedCookies['token']);
    } catch (err) {
      //Do nothing
    }
    return res.status(200).clearCookie('member').clearCookie('token').redirect('/');
  } catch (err) {
    const error: ErrInfo = parseError(err);
    return res.status(error.error).send(errorPage(error.error, error.message));
  }
});

app.get('/dashboard', sessionValidation(), validate, async (req: Request, res: Response) => {
  try {
    const member: Member = await db.getMember(req.signedCookies['member'], true);
    member.validateSession(req.signedCookies['token']);
    const events: { [key: string]: RotaryEvent } = await db.getEventsByMember(req.signedCookies['member']); //Events that the member is registered for
    let HTML: string = ``;
    for (const [id, event] of Object.entries(events)) {
      HTML += `${event.Name}`; //TODO: Button or card with event summary that has link to page with full info ("/events/${event.ID}")
    }
    /*
    TODO:
     - Display member name, grade, and total credits
     - Display link to discover events ("/events")
     - Display link to their member page("/members/{{id}}")
     - Display link to Member Form ("Account Settings") for them to adjust their account info https://forms.gle/mBDm3VDTCA42BAvB9 (they should be signed into the same Google Account that they used to sign up and select "Edit your response")
     */
    return res.status(200).send(template(getPage('dashboard'), {
        id: member.ID,
        name: member.Name,
        grade: member.Grade,
        credits: member.TotalCredits,
        eventsHTML: HTML
    }));
  } catch (err) {
    const error: ErrInfo = parseError(err);
    return res.status(error.error).send(errorPage(error.error, error.message));
  }
});

app.route('/events')
  .get(async (req: Request, res: Response) => {
    try {
      const events: { [key: string]: RotaryEvent } = await db.getEvents();
      let HTML: string = ``;
      for (const [id, event] of Object.entries(events)) {
        HTML += `${event.Name}`; //TODO: Button or card with event summary that has link to page with full info ("/events/${event.ID}")
      }
      return res.status(200).send(template(getPage('event'), {
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
      const event: RotaryEvent = await db.getEvent(req.params.id);
      return res.status(200).send(safeTemplate(getPage('event'), { //TODO: Display link to register ("/events/{{id}}/register") and deregister ("/events/{{id}}/deregister")
        id: event.ID,
        name: event.Name,
        image: event.Image, //Image URL
        description: event.Description,
        start: event.Start, //Preformatted datetime string for EST
        end: event.End, //Preformatted datetime string for EST
        duration: event.Duration, //Event duration in minutes
        address: event.Address, //TODO: Maybe have a Google Maps embed with the location?
        officer: event.Officer,
        officerPhone: event.OfficerPhone,
        officerEmail: event.OfficerEmail,
        organizer: event.Organizer,
        credits: event.Credits,
        totalSpots: event.Spots,
        totalParticipants: event.Participants,
        remainingSpots: event.RemainingSpots,
        full: event.Full, //TODO: Allow users to filter out events that are full
        lastUpdated: event.Age / 60, //The previous synchronization with server in minutes (event.Age alone is seconds)
        lockedDeregistrationPeriod: event.LockedDeregistrationPeriod, //TODO: Display this as minimum notice for deregistration in hours (after this period, they must contact the officer to deregister)
        //proximityParticipation: (event.ProximityParticipation ? "Enabled" : "Disabled"), //Display link to confirm participation if enabled //TODO: Future Feature
      }));
    } catch (err) {
      const error: ErrInfo = parseError(err);
      return res.status(error.error).send(errorPage(error.error, error.message));
    }
  });

app.route('/events/:id/register')
  .get(eventValidation(), sessionValidation(), validate, async (req: Request, res: Response) => {
    try {
      const event: RotaryEvent = await db.getEvent(req.params['id']);
      return res.status(200).send(template(getPage('event_register'), { //TODO: Confirm registration with a form (containing a button) whose action is a POST request to this same route
        id: event.ID,
        name: event.Name,
        credits: event.Credits,
        image: event.Image, //Image URL
        start: event.Start, //Preformatted datetime string for EST TODO: Highlight this in some way, as this determines if they are able to attend the event.
        end: event.End, //Preformatted datetime string for EST
        duration: event.Duration, //Event duration in minutes
        address: event.Address, //TODO: Highlight this in some way, as this determines if they are able to attend the event.
      }));
    } catch (err) {
      const error: ErrInfo = parseError(err);
      return res.status(error.error).send(errorPage(error.error, error.message));
    }
  })
  .post(eventValidation(), sessionValidation(), validate, async (req: Request, res: Response) => {
    try {
      if (!(await captchaCheck(req.body['g-recaptcha-response'], 'event_register'))) throw new Error("498: ReCAPTCHA verification failed.");
      const member: Member = await db.getMember(req.signedCookies['member']);
      member.validateSession(req.signedCookies['token']);
      const event: RotaryEvent = await db.getEvent(req.params['id']); //forceUpdate not necessary
      const success: boolean = await event.Register(member.ID);
      if (success) {
        return res.status(200).send(template(getPage('event_register_success'), { //TODO: Display link back to event information page ("/events/{{id}}") and discovery page ("/events"). Also have a message that says "Successfully Registered for {{name}}!".
          id: event.ID,
          name: event.Name,
          image: event.Image, //Image URL
          start: event.Start, //Preformatted datetime string for EST TODO: Highlight this in some way and prompt them to add it to their calendar
          duration: event.Duration, //Event duration in minutes
          address: event.Address, //TODO: Highlight this in some way and prompt them to add it to their calendar
        }));
      }
      else {
        return res.status(200).send(template(getPage('event_register_fail'), { //TODO: Display link back to events page ("/events") that says "Explore Other Events". Also have a message that says "{{name}} is full".
          name: event.Name,
          image: event.Image, //Image URL
        }));
      }
    } catch (err) {
      const error: ErrInfo = parseError(err);
      return res.status(error.error).send(errorPage(error.error, error.message));
    }
  });

app.route('/events/:id/deregister')
    .get(eventValidation(), validate, async (req: Request, res: Response) => {
      try {
        const event: RotaryEvent = await db.getEvent(req.params['id']);
        return res.status(200).send(template(getPage('event_deregister'), { //TODO: Confirm deregistration with a form (containing just a button) whose action is a POST request to this same route
          id: event.ID,
          name: event.Name,
          credits: event.Credits,
          image: event.Image, //Image URL
          start: event.Start, //Preformatted datetime string for EST
          end: event.End, //Preformatted datetime string for EST
          duration: event.Duration, //Event duration in minutes
          address: event.Address,
        }));
      } catch (err) {
        const error: ErrInfo = parseError(err);
        return res.status(error.error).send(errorPage(error.error, error.message));
      }
    })
    .post(eventValidation(), sessionValidation(), validate, async (req: Request, res: Response) => {
      try {
        if (!(await captchaCheck(req.body['g-recaptcha-response'], 'event_deregister'))) throw new Error("498: ReCAPTCHA verification failed.");
        const member: Member = await db.getMember(req.signedCookies['member']);
        member.validateSession(req.signedCookies['token']);
        const event: RotaryEvent = await db.getEvent(req.params['id'], true);
        const success: boolean = await event.Deregister(member.ID);
        if (success) {
          return res.status(200).send(template(getPage('event_deregister_success'), { //TODO: Display link back to dashboard ("/dashboard") and a message that reads "Successfully Deregistered from {{name}}!".
            name: event.Name,
            image: event.Image, //Image URL
          }));
        }
        else {
          return res.status(200).send(template(getPage('event_deregister_fail'), { //TODO: Display link back to event information page ("/events/{{id}}") and dashboard ("/dashboard"). Include a message that reads "It is too late to deregister from this event. Contact the event's Rotary officer to deregister.".
            name: event.Name,
            image: event.Image, //Image URL
          }));
        }
      } catch (err) {
        const error: ErrInfo = parseError(err);
        return res.status(error.error).send(errorPage(error.error, error.message));
      }
    });

app.get('/get_id', emailValidation(), validate, async (req: Request, res: Response) => {
  try {
    if (!(await captchaCheck(req.body['g-recaptcha-response'], 'get_id'))) throw new Error("498: ReCAPTCHA verification failed.");
    const IDs: string[] = await db.getMemberIDsByEmail(req.query['email']);
    return res.status(200).send(template(getPage('get_id'), {
      IDs: IDs.join(', '),
      email: req.query['email']
    }));
  } catch (err) {
    const error: ErrInfo = parseError(err);
    return res.status(error.error).send(errorPage(error.error, error.message));
  }
});

/*
//TODO: Future Feature
app.route('/events/:id/confirm')
    .get(eventValidation(), validate, async (req: Request, res: Response) => {
      try {
        const event: RotaryEvent = await db.getEvent(req.params['id']);
        return res.status(200).send(template(getPage('event_confirm'), { //TODO: Confirm participation with a button in a form whose action is a POST request to this same route
          id: event.ID,
          name: event.Name,
          credits: event.Credits,
          proximityParticipation: (event.ProximityParticipation ? "Enabled" : "Disabled"), //TODO: Display some sort of error if ProximityParticipation is Disabled (you cannot confirm participation online)
          address: event.Address, //TODO: Maybe have a Google Maps embed with the location (or even better, the coordinates and/or radius) and the user's relative location?
          coordinates: event.Coordinates,
          radius: event.Radius
        }));
      } catch (err) {
        const error: ErrInfo = parseError(err);
        return res.status(error.error).send(errorPage(error.error, error.message));
      }
    })
    .post(eventValidation(), sessionValidation(), validate, async (req: Request, res: Response) => {
      try {
        if (!(await captchaCheck(req.body['g-recaptcha-response'], 'event_confirm'))) throw new Error("498: ReCAPTCHA verification failed.");
        const member: Member = await db.getMember(req.signedCookies['member']);
        member.validateSession(req.signedCookies['token']);
        const event: RotaryEvent = await db.getEvent(req.params['id']);
        const success: boolean = await event.Register(member.ID);
        if (success) {
          return res.status(200).send(template(getPage('event_confirm_success'), { //TODO:
            id: event.ID,
            name: event.Name
          }));
        }
        else {
          return res.status(200).send(template(getPage('event_confirm_fail'), { //TODO:
            name: event.Name
          }));
        }
      } catch (err) {
        const error: ErrInfo = parseError(err);
        return res.status(error.error).send(errorPage(error.error, error.message));
      }
    });
*/

app.route('/members')
  .get(async (req: Request, res: Response) => {
    try {
      const members: { [key: string]: Member } = await db.getMembers();
      let HTML: string = ``;
      for (const [id, member] of Object.entries(members)) {
        HTML += `${member.Name}`; //TODO: Button or card with member name and link to member page with full info ("/members/${member.ID}")
      }
      return res.status(200).send(template(getPage('event'), {
        membersHTML: HTML
      }));
    } catch (err) {
      const error: ErrInfo = parseError(err);
      return res.status(error.error).send(errorPage(error.error, error.message));
    }
  });

app.route('/members/:id')
  .get(memberValidation(), validate, async (req: Request, res: Response) => {
    try {
      const member: Member = await db.getMember(req.params.id);
      return res.status(200).send(template(getPage('member'), {
        id: member.ID,
        name: member.Name,
        grade: member.Grade,
        credits: member.TotalCredits,
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