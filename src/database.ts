"use strict";
import { Member, Members } from "./members.js";
import { RotaryEvent, RotaryEvents } from "./events.js";
import * as helper from "./db_helper.js";
import {bcrypt} from "bcrypt";

async function getEvent(id: unknown, forceUpdate: boolean = true): Promise<RotaryEvent> {
    if (typeof id !== "string") throw new Error("400: Invalid event ID");
    const event: RotaryEvent = RotaryEvents[id];
    if (!event) {
        //throw new Error("404: Event not found.");
        return RotaryEvent.toMemory(id);
    }
    else {
        await event.dbPull(forceUpdate);
        return event;
    }
}

async function getEvents(): Promise<{ [key: string]: RotaryEvent }> {
    const IDs: string[] = await helper.getEventIDs();
    const events: { [key: string]: RotaryEvent } = {};
    for (const id of IDs) {
        events[id] = await getEvent(id, false);
    }
    return events;
}

async function getEventsByMember(memberID: string): Promise<{ [key: string]: RotaryEvent }> {
    const events: { [key: string]: RotaryEvent } = await getEvents();
    const memberEvents: { [key: string]: RotaryEvent } = {};

    for (const [eventID, event] of Object.entries(events)) {
        if (event.isRegistered(memberID)) memberEvents[eventID] = event;
    }

    return memberEvents;
}

async function getMemberIDsByEmail(email: string): Promise<string[]> {
    return await helper.getMemberIDsByEmail(email);
}

async function getMember(id: unknown, forceUpdate: boolean = true): Promise<Member> {
    if (typeof id !== "string") throw new Error("400: Invalid member ID");
    let member: Member = Members[id];
    if (!member) {
        //throw new Error("404: Member not found.");
        return Member.toMemory(id);
    }
    else {
        await member.dbPull(forceUpdate);
        return member;
    }
}

async function getMembers(): Promise<{ [key: string]: Member }> {
    const IDs: string[] = await helper.getMemberIDs();
    for (const id of IDs) {
        await getMember(id, false);
    }
    return Members;
}

const event_db_columns: string[] = ["ID", "Name", "Description", "Start", "End", "Location (Address)", "Location (Latitude Coordinates)", "Location (Longitude Coordinates)", "Location (Radius)", "Officer First Name", "Officer Last Name", "Officer Email", "Officer Phone Number", "Organizer", "Credits", "Total Spots", "Image", "Participant IDs", "Verified Participant IDs", "Locked Deregistration Period"];

async function _getEventDB(id: string): Promise<{ [key: string]: string }> {
    let values: any[] = await helper.getEvent(id);
    let data: { [key: string]: string } = {};
    for (let i = 0; i < event_db_columns.length; i++) {
        data[event_db_columns[i]] = !!values[i] ? String(values[i]) : "";
    }
    return data;
}

function _setEventDB(id: string, event: RotaryEvent): Promise<void> {
    let updates: { [key: string]: string } = {
        "ID": event.ID,
        "Name": event.Name,
        "Description": event.Description,
        "Start": event.Start,
        "End": event.End,
        "Location (Address)": event.Address,
        "Location (Latitude Coordinates)": String(event.Latitude),
        "Location (Longitude Coordinates)": String(event.Longitude),
        "Location (Radius)": event.Radius,
        "Officer First Name": event.OfficerFirstName,
        "Officer Last Name": event.OfficerLastName,
        "Officer Email": event.OfficerEmail,
        "Officer Phone Number": event.OfficerPhone,
        "Organizer": event.Organizer,
        "Credits": String(event.Credits),
        "Total Spots": String(event.Spots),
        "Image": event.Image,
        "Participant IDs": event.ParticipantIDs,
        "Verified Participant IDs": event.VerifiedParticipantIDs,
        "Locked Deregistration Period": String(event.LockedDeregistrationPeriod),
    };
    return helper.setEvent(id, Object.values(updates));
}

const member_db_columns: string[] = ["Timestamp", "ID", "Account Password", "First Name", "Last Name", "Email Address", "Phone Number", "Grade",
    "Total",
    "September Meeting", "September Events",
    "October Meeting", "October Events",
    "November Meeting", "November Events",
    "December Meeting", "December Events",
    "January Meeting", "January Events",
    "February Meeting", "February Events",
    "March Meeting", "March Events",
    "April Meeting", "April Events",
    "May Meeting", "May Events",
    "June Meeting", "June Events"];

async function _getMemberDB(id: string): Promise<{ [key: string]: string }> {
    let values: any[] = await helper.getMember(id);
    let data: { [key: string]: string } = {};
    for (let i = 0; i < member_db_columns.length; i++) {
        data[member_db_columns[i]] = !!values[i] ? String(values[i]) : "";
    }
    return data;
}

async function _setMemberDB(id: string, member: Member): Promise<void> {
    const updates: { [key: string]: string | number } = {
        "Timestamp": null,
        "ID": member.ID,
        "Account Password": member.Password,
        "First Name": member.FirstName,
        "Last Name": member.LastName,
        "Email Address": member.Email,
        "Phone Number": member.Phone,
        "Grade": member.Grade,
        "Total": member.TotalCredits,
        "September Meeting": member.MeetingCredits("September"),
        "September Events": member.EventCredits("September"),
        "October Meeting": member.MeetingCredits("October"),
        "October Events": member.EventCredits("October"),
        "November Meeting": member.MeetingCredits("November"),
        "November Events": member.EventCredits("November"),
        "December Meeting": member.MeetingCredits("December"),
        "December Events": member.EventCredits("December"),
        "January Meeting": member.MeetingCredits("January"),
        "January Events": member.EventCredits("January"),
        "February Meeting": member.MeetingCredits("February"),
        "February Events": member.EventCredits("February"),
        "March Meeting": member.MeetingCredits("March"),
        "March Events": member.EventCredits("March"),
        "April Meeting": member.MeetingCredits("April"),
        "April Events": member.EventCredits("April"),
        "May Meeting": member.MeetingCredits("May"),
        "May Events": member.EventCredits("May"),
        "June Meeting": member.MeetingCredits("June"),
        "June Events": member.EventCredits("June"),
    };
    await helper.setMember(id, Object.values(updates));
    const publicUpdates: { [key: string]: string | number } = {
        "ID": member.ID,
        "First Name": member.FirstName,
        "Last Name": member.LastName,
        "Email Address": member.Email,
        "Grade": member.Grade,
        "Total": member.TotalCredits,
        "September Meeting": member.MeetingCredits("September"),
        "September Events": member.EventCredits("September"),
        "October Meeting": member.MeetingCredits("October"),
        "October Events": member.EventCredits("October"),
        "November Meeting": member.MeetingCredits("November"),
        "November Events": member.EventCredits("November"),
        "December Meeting": member.MeetingCredits("December"),
        "December Events": member.EventCredits("December"),
        "January Meeting": member.MeetingCredits("January"),
        "January Events": member.EventCredits("January"),
        "February Meeting": member.MeetingCredits("February"),
        "February Events": member.EventCredits("February"),
        "March Meeting": member.MeetingCredits("March"),
        "March Events": member.EventCredits("March"),
        "April Meeting": member.MeetingCredits("April"),
        "April Events": member.EventCredits("April"),
        "May Meeting": member.MeetingCredits("May"),
        "May Events": member.EventCredits("May"),
        "June Meeting": member.MeetingCredits("June"),
        "June Events": member.EventCredits("June"),
    };
    await helper.updatePublicRecord(id, Object.values(publicUpdates));
}

const live: { [key: string]: Function } = {
    getEvent: _getEventDB,
    setEvent: _setEventDB,
    getMember: _getMemberDB,
    setMember: _setMemberDB,
};

export {
    live,
    getEvents, getEvent,
    getMembers, getMember,
    getEventsByMember,
    getMemberIDsByEmail
};

