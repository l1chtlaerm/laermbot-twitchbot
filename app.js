require("dotenv").config();

const express = require("express");
const app = express();
const favicon = require("serve-favicon");
const path = require("path");
const tmi = require("tmi.js");

const port = process.env.PORT || 3000;

// Setup connection configurations
// These include the channel, username and password
const client = new tmi.Client({
    options: { debug: true, messagesLogLevel: "info" },
    connection: {
        reconnect: true,
        secure: true,
    },
    identity: {
        username: `${process.env.TWITCH_USERNAME}`,
        password: `oauth:${process.env.TWITCH_OAUTH}`,
    },
    // Lack of the identity tags makes the bot anonymous and able to fetch messages from the channel
    // for reading, supervision, spying, or viewing purposes only
    channels: [`${process.env.TWITCH_CHANNEL}`],
});

// Connect to the channel specified using the setings found in the configurations
// Any error found shall be logged out in the console
client.connect().catch(console.error);

// When the bot is on, it shall fetch the messages send by user from the specified channel
client.on("message", (channel, tags, message, self) => {
    // Lack of this statement or it's inverse (!self) will make it in active
    if (self) return;

    // Create up a switch statement with some possible commands and their outputs
    // The input shall be converted to lowercase form first
    // The outputs shall be in the chats

    switch (message.toLowerCase()) {
        // Use 'tags' to obtain the username of the one who has keyed in a certain input
        // 'channel' shall be used to specify the channel name in which the message is going to be displayed
        //For one to send a message in a channel, you specify the channel name, then the message
        // We shall use backticks when using tags to support template interpolation in JavaScript

        // In case the message in lowercase is equal to the string 'commands', send the sender of that message some of the common commands

        case "!commands":
            client.say(
                channel,
                `Available commands are:
            !95acc !unfortunatenature
            `
            );
            break;

        // In case the message in lowercase is equal to the string '!website', send the sender of that message your personal website
        case "!95acc":
            client.say(channel, `BAD`);
            break;
        case "!unfortunatenature":
            client.say(
                channel,
                `IronMonners have been memed by unfortunate natures COMING SOON™ times.`
            );
            break;
    }
});
