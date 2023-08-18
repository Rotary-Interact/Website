"use strict";
import {randStr} from "./utils.js";
import {populateIDs} from "./db_helper.js";
import {bcrypt} from "bcrypt";

async function configureNewUsers() {

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

await populateIDs(); //Run for each server startup