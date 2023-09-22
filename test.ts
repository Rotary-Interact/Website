"use strict";
import assert from "node:assert/strict";

import {maintain} from "./src/db_maintainer.js";

import * as db from "./src/database.js";
import { RotaryEvent } from "./src/events.js";
import {Member, Members} from "./src/members.js";

let member1: Member; //Member object to test on
const member1ID: string = "test1";
const member1Password: string = "xTYxGfsNgp3kTaTrsVyCu8pfztxt2MP";

let member2: Member; //Member object to test on
const member2ID: string = "test2";
const member2Password: string = "j34PkteWbSqRVpsF3MEsvkeT9SjC9TjT";

let event: RotaryEvent; //RotaryEvent object to test on
const eventID: string = "test001";

async function eventInitTests() {
    assert.deepStrictEqual((await db.getEvents())[eventID], await db.getEvent(eventID));
    event = await db.getEvent(eventID, true);
    assert.deepStrictEqual(event.Spots, 1, "Event should have one spot for testing purposes.");
    assert.deepStrictEqual(event.RemainingSpots, 1, "Event should have one remaining spot for testing purposes.");
}

async function memberInitTests() { // Login tests
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
        name: "Error",
        message: "401: Invalid login"
    });
    assert.notEqual(m, null);

    m.endSession(token1);
    m = null;
    assert.deepStrictEqual(Members[ID], undefined);

    return db.getMember(ID); //Restore member
}

async function eventTests(e: RotaryEvent) {
    return e;
}

async function memberTests(m: Member) {
    return sessionTests(m);
}

async function eventRegistrationTest(m1: Member, m2: Member) {
    assert.deepStrictEqual(event.RemainingSpots, event.Spots);
    assert.deepStrictEqual(await event.Register(m1.ID), true);
    assert.deepStrictEqual(event.RemainingSpots, 0);
    assert.rejects(async () => await event.Register(m1.ID), {
        name: "Error",
        message: "400: You are already registered for this event."
    });
    assert.deepStrictEqual(event.isRegistered(m1.ID), true);
    assert.deepStrictEqual((await m1.getEvents())[event.ID], await db.getEvent(event.ID));

    assert.deepStrictEqual(await event.Register(m2.ID), false);
    assert.equal((await m2.getEvents())[event.ID], undefined);

    assert.deepStrictEqual(await event.Deregister(m1.ID), true);
    assert.equal((await m1.getEvents())[event.ID], undefined);

    assert.deepStrictEqual(event.RemainingSpots, event.Spots);
}

async function idFetchTest(m: Member) {
    assert.deepStrictEqual((await db.getMemberIDsByEmail(m.Email)).includes(m.ID), true);
}

async function meetingParticipationTest(m: Member) {

}

await maintain();
await eventInitTests();
await memberInitTests();
event = await eventTests(event);
member1 = await memberTests(member1);
member2 = await memberTests(member2);
await eventRegistrationTest(member1, member2);
await eventRegistrationTest(member2, member1);
await idFetchTest(member1);
await idFetchTest(member2);
await meetingParticipationTest(member1);
await meetingParticipationTest(member2);
console.log("All tests passed!");
process.exit(0);