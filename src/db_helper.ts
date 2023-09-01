"use strict";
import {google, sheets_v4} from "googleapis";
import {OAuth2Client} from "google-auth-library";
import {RotaryEvent} from "./events.js";
import {Member} from "./members.js";
import {randStr} from "./utils.js";

const serviceAccountKeyFile = "../gc_service_account.json";
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

async function getEvent(id: string): Promise<any[]> {
    const res = await googleSheetClient.spreadsheets.values.get({
        spreadsheetId: eventSheet.ID,
        range: `${eventSheet.tab}!A:A`,
    });

    const row: any[] = res.data.values.find(row => row[0] === id);

    if (!row) {
        throw new Error(`404: Event with ID ${id} not found`);
    }

    return row;
}

async function getEvents(): Promise<string[]> {
    const res = await googleSheetClient.spreadsheets.values.get({
        spreadsheetId: eventSheet.ID,
        range: eventSheet.tab,
    });

    return res.data.values.map((value: any[]) => {
        return value[0];
    }).splice(0, 1);
}

async function setEvent(id: string, values: string[]): Promise<void> {
    const res = await googleSheetClient.spreadsheets.values.get({
        spreadsheetId: eventSheet.ID,
        range: eventSheet.tab,
    });

    const rowIndex = res.data.values.findIndex(row => row[0] === id);
    if (rowIndex !== -1) {
        await googleSheetClient.spreadsheets.values.update({
            spreadsheetId: eventSheet.ID,
            range: `${eventSheet.tab}!A${rowIndex + 1}:Z${rowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            includeValuesInResponse: false,
        }, {
            body: {
                values: values,
            }
        });
    } else {
        throw new Error(`404: Event with ID ${id} not found`);
    }
}

async function getMember(id: string): Promise<any[]> {
    const res = await googleSheetClient.spreadsheets.values.get({
        spreadsheetId: memberSheet.ID,
        range: memberSheet.tab,
    });

    const row: any[] = res.data.values.find(row => row[1] === id);

    if (!row) {
        throw new Error(`404: Member with ID ${id} not found`);
    }

    return row;
}

async function getMembers(): Promise<string[]> {
    const res = await googleSheetClient.spreadsheets.values.get({
        spreadsheetId: memberSheet.ID,
        range: memberSheet.tab,
    });

    return res.data.values.map((value: any[]) => {
        return value[1];
    }).splice(0, 1);
}

async function getMemberIDsByEmail(email: string): Promise<string[]> {
    const res = await googleSheetClient.spreadsheets.values.get({
        spreadsheetId: memberSheet.ID,
        range: memberSheet.tab,
    });

    const row: any[] = res.data.values.find(row => row[5] === email);

    return res.data.values.map((value: any[]) => {
        return value[1];
    });
}

async function setMember(id: string, values: string[]): Promise<void> {
    const res = await googleSheetClient.spreadsheets.values.get({
        spreadsheetId: memberSheet.ID,
        range: `${memberSheet.tab}!B:B`,
    });

    const rowIndex = res.data.values.findIndex(row => row[0] === id);
    if (rowIndex !== -1) {
        await googleSheetClient.spreadsheets.values.update({
            spreadsheetId: memberSheet.ID,
            range: `${memberSheet.tab}!A${rowIndex + 1}:AC${rowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            includeValuesInResponse: false,
        }, {
            body: {
                values: values,
            }
        });
    } else {
        throw new Error(`404: Member with ID ${id} not found`);
    }
}

async function updatePublicRecord(id: string, values: string[]): Promise<void> {
    const res = await googleSheetClient.spreadsheets.values.get({
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
            body: {
                values: values,
            }
        });
    } else {
        await googleSheetClient.spreadsheets.values.append({
            spreadsheetId: publicCreditSheet.ID,
            range: publicCreditSheet.tab,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
        }, {
            body: {
                "majorDimension": "ROWS",
                values: values,
            },
        });
    }
}

async function getMembersAndPasswords(): Promise<[string, string][]> { //For db_maintainer.ts
    const res = await googleSheetClient.spreadsheets.values.get({
        spreadsheetId: memberSheet.ID,
        range: memberSheet.tab,
    });

    return res.data.values.map((value: any[]): [string, string] => {
        return [String(value[1]), String(value[2])];
    }).splice(0, 1);
}

async function setMemberPassword(id: string, passwordHash: string): Promise<void> { //For db_maintainer.ts
    const res = await googleSheetClient.spreadsheets.values.get({
        spreadsheetId: memberSheet.ID,
        range: `${memberSheet.tab}!B:B`,
    });

    const rowIndex = res.data.values.findIndex(row => row[0] === id);
    if (rowIndex !== -1) {
        await googleSheetClient.spreadsheets.values.update({
            spreadsheetId: memberSheet.ID,
            range: `${memberSheet.tab}!B${rowIndex + 1}:C${rowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            includeValuesInResponse: false,
        }, {
            body: {
                values: [id, passwordHash],
            }
        });
    } else {
        throw new Error(`404: Member with ID ${id} not found`);
    }
}

async function populateIDs() {
    // For members
    const memberRes = await googleSheetClient.spreadsheets.values.get({
        spreadsheetId: memberSheet.ID,
        range: memberSheet.tab,
    });
    const memberIDs: Set<string> = new Set();
    for (const row of memberRes.data.values) {
        if (typeof row[1] === "string" && row[1].length === 7) continue;
        let id;
        do {
            id = randStr(7);
        } while (memberIDs.has(id)); // ID must be unique
        memberIDs.add(id);
        row[1] = id;
        await setMember(id, row);
    }

    // For events
    const eventRes = await googleSheetClient.spreadsheets.values.get({
        spreadsheetId: eventSheet.ID,
        range: eventSheet.tab,
    });
    const eventIDs = new Set();
    for (const row of eventRes.data.values) {
        if (typeof row[0] === "string" && row[0].length === 7) continue;
        let id;
        do {
            id = randStr(5);
        } while (eventIDs.has(id)); // ID must be unique
        eventIDs.add(id);
        row[0] = id;
        await setEvent(id, row);
    }
}

export {
    getEvents, getEvent, setEvent,
    getMembers, getMember, setMember,
    getMemberIDsByEmail,
    updatePublicRecord,
    populateIDs,
    getMembersAndPasswords, setMemberPassword //For db_maintainer.ts
}