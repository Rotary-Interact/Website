"use strict";
import {randStr} from "./utils.js";
import {populateIDs, getMembersAndPasswords, setMemberPassword, syncDB} from "./db_helper.js";
import * as bcrypt from "bcrypt";
import {Member} from "./members.js";
import {RotaryEvent} from "./events.js";
import * as db from "./database.js";
import {Credits} from "./definitions.js";

async function encryptPasswords() {
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

async function syncEventCredits() {
    const events: { [key: string]: RotaryEvent } = await db.getEvents();
    const members: { [key: string]: Member } = {};
    for (const [id, event] of Object.entries(events)) {
        await event.dbPull();
        if (!event.Completed) continue;
        const attendees: Set<string> = event.Attendees;
        const nonAttendees: Set<string> = event.NonAttendees;

        for (const memberID of attendees) {
            let member: Member;
            if (!members[memberID]) { // If member has not already had credits reset, reset credits to zero before syncing
                member = await db.getMember(memberID, true);
                for (const month of Object.keys(member.Credits)) {
                    member.Credits[month].events = 0;
                }
                members[memberID] = member;
            }
            else {
                member = members[memberID];
            }

            member.Credits[event.Month].events += event.Credits;
        }

        for (const memberID of nonAttendees) {
            let member: Member;
            if (!members[memberID]) { // If member has not already had credits reset, reset credits to zero before syncing
                member = await db.getMember(memberID, true);
                for (const month of Object.keys(member.Credits)) {
                    member.Credits[month].events = 0;
                }
                members[memberID] = member;
            }
            else {
                member = members[memberID];
            }

            member.Credits[event.Month].events -= event.Credits;
        }
    }

    for (const member of Object.values(members)) {
        await member.syncCredits();
    }
}

async function syncMeetingCredits() { // Run once for all users after server startup
    const members: { [key: string]: Member } = await db.getMembers();
    for (const member of Object.values(members)) {
        await member.syncCredits();
    }
}

async function sync() {
    await syncDB();
    await populateIDs();
    await encryptPasswords();
    await syncDB();
    await syncEventCredits();
    await syncMeetingCredits();
    await syncDB();
}

async function maintain() {
    await sync();
    setInterval(sync, 60000); // Run every minute
}

export {maintain};