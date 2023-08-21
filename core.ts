'use strict';
import {maintain} from "./src/db_maintainer.js";

await maintain();

import { server } from './src/server.js';

server.listen(8080);