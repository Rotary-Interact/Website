"use strict";
import assert from 'node:assert/strict';

import {maintain} from "./src/db_maintainer.js";

await maintain();

import * as db from "./src/database.js";
import { RotaryEvent } from "./src/events.js";
import { Member } from "./src/members.js";

let member1: Member; //Member object to test on
const member1ID: string = "";
const member1Password: string = "";

let member2: Member; //Member object to test on
const member2ID: string = "";
const member2Password: string = "";

let event: RotaryEvent; //RotaryEvent object to test on
const eventID: string = "";

async function eventInitTests() {
    assert.deepStrictEqual((await db.getEvents())[e.ID], await db.getEvent(e));
    event = await db.getEvent(eventID, true);
    assert.deepStrictEqual(event.Spots, 1, "Event should have one spot for testing purposes.");
}

async function loginTests() {
    member1 = await db.getMember(member1ID, true);
    assert.deepStrictEqual(await member1.comparePassword(member1Password), true);
    member2 = await db.getMember(member2ID, true);
    assert.deepStrictEqual(await member2.comparePassword(member2Password), true);

    assert.deepStrictEqual((await db.getMembers())[member1ID], await db.getMember(member1ID));
    assert.deepStrictEqual((await db.getMembers())[member2ID], await db.getMember(member2ID));
}

async function sessionTests(m: Member) {
    const ID: string = m.ID;
    const token1: string = m.startSession();
    const token2: string = m.startSession();
    m.validateSession(token1);
    m.validateSession(token2);

    m.endSession(token2);
    assert.throws(() => m.validateSession(token2), {
        name: 'Error',
        message: '401: Invalid login'
    });
    assert.notEqual(m, null);

    m.endSession(token1);
    assert.deepStrictEqual(m, null);

    m = await db.getMember(ID); //Restore member
}

async function eventTests(e: RotaryEvent) {

}

async function memberTests(m: Member) {
    await sessionTests(m);
}

async function eventRegistrationTest(m1: Member, m2: Member) {
    assert.deepStrictEqual(event.RemainingSpots, event.Spots);
    assert.deepStrictEqual(await event.Register(m1.ID), true);
    assert.deepStrictEqual(event.RemainingSpots, 0);
    assert.throws(async () => await event.Register(member1ID), {
        name: 'Error',
        message: '400: You are already registered for this event.'
    });
    assert.deepStrictEqual(event.isRegistered(m1.ID), true);
    assert.deepStrictEqual((await m1.getEvents())[event.ID], db.getEvent(event.ID));

    assert.deepStrictEqual(await event.Register(m2.ID), false);

    assert.deepStrictEqual(event.Deregister(m1.ID), true);

    assert.equal((await m1.getEvents())[event.ID], null);
    assert.deepStrictEqual(event.RemainingSpots, event.Spots);
}



await loginTests();
await eventTests(event);
await memberTests(member1);
await memberTests(member2);
await eventRegistrationTest(member1, member2);
await eventRegistrationTest(member2, member1);
