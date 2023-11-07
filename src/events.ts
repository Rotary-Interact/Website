"use strict";

import { isNumeric, isInteger } from "./utils.js";
import {Member} from "./members.js";
import { Name, Coordinates, Location } from "./definitions.js";
import { ErrInfo, parseError } from "./errors.js";
import * as db from "./database.js";

class RotaryEvent {
    private readonly id: string;
    private syncTime: number;
    private name: string;
    private description: string;
    private start: string;
    private end: string;
    private duration: number; //Minutes
    private location: Location;
    public ProximityParticipation: boolean;
    private officer: Name;
    private officerPhone: string;
    private officerEmail: string;
    private organizer: string;
    private credits: number;
    private totalSpots: number;
    private participants: Set<string>;
    private verifiedParticipants: Set<string>;
    private lockedDeregistrationPeriod: number;
    private image: string;

    static async toMemory(id: string): Promise<RotaryEvent> { // Creates in-memory replica of entity in DB
        if (!!RotaryEvents[id]) return RotaryEvents[id]; //throw new Error("409: An event with this ID already exists.");
        const event: RotaryEvent = new RotaryEvent(id);
        await event.dbPull(true);
        RotaryEvents[event.ID] = event;
        return event;
    }

    private constructor(id: string) {
        this.id = id;
        this.participants = new Set<string>();
    }

    public dbPull(force: boolean = false) {
        if (force || this.Age >= 300) { //More than 5 minutes since last sync
            return this.dbPuller();
        }
    }

    private async dbPuller() {
        this.syncTime = new Date().getTime();
        try {
            const info: { [key: string]: string } = await db.live.getEvent(this.id);
            this.name = info["Name"];
            this.description = info["Description"];

            this.start = new Date(info["Start"]).toLocaleString('en-US', { timeZone: 'EST' });
            this.end = new Date(info["End"]).toLocaleString('en-US', { timeZone: 'EST' });

            this.duration = (new Date(this.end).getTime() - new Date(this.start).getTime()) / 60000;
            if (!isInteger(this.duration)) {
                this.duration = 0;
            }

            this.location = {
                address: info["Location (Address)"]
            }
            if (isNumeric(info["Location (Latitude Coordinates)"]) && isNumeric(info["Location (Longitude Coordinates)"]) && isNumeric(info["Location (Radius)"])) {
                this.ProximityParticipation = true;
                this.location.coordinates = {
                    lat: parseFloat(info["Location (Latitude Coordinates)"]),
                    long: parseFloat(info["Location (Longitude Coordinates)"])
                }
            }
            else {
                this.ProximityParticipation = false;
            }

            this.officer = {
                first: info["Officer First Name"],
                last: info["Officer Last Name"],
            };

            this.organizer = info["Organizer"];
            this.credits = isNumeric(info["Credits"]) ? parseFloat(info["Credits"]) : 0;
            this.totalSpots = isInteger(info["Total Spots"]) ? parseInt(info["Total Spots"]) : 0;
            this.lockedDeregistrationPeriod = isInteger(info["Locked Deregistration Period"]) ? parseInt(info["Locked Deregistration Period"]) : 0;
            this.image = ((info["Image"] === null || info["Image"] === "") ? "/media/logo.webp" : info["Image"]);

            try {
                let participants: string[] = info["Participant IDs"].replace(', ', ',').split(',');
                if (participants.includes("")) {
                    participants.splice(participants.indexOf(""), 1);
                }
                this.participants = new Set(participants);
            }
            catch (err) {
                throw new Error("400: Invalid Event Participant IDs");
            }

            try {
                let verifiedParticipants: string[] = info["Verified Participant IDs"].replace(', ', ',').split(',');
                if (verifiedParticipants.includes("")) {
                    verifiedParticipants.splice(verifiedParticipants.indexOf(""), 1);
                }
                this.verifiedParticipants = new Set(verifiedParticipants);
            }
            catch (err) {
                throw new Error("400: Invalid Event Verified Participant IDs");
            }
        }
        catch (err) {
            const info: ErrInfo = parseError(err.message);
            if (info.error === 404) {
                delete RotaryEvents[this.ID];
            }
            throw new Error(info.message + " | Event ID: " + this.ID);
        }
    }

    get ID() {
        return this.id;
    }

    get Age() { // Seconds since dbPull called
        if (!isInteger(this.syncTime)) return 0;
        return (new Date().getTime() - this.syncTime) / 1000;
    }

    get Name() {
        return this.name;
    }

    get Description() {
        return this.description;
    }

    get Month() { //Month of event start
        return ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][new Date(this.Start).getMonth()];
    }

    get Start() {
        return this.start;
    }

    get End() {
        return this.end;
    }

    get Duration() { //Event duration in minutes
        return this.duration;
    }

    get Address() {
        return this.location.address;
    }

    get Coordinates() {
        if (!this.location.coordinates.lat || !this.location.coordinates.long) {
            return "N/A";
        }
        return `${String(this.location.coordinates.lat)}, ${String(this.location.coordinates.long)}`;
    }

    get Latitude() {
        return !!this.location.coordinates ? (!!this.location.coordinates.lat ? this.location.coordinates.lat : 0) : 0;
    }

    get Longitude() {
        return !!this.location.coordinates ? (!!this.location.coordinates.long ? this.location.coordinates.long : 0) : 0;
    }

    get Radius() {
        if (!this.location.radius) {
            return "";
        }
        return `${String(this.location.coordinates.lat)}, ${String(this.location.coordinates.long)}`;
    }

    get ProximityParticipationEnabled() {
        return this.ProximityParticipation;
    }

    get Officer() {
        return `${this.officer.first} ${this.officer.last}`;
    }

    get OfficerFirstName() {
        return this.officer.first;
    }

    get OfficerLastName() {
        return this.officer.last;
    }

    get OfficerEmail() {
        return this.officerEmail;
    }

    get OfficerPhone() {
        return this.officerPhone;
    }

    get Organizer() {
        return this.organizer;
    }

    get Credits() {
        return this.credits;
    }

    get Spots() {
        return this.totalSpots;
    }

    get Participants() {
        return this.participants.size;
    }

    get VerifiedParticipants() {
        return this.verifiedParticipants.size;
    }

    get ParticipantIDs() {
        return [...this.participants].join(",");
    }

    get VerifiedParticipantIDs() {
        return [...this.verifiedParticipants].join(",");
    }

    get Attendees() {
        return this.verifiedParticipants;
    }

    get NonAttendees() {
        return new Set([...this.participants].filter(p => !this.verifiedParticipants.has(p)));
    }

    public isRegistered(memberID: string): boolean {
        return this.participants.has(memberID);
    }

    public isVerified(memberID: string): boolean {
        return this.verifiedParticipants.has(memberID);
    }

    get RemainingSpots() {
        return this.Spots - this.Participants;
    }

    get Full() {
        return (this.RemainingSpots <= 0);
    }

    get Image() {
        return this.image;
    }

    get LockedDeregistrationPeriod() { //Hours before event start that deregistration is locked
        return this.lockedDeregistrationPeriod;
    }

    get Completed() {
        return (new Date().getTime() > new Date(this.End).getTime());
    }

    public async Register(memberID: string): Promise<boolean> {
        await this.dbPull();

        //User is already registered
        if (this.isRegistered(memberID)) throw new Error("400: You are already registered for this event.");

        //Event is full
        if (this.Full) return false;

        //Event has an invalid end time
        if (this.End === "Invalid Date") throw new Error("500: This event does not have a valid end time. Please contact the event's Rotary officer.");

        //Event has already started
        if (new Date().getTime() > new Date(this.End).getTime()) throw new Error("400: This event has already ended. You may contact the event's Rotary officer to register for this event.");

        this.participants.add(memberID);
        await db.live.setEvent(this.ID, this);
        return true;
    }

    public async Verify(memberID: string): Promise<boolean> {
        await this.dbPull();

        //User isn't registered
        if (!this.isRegistered(memberID)) throw new Error("400: You aren't registered for this event.");

        //User is already verified
        if (this.isVerified(memberID)) throw new Error("400: You are already a verified participant in this event.");

        //Event has an invalid start time
        if (this.Start === "Invalid Date") throw new Error("500: This event does not have a valid start time. Please contact the event's Rotary officer.");

        //Event hasn't already started
        if (new Date().getTime() < new Date(this.Start).getTime()) throw new Error("400: This event hasn't started. You may contact the event's Rotary officer to verify your participation in this event before the start time.");

        this.verifiedParticipants.add(memberID);
        await db.live.setEvent(this.ID, this);
        return true;
    }

    public async Deregister(memberID: string): Promise<boolean> {
        await this.dbPull();

        if (!this.isRegistered(memberID)) throw new Error("400: You are not registered for this event.");

        try {
            const hoursBeforeEvent: number = ((new Date(this.start).getTime() - new Date().getTime()) / 3600000);
            if (hoursBeforeEvent <= this.LockedDeregistrationPeriod) {
                return false;
            }
        }
        catch (err) {
            //Just move on and let the user deregister if the start time was invalid or deregistration period was invalid and thus treated as 0.
        }

        this.participants.delete(memberID);
        this.verifiedParticipants.delete(memberID); // Just in case
        await db.live.setEvent(this.ID, this);
        return true;
    }
}

let RotaryEvents: { [key: string]: RotaryEvent } = {};

export {
    RotaryEvent, RotaryEvents
};