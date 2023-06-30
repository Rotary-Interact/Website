'use strict';
import { captchaCheck } from "./captcha.js";
import { server } from "./server.js";
import { Server } from 'socket.io';

const io = new Server(server, {
  cors: {
    //origin: [''],
    methods: ["GET", "POST"]
  }
});

io.on("connection", function(Socket) {
  Socket.on("signup", (eventID: unknown): boolean => {
    try {
      
    }
    catch (err) {
      return Socket.emit("error", "500: Internal Server Error");
    }
  });

  Socket.on("disconnect", async (): Promise<void> => {
    try {
      
    }
    catch (err) {

    }
  });
});

export { server };