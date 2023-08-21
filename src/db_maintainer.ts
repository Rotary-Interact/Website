"use strict";
import {randStr} from "./utils.js";
import {populateIDs, getMembersAndPasswords, setMemberPassword} from "./db_helper.js";
import {bcrypt} from "bcrypt";

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

async function maintain() {
    await populateIDs(); //Run once for each server startup
    await configureNewUsers();
    setInterval(configureNewUsers, 10000); //Run every 10 seconds
}

export {maintain};