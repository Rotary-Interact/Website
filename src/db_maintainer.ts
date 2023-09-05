"use strict";
import {randStr} from "./utils.js";
import {populateIDs, getMembersAndPasswords, setMemberPassword} from "./db_helper.js";
import * as bcrypt from "bcrypt";
import {getEvents, getMembers} from "./database.js";
import {Member} from "./members.js";
import {RotaryEvent} from "./events.js";
import * as db from "./database.js";
import {Credits} from "./definitions.js";

async function configureNewUsers() {
    const members = await getMembersAndPasswords();
    for (const [id, password] of members) {
        if (!(password.slice(0, 4) === "$2a$" || password.slice(0, 4) === "$2b$")) {
            const encryptedPassword: string = await encrypt(password, 10);
            await setMemberPassword(id, encryptedPassword);
        }
    }
}

function encrypt(plaintextPassword, saltRounds): Promise<string> {
    return new Promise((resolve, reject) => {
        bcrypt.genSalt(saltRounds, function(err, salt) {
            if (err) throw err;
            bcrypt.hash(plaintextPassword, salt, function(err, hash) {
                if (err) throw err;
                resolve(hash);
            });
        });
    });
}

async function syncCredits() {
    const events: { [key: string]: RotaryEvent } = await getEvents();
    const members: Set<Member> = new Set<Member>();
    for (const [id, event] of Object.entries(events)) {
        await event.dbPull();
        if (!event.Completed) continue;
        const attendees: Set<string> = event.Attendees;
        const nonAttendees: Set<string> = event.NonAttendees;

        for (const memberID of attendees) {
            const member: Member = await db.getMember(memberID, true);
            member.Credits[event.Month].events += event.Credits;
            members.add(member);
        }

        for (const memberID of nonAttendees) {
            const member: Member = await db.getMember(memberID, true);
            member.Credits[event.Month].events -= event.Credits;
            members.add(member);
        }
    }

    for (const member of Object.values(members)) {
        await member.syncCredits();
    }
}

async function maintain() {
    await populateIDs(); //Run once for each server startup
    await configureNewUsers();
    await syncCredits();
    setInterval(configureNewUsers, 10000); //Run every 10 seconds
    setInterval(syncCredits, 60000); //Run every minute
}

export {maintain};