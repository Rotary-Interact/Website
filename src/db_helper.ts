"use strict";
import {google, sheets_v4} from "googleapis";
import {OAuth2Client} from "google-auth-library";
import {RotaryEvent} from "./events.js";
import {Member} from "./members.js";
import {randStr} from "./utils.js";
import {customAlphabet} from 'nanoid'
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');

const serviceAccountKeyFile = "./gc_service_account.json";
const eventSheet = {
    ID: "1dveJGfTjeRw-DvdBjF54dY-9E4gRn3Yx-S8rJWuI4Ds",
    tab: "Main"
};
const memberSheet = {
    ID: "14AYIh5Ja6JQRzzpl7Cx3CLVZiwXwzIeKpV1ZxEuZ1mw",
    tab: "Main"
};
const publicCreditSheet = {
    ID: "1dYri7QS2EEUtu5b7BzDUZDgfnut6Hv_igeS607qVzxM",
    tab: "Credit Spreadsheet 2023-2024"
};

const googleSheetClient: sheets_v4.Sheets = await _getGoogleSheetClient();

async function _getGoogleSheetClient(): Promise<sheets_v4.Sheets> {
    const auth = new google.auth.GoogleAuth({
        keyFile: serviceAccountKeyFile,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const authClient = await auth.getClient();
    return google.sheets({
        version: 'v4',
        auth: authClient,
    });
}

interface cell {
    value: string | number;
    changed: boolean;
}
type eventRow = [cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell];
type memberRow = [cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell];
type publicRow = [cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell, cell];

interface database {
    events: { [key: string]: eventRow },
    members: { [key: string]: memberRow },
    public: { [key: string]: publicRow },
}

let db: database = {
    events: {},
    members: {},
    public: {},
}

async function syncDB(): Promise<void> {
    await syncEventDB().catch((err) => {
        console.error(err);
    });
    await syncMemberDB().catch((err) => {
        console.error(err);
    });
    await syncPublicDB().catch((err) => {
        console.error(err);
    });
}

async function syncEventDB(): Promise<void> {
    await getEventDB();
    await setEventDB();
}

async function syncMemberDB(): Promise<void> {
    await getMemberDB();
    await setMemberDB();
}

async function syncPublicDB(): Promise<void> {
    //await getPublicDB();
    await setPublicDB();
}

async function getEventDB(): Promise<void> {
    const res = await googleSheetClient.spreadsheets.values.get({
        spreadsheetId: eventSheet.ID,
        range: `${eventSheet.tab}!A:T`,
    });

    const rows: eventRow[] = res.data.values.map((row: any[]) => {
        return <eventRow>row.map((value: any) => {
           return {
               value: !isNaN(value) ? Number(value) : String(value),
               changed: false
           }; 
        });
    }).slice(1); // Exclude header row

    for (const row of rows) db.events[row[0].value] = row;
}

async function getMemberDB(): Promise<void> {
    const res = await googleSheetClient.spreadsheets.values.get({
        spreadsheetId: memberSheet.ID,
        range: `${memberSheet.tab}!A:AC`,
    });

    const rows: memberRow[] = res.data.values.map((row: any[]) => {
        return <memberRow>row.map((value: any) => {
           return {
               value: !isNaN(value) ? Number(value) : String(value),
               changed: false
           }; 
        });
    }).slice(1); // Exclude header row

    for (const row of rows) db.members[row[1].value] = row;
}

/*async function getPublicDB(): Promise<void> {
    const res = await googleSheetClient.spreadsheets.values.get({
        spreadsheetId: publicCreditSheet.ID,
        range: `${publicCreditSheet.tab}!A:Z`,
    });

    const rows: publicRow[] = res.data.values.map((row: any[]) => {
        return <publicRow>row.map((value: any) => {
           return {
               value: !isNaN(value) ? Number(value) : String(value),
               changed: false
           }; 
        });
    }).slice(1); // Exclude header row

    for (const row of rows) db.public[row[0].value] = row;
}*/

async function setEventDB(): Promise<void> {
    const IDs: string[] = await getEventIDs(); // In case rows were moved
    
    let updates: (string | number)[][] = [
        [] //Header row
    ];
    
    for (const i in IDs) {
        const id = IDs[i];
        if (db.events[id] === undefined) continue;
        let values: (string | number)[] = db.events[id].map((value: cell) => {
            return value.changed ? value.value : null;
        });
        updates.push(values);
    }

    await googleSheetClient.spreadsheets.values.update({
        spreadsheetId: eventSheet.ID,
        range: `${eventSheet.tab}!A:T`,
        valueInputOption: 'USER_ENTERED',
        includeValuesInResponse: false,
    }, {
        body: JSON.stringify({
            values: updates
        })
    });
}

async function setMemberDB(): Promise<void> {
    const IDs: string[] = await getMemberIDs(); // In case rows were moved
    
    let updates: (string | number)[][] = [
        [] //Header row
    ];
    
    for (const i in IDs) {
        const id = IDs[i];
        if (db.members[id] === undefined) continue;
        let values: (string | number)[] = db.members[id].map((value: cell) => {
            return value.changed ? value.value : null;
        });
        updates.push(values);
    }

    await googleSheetClient.spreadsheets.values.update({
        spreadsheetId: memberSheet.ID,
        range: `${memberSheet.tab}!A:AC`,
        valueInputOption: 'USER_ENTERED',
        includeValuesInResponse: false,
    }, {
        body: JSON.stringify({
            values: updates
        })
    });
}

async function setPublicDB(): Promise<void> {
    const IDs: string[] = await getMemberIDs(); // In case rows were moved
    
    let updates: (string | number)[][] = [
        [], [], [], [], [], [], [], [], [], [], [] // Header rows
    ];
    
    for (const i in IDs) {
        const id = IDs[i];
        if (db.public[id] === undefined) continue;
        let values: (string | number)[] = db.public[id].map((value: cell) => {
            return value.changed ? value.value : null;
        });
        updates.push(values);
    }

    await googleSheetClient.spreadsheets.values.update({
        spreadsheetId: publicCreditSheet.ID,
        range: `${publicCreditSheet.tab}!A:Z`,
        valueInputOption: 'USER_ENTERED',
        includeValuesInResponse: false,
    }, {
        body: JSON.stringify({
            values: updates
        })
    });
}

async function getEvent(id: string): Promise<(string | number)[]> {
    const row: (string | number)[] = db.events[id].map((cell: cell) => cell.value);

    if (!row) {
        throw new Error(`404: Event with ID ${id} not found`);
    }

    return row;
}

const getEvents = async (): Promise<(string | number)[][]> => Object.values(db.events).map((row: eventRow): (string | number)[] => row.map((cell: cell): string | number => cell.value));

async function getEventIDs(): Promise<string[]> {
    const res = await googleSheetClient.spreadsheets.values.get({
        spreadsheetId: eventSheet.ID,
        range: `${eventSheet.tab}!A:A`,
    });

    return res.data.values.map((value: any[]) => value[0]).slice(1); // Exclude header row
}

async function getMember(id: string): Promise<(string | number)[]> {
    const row: (string | number)[] = db.members[id].map((cell: cell) => cell.value);

    if (!row) {
        throw new Error(`404: Member with ID ${id} not found`);
    }

    return row;
}

const getMembers = async (): Promise<(string | number)[][]> => Object.values(db.members).map((row: memberRow): (string | number)[] => row.map((cell: cell): string | number => cell.value));

async function getMemberIDs(): Promise<string[]> {
    const res = await googleSheetClient.spreadsheets.values.get({
        spreadsheetId: memberSheet.ID,
        range: `${memberSheet.tab}!B:B`,
    });

    return res.data.values.map((value: any[]) => value[0]).slice(1); // Exclude header row
}

async function getMemberIDsByEmail(email: string): Promise<string[]> {
    const IDs: string[] = Object.values(db.members).map((row: memberRow) => {
        if (row[5].value === email) {
            return String(row[1].value);
        }
    });

    return IDs;
}

async function setEvent(id: string, values: (string | number)[]): Promise<void> {
    const row: eventRow = db.events[id];
    if (values.length !== row.length) throw new Error("500: Length of data write does not equal length of row.");
    if (!row) {
        throw new Error(`404: Event with ID ${id} not found`);
    }
    for (const i in row) {
        if (row[i].value !== values[i]) {
            row[i].changed = true;
            row[i].value = values[i];
        }
    }
}

async function setMember(id: string, values: (string | number)[]): Promise<void> {
    const row: memberRow = db.members[id];
    if (values.length !== row.length) throw new Error("500: Length of data write does not equal length of row.");
    if (!row) {
        throw new Error(`404: Member with ID ${id} not found`);
    }
    for (const i in values) {
        if (values[i] !== row[i].value) {
            row[i].changed = true;
            row[i].value = values[i];
        }
    }
}

async function updatePublicRecord(id: string, values: (string | number)[]): Promise<void> {
    /*const res = await googleSheetClient.spreadsheets.values.get({
        spreadsheetId: publicCreditSheet.ID,
        range: `${publicCreditSheet.tab}!A:A`,
    });

    const rowIndex = res.data.values.findIndex(row => row[0] === id);
    if (rowIndex !== -1) {
        await googleSheetClient.spreadsheets.values.update({
            spreadsheetId: publicCreditSheet.ID,
            range: `${publicCreditSheet.tab}!A${rowIndex + 1}:Z${rowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            includeValuesInResponse: false,
        }, {
            body: JSON.stringify({
                values: [values]
            })
        });
    } else {
        await googleSheetClient.spreadsheets.values.append({
            spreadsheetId: publicCreditSheet.ID,
            range: publicCreditSheet.tab,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
        }, {
            body: JSON.stringify({
                "majorDimension": "ROWS",
                values: [values],
            }),
        });
    }*/
    if (values.length !== 26) throw new Error("500: Length of data write does not equal length of row.");
    if (!db.public[id]) {
        for (let i = 0; i < 26; i++) {
            db.public[id].push({
                changed: true,
                value: values[i]
            });
        }
        return;
    }
    const row: publicRow = db.public[id];
    for (const i in values) {
        if (values[i] !== row[i].value) {
            row[i].changed = true;
            row[i].value = values[i];
        }
    }
}

async function getMembersAndPasswords(): Promise<[string, string][]> { // For db_maintainer.ts
    return Object.values(db.members).map((row: memberRow): [string, string] => {
        return [String(row.values[1]), String(row.values[2])];
    }).slice(1); // Exclude header row
}

async function setMemberPassword(id: string, passwordHash: string): Promise<void> { // For db_maintainer.ts
    console.log(db.members);
    console.log(db.members[id]);
    db.members[id][2] = {
        value: passwordHash,
        changed: true
    };
}

async function populateIDs() {
    // For members
    const memberRes = await googleSheetClient.spreadsheets.values.get({
        spreadsheetId: memberSheet.ID,
        range: `${memberSheet.tab}!B:B`,
    });
    
    const memberIDs: Set<string> = new Set();
    for (let i = 1; i < memberRes.data.values.length; i++) { // Skip header row
        const row = memberRes.data.values[i];
        if (typeof row[0] === "string" && row[0].length === 5) continue;
        let id;
        do {
            id = nanoid(5);
        } while (memberIDs.has(id)); // ID must be unique
        memberIDs.add(id);
    }

    await googleSheetClient.spreadsheets.values.update({
        spreadsheetId: memberSheet.ID,
        range: `${memberSheet.tab}!B:B`,
        valueInputOption: 'USER_ENTERED',
        includeValuesInResponse: false,
    }, {
        body: JSON.stringify({
            values: [
                [], // Header row
                [...memberIDs].map((id: string) => [id])
            ],
        })
    });

    // For events
    const eventRes = await googleSheetClient.spreadsheets.values.get({
        spreadsheetId: eventSheet.ID,
        range: `${eventSheet.tab}!A:A`,
    });
    
    const eventIDs = new Set();
    for (let i = 1; i < eventRes.data.values.length; i++) { // Skip header row
        const row = eventRes.data.values[i];
        if (typeof row[0] === "string" && row[0].length === 7) continue;
        let id;
        do {
            id = nanoid(7);
        } while (eventIDs.has(id)); // ID must be unique
        eventIDs.add(id);
    }
    
    await googleSheetClient.spreadsheets.values.update({
        spreadsheetId: eventSheet.ID,
        range: `${eventSheet.tab}!A:A`,
        valueInputOption: 'USER_ENTERED',
        includeValuesInResponse: false,
    }, {
        body: JSON.stringify({
            values: [
                [], // Header row
                [...eventIDs].map((id: string) => [id])
            ],
        })
    });
}

syncDB();
setInterval(syncDB, 60000);

export {
    syncDB,
    getEvents, getEvent, setEvent,
    getEventIDs,
    getMembers, getMember, setMember,
    getMemberIDs,
    getMemberIDsByEmail,
    updatePublicRecord,
    populateIDs,
    getMembersAndPasswords, setMemberPassword //For db_maintainer.ts
}