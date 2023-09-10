"use strict";
import { isNumeric, isInteger } from "./utils.js";
import {RotaryEvent, RotaryEvents} from "./events.js";
import {
    Name,
    Grade,
    Coordinates,
    Location,
    Credits,
    CreditMonth,
    SchoolMonth
} from "./definitions.js"
import * as db from "./database.js";
import {ErrInfo, parseError} from "./errors.js";
import { nanoid } from "nanoid";
import * as bcrypt from "bcrypt";

class Member {
    private readonly id: string;
    private syncTime: number;
    private passwordHash: string; //Encrypted password
    private name: Name;
    private email: string;
    private phone: string;
    private grade: Grade;
    private sessionTokens: string[];
    private credits: Credits;
    private created: string;

    static async toMemory(id: string): Promise<Member> { // Creates in-memory replica of entity in DB
        if (!!Members[id]) return Members[id]; //throw new Error("409: A member with this ID already exists.");
        const member: Member = new Member(id);
        await member.dbPull(true); //Will return 404 if necessary from db.live.getMember and delete self (class instance)
        Members[member.ID] = member;
        return member;
    }

    private constructor(id: string) {
        this.id = id;
        this.sessionTokens = [];
    }

    public dbPull(force: boolean = false) {
        if (force || this.Age >= 300) {
            return this.dbPuller();
        }
    }

    private async dbPuller() {
        this.syncTime = new Date().getTime();
        try {
            const info: { [key: string]: string } = await db.live.getMember(this.id);
            this.created = info["Timestamp"];
            this.name = {
                first: info["First Name"],
                last: info["Last Name"],
            };
            
            this.email = info["Email Address"];
            this.passwordHash = info["Account Password"];
            this.phone = info["Phone Number"];
            
            if (isInteger(info["Grade"])) {
                const grade: number = parseInt(info["Grade"]);
                if ([9, 10, 11, 12].indexOf(grade) !== -1) {
                    this.grade = <Grade>grade;
                } else {
                    this.grade = 9;
                }
            } else {
                this.grade = 9;
            }
            
            const credits: { [key: string]: CreditMonth } = {};
            const months: string[] = ["September", "October", "November", "December", "January", "February", "March", "April", "May", "June"];
            for (const month of months) {
                const meetingCredits: string = info[`${month} Meeting`];
                const eventCredits: string = info[`${month} Events`];
                if (!isNumeric(meetingCredits) && meetingCredits !== "") {
                    throw new Error(`500: Invalid ${month} meeting credit amount (not a number). This may be caused by an incorrect manual entry of credits by a Rotary Officer. Contact a Rotary Officer for assistance.`);
                }
                if (!isNumeric(eventCredits) && eventCredits !== "") {
                    throw new Error(`500: Invalid ${month} events credit amount (not a number). This may be caused by an incorrect manual entry of credits by a Rotary Officer. Contact a Rotary Officer for assistance.`);
                }
                credits[month] = {
                    meeting: meetingCredits !== "" ? (parseFloat(meetingCredits) === 0.5) : false,
                    events: eventCredits !== "" ? parseFloat(eventCredits) : 0,
                }
            }
            this.credits = <Credits>credits;
        }
        catch (err) {
            const info: ErrInfo = parseError(err.message);
            if (info.error === 404) {
                delete Members[this.ID];
            }
            throw err;
        }
    }

    get Created() {
        return this.created;
    }

    get Age() { // Seconds since dbPull called
        if (!isInteger(this.syncTime)) return 0;
        return (new Date().getTime() - this.syncTime) / 1000;
    }

    get ID() {
        return this.id;
    }

    get Password() { //ONLY ONE USAGE: _setMemberDB in database.ts
        return this.passwordHash;
    }

    public async comparePassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.passwordHash);
    }

    get Name() {
        return `${this.name.first} ${this.name.last}`;
    }

    get FirstName() {
        return this.name.first;
    }

    get LastName() {
        return this.name.last;
    }

    get Email() {
        return this.email;
    }

    get Phone() {
        return this.phone;
    }

    get Grade() {
        return this.grade;
    }

    get TotalCredits() {
        let total: number = 0;
        for (const [month, credits] of Object.entries(this.credits)) {
            total += (credits.meeting ? 0.5 : 0) + credits.events;
        }
        return total;
    }

    get TotalEventCredits() {
        let total: number = 0;
        for (const [month, credits] of Object.entries(this.credits)) {
            total += credits.events;
        }
        return total;
    }

    get TotalMeetingCredits() {
        let total: number = 0;
        for (const [month, credits] of Object.entries(this.credits)) {
            total += (credits.meeting ? 0.5 : 0);
        }
        return total;
    }

    public EventCredits(month: SchoolMonth): number {
        return this.credits[month].events;
    }

    public MeetingCredits(month: SchoolMonth): 0.5 | 0 {
        return (this.credits[month].meeting ? 0.5 : 0);
    }

    public startSession(): string {
        const token: string = nanoid(64);
        this.sessionTokens.push(token);
        return token;
    }

    public getEvents(): Promise<{ [key: string]: RotaryEvent }> {
        return db.getEventsByMember(this.ID);
    }

    public validateSession(token: unknown): void {
        if (typeof token !== "string") throw new Error("401: Invalid session token");
        if (!this.isValidSession(token)) throw new Error("401: Invalid login")
    }

    private isValidSession(token: string): boolean {
        return this.sessionTokens.indexOf(token) !== -1;
    }

    public endSession(token: string) {
        if (this.isValidSession(token)) {
            this.sessionTokens.splice(this.sessionTokens.indexOf(token), 1);
        }
        if (this.sessionTokens.length === 0) {
            delete Members[this.id];
        }
    }

    get Credits() {
        return this.credits;
    }

    set Credits(credits: Credits) { //Updates credits IN MEMORY ONLY (not in DB)
        this.credits = credits;
    }

    public async syncCredits() { //Pushes credits to DB
        const credits: Credits = JSON.parse(JSON.stringify(this.Credits)); //Hold onto in-memory credits
        await this.dbPull(); //Pull any updates from DB (overwriting in-memory credits as a side effect).
        for (const month of Object.keys(credits)) { //Restore event credits, but leave any manual changes to meeting credits alone
            this.Credits[month].events = credits[month].events;
        }
        return db.live.setMember(this.ID, this);
    }
}

let Members: { [key: string]: Member } = {};

export {
    Member, Members
};