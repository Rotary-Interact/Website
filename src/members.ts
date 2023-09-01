"use strict";
import { isNumeric, isInteger } from "./utils.js";
import {RotaryEvent, RotaryEvents} from "./events.js";
import {
    Name,
    Grade,
    Coordinates,
    Location,
    Credits,
    OrganizedCredits,
    OrganizedCreditMonth,
    SchoolMonth
} from "./definitions.js"
import * as db from "./database.js";
import {ErrInfo, parseError} from "./errors";
import {isFloat} from "validator";
import nanoid from "nanoid";
import {bcrypt} from "bcrypt";

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

    static async toMemory(id: string): Promise<Member> {
        //Creates replica in memory of entity in DB
        if (Members[id] !== null) return Members[id]; //throw new Error("409: A member with this ID already exists.");
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
            
            const organizedCredits: { [key: string]: OrganizedCreditMonth } = {};
            const months: string[] = ["September", "October", "November", "December", "January", "February", "March", "April", "May", "June"];
            for (const month of months) {
                const meetingCredits: string = info[`${month} Meeting`];
                const eventCredits: string = info[`${month} Events`];
                if (!isFloat(meetingCredits)) {
                    throw new Error(`500: Invalid ${month} meeting credit amount (not a number). This may be caused by an incorrect manual entry of credits by a Rotary Officer. Contact a Rotary Officer for assistance.`);
                }
                if (!isFloat(eventCredits)) {
                    throw new Error(`500: Invalid ${month} events credit amount (not a number). This may be caused by an incorrect manual entry of credits by a Rotary Officer. Contact a Rotary Officer for assistance.`);
                }
                organizedCredits[month] = {
                    meeting: (parseFloat(meetingCredits) === 0.5),
                    events: parseFloat(eventCredits),
                }
            }
            this.credits = {
                "OYO": parseFloat(info["All Year OYO"]),
                "Organized": <OrganizedCredits>organizedCredits
            }
        }
        catch (err) {
            const info: ErrInfo = parseError(err.message);
            if (info.error === 404) {
                delete Members[this.ID];
            }
            throw err;
        }
    }

    get Age() { //Seconds since dbPuller called
        if (!this.syncTime) return 0;
        return (new Date().getTime() - this.syncTime) / 1000;
    }

    get ID() {
        return this.id;
    }

    get Password() { //ONLY ONE USAGE: _setMemberDB in database.ts
        return this.passwordHash;
    }

    public async comparePassword(password: string): Promise<boolean> {
        return await bcrypt.compare(password, this.passwordHash);
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
        let total: number = this.credits["OYO"];
        for (const [month, credits] of Object.entries(this.credits["Organized"])) {
            total += (credits.meeting ? 0.5 : 0) + credits.events;
        }
        return total;
    }

    get TotalEventCredits() {
        let total: number = 0;
        for (const [month, credits] of Object.entries(this.credits["Organized"])) {
            total += credits.events;
        }
        return total;
    }

    get TotalMeetingCredits() {
        let total: number = 0;
        for (const [month, credits] of Object.entries(this.credits["Organized"])) {
            total += (credits.meeting ? 0.5 : 0);
        }
        return total;
    }

    get OYOCredits() {
        return this.credits["OYO"];
    }

    public EventCredits(month: SchoolMonth): number {
        return this.credits["Organized"][month].events;
    }

    public MeetingCredits(month: SchoolMonth): 0.5 | 0 {
        return (this.credits["Organized"][month].meeting ? 0.5 : 0);
    }

    public startSession(): string {
        const token: string = nanoid.nanoid(64);
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
}

let Members: { [key: string]: Member } = {};

export {
    Member, Members
};