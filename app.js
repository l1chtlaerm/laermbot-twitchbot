import dotenv from 'dotenv';

import open from 'open';

import express from "express";
import fetch from 'node-fetch';

import tmi from "tmi.js";

import { google } from 'googleapis';
import cron from 'node-cron';

dotenv.config();
const app = express();

function toTitleCase(str) {
    if (!str) {
        return ""
    }

    return str.toLowerCase().split(' ').map(function (word) {
        return word.charAt(0).toUpperCase().concat(word.substr(1));
    }).join(' ');
}

const googleClient = new google.auth.OAuth2(
    `${process.env.GOOGLE_CLIENT_ID}`,
    `${process.env.GOOGLE_CLIENT_SECRET}`,
    `${process.env.GOOGLE_REDIRECT_URI}`
);

const scopes = ['https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/spreadsheets.readonly'];

// Generate the url that will be used for authorization
let authorizeUrl = googleClient.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
});

app.get('/oauth2callback', (req, res) => {
    const code = req.query.code;
    googleClient.getToken(code, (err, tokens) => {
        if (err) {
            console.error('Error getting oAuth tokens:');
            throw err;
        }
        googleClient.credentials = tokens;
        res.send('Authentication successful! Please return to the console.');
    });
});

const server = app.listen(3000, () => {
    // open the browser to the authorize url to start the workflow
    open(authorizeUrl, { wait: false });
});


const twitchClient = new tmi.Client({
    options: { debug: true, messagesLogLevel: "info" },
    connection: {
        reconnect: true,
        secure: true,
    },
    identity: {
        username: `${process.env.TWITCH_USERNAME}`,
        password: `oauth:${process.env.TWITCH_OAUTH}`,
    },
    channels: [`${process.env.TWITCH_CHANNEL}`],
});

twitchClient.connect().catch(console.error);


// twitchClient.on("logon", async () => {
async function fetchEmotes() {
    const response = await fetch("https://7tv.io/v3/emote-sets/645ae0880f27759150e66c22");
    const emotes = await response.json();
    return emotes.emotes;
}

let emotes = await fetchEmotes();

function randomEmote(emotes) {
    let randomNumber = Math.floor(Math.random() * emotes.length);
    const randomElement = emotes[randomNumber].name;
    return randomElement;
}

async function emoteResponse() {
    let randomEmoteMsg = [];
    for (let i = 0; i <= 2; i++) {
        randomEmoteMsg.push(await randomEmote(emotes))
    }
    return randomEmoteMsg.join(" ");
}

let cronJob = cron.schedule('2,10,20,32,40,50 * * * *', async () => {
    twitchClient.say("lichtlaerm", await emoteResponse());
});
cronJob.start();
// })

let cronJob2 = cron.schedule('0,30 * * * *', async () => {
    twitchClient.say("lichtlaerm", "Streams are predominantly in English, but Spanish is also welcome. / Los streams son predominantemente en Inglés, pero el Español también es bienvenido :)");
});

cronJob2.start();

 twitchClient.on("disconnected", async () => {
    cronJob && cronJob.stop();
    cronJob2 && cronJob2.stop();
}) 

twitchClient.on("message", async (channel, tags, message, self) => {

    if (self || !message.startsWith('!')) return;

    const args = message.slice(1).split(' ');
    const command = args.shift().toLowerCase();

    const textCommands = [{
        name: "95acc", response: "BAD"
    }, {
        name: "unfortunatenature", response: "IronMonners have been memed by unfortunate natures COMING SOON™ times."
    }, {
        name: "godnido", response: "How can a God Nidoking fully set up busting an Aeroblast can lose against a measly Pinsir on Koga? Find out more in the link https://www.twitch.tv/videos/1825226590"
    }, {
        name: "schlurp", response: "https://www.youtube.com/watch?v=whP0fLU4Htc"
    }, {
        name: "schlurp2", response: "Kreygasm https://clips.twitch.tv/RepleteApatheticSrirachaPipeHype-kDTY75GonwsDX00h Kreygasm"
    }, {
        name: "tmhgss", response: "Johto: 51, 89, 45, 30, 01, 23, 07, 59; Kanto: 80, 03, 34, 19, 84, 48, 50, 92"
    }, {
        name: "verycool", response: "https://clips.twitch.tv/FilthyOriginalPotCmonBruh-DACoTlKj1aQMiy3c"
    }, {
        name: "commands", response: ``
    }, {
        name: "ironmonvideo", response: `A three min video on Kaizo IronMon: https://www.youtube.com/watch?v=BhRenpUk7lc`
    }, {
        name: "ironmon", response: `Challenge Info: https://bit.ly/3V4jVz4 Category: Kaizo. tl;dr: IronMon Kaizo is Hardcore Roguelike Pokemon for Masochists`
    }, {
        name: "instagg", response: `NO GUARD IS GREAT BRO https://www.twitch.tv/lichtlaerm/clip/RoundFunCarabeefTebowing-_pXRZzqcSLs2Vx3_`
    }, {
        name: "fakepb", response: `https://www.twitch.tv/lichtlaerm/clip/SpotlessModernChinchillaVoHiYo-bTvxLNpsJq4yzAA_`
    }, {
        name: "birthday", response: `https://www.twitch.tv/videos/1813249409`
    }, {
        name: "ads", response: `Running three minutes of ads for each hour streamed allows me to remove pre-roll ads for people that are just entering the stream. You won't miss anything since I'm taking a break! / Reproducir tres minutos de publicidad por cada hora de stream me permite evitar que los usuarios vean publicidad al ingresar al canal. No se perderán de nada porque me tomo un descanso en ese tiempo!`
    }, {
        name: "tts", response: `TTS Monster lets you use custom TTS voices from a lot of cool characters. Check the short usage guide in my panels or go to https://tts.monster/lichtlaerm [TTS is on for all bits and tips]`
    }, {
        name: "lurk", response: `/me get comfy ${tags["display-name"]}, we love all lurkers and non lurkers equally catLurk`
    }, {
        name: "duskdaddy", response: `Dusknoir died to a Bite highroll from a Shiftry on Lance. If this seems like a regular death, look at my heals and then use arceus instead. https://clips.twitch.tv/HilariousBoredCakeGingerPower-GkJIJaTspoFG1jM5`
    }, {
        name: "arceus", response: `https://clips.twitch.tv/SmellyObedientCormorantItsBoshyTime-JOFWTRNz67TkCop5`
    }, {
        name: "godkarp1", response: `Worst day of our life? https://www.twitch.tv/videos/1845543757`
    }, {
        name: "godkarp2", response: `I THINK NOT https://www.twitch.tv/videos/1845543758`
    }, {
        name: "guacamelee", response: `GUACAMELEE died to yet another Octazooka meme on the E4. https://clips.twitch.tv/ApatheticJazzyPangolinTBTacoLeft-OTTx45YxBtkq2cw2`
    }, {
        name: "amity", response: `Psyduck, Pachirisu, Drifloon, Buneary, Happiny, Clefairy, Pikachu, Jigglypuff, Torchic, Shroomish, Skitty, Gen 4 starters/evos`
    }, {
        name: "pbplat", response: `Queendra died to Byron's lead Kricketune with Speed Boost, Substitute, Transform and zero heals. https://clips.twitch.tv/KnottySilkyOryxChefFrank-zeLklhu9rYmpprqR`
    }, {
        name: "albumslist", response: `Link here https://shorturl.at/bnowR`
    }, {
        name: "pb", response: `Skuntank died to a fast and very strong Dragonite that never showed any physical moves https://clips.twitch.tv/EvilHealthyMonkeyHumbleLife-lMyKuR_6arPIBe8M`
    }
        , {
        name: "carmilla", response: `Crobat died to 4 confusion hits, sleep, and my own lab starter on a rando in Kanto :) https://clips.twitch.tv/VictoriousHonestSnailLitty-t90r9cxDbGTo2QRY`
    }, {
        name: "clonehero", response: `Get songs from here: https://chorus.fightthe.pw/ | I haven't played in like 10 years, please be nice LUL`
    }
    ]

    let commandList = [];
    commandList = textCommands.map((command) => { return command.name })

    textCommands.find((element) => element.name === "commands").response = `Available commands are: ${commandList.map(i => '!' + i).join(', ')}, !randomalbum [unique], !followage`;


    if (command.toLowerCase() === "randomalbum") {
        let returnString = "";
        const sheets = google.sheets('v4');
        sheets.spreadsheets.values.get(
            {
                auth: googleClient,
                spreadsheetId: `${process.env.ALBUMS_SPREADSHEET_ID}`,
                range: 'Actual List!A2:H',
            },
            (err, res) => {
                if (err) {
                    console.log(err);
                    twitchClient.say(channel, "The API returned an error. Check logs.");
                }
                const rows = res.data.values;
                if (rows.length === 0) {
                    twitchClient.say(channel, "No data found.");
                } else
                    if (args[0] && args[0].toLowerCase() === "unique") {
                        const filteredRows = rows.filter((album) => album[7] === undefined)
                        let randomNumber = Math.floor(Math.random() * filteredRows.length);
                        const randomElement = filteredRows[randomNumber];
                        returnString = `${tags["display-name"]}, your album is: ${toTitleCase(randomElement[0])} - ${toTitleCase(randomElement[1])} [${randomElement.slice(2, 4).join(", ")}] - ${randomNumber}`;
                        twitchClient.say(channel, returnString);
                    } else {
                        let randomNumber = Math.floor(Math.random() * rows.length);
                        const randomElement = rows[randomNumber];
                        let shown = randomElement[7] ? "Already shown on stream" : "Not shown on stream"
                        returnString = `${tags["display-name"]}, your album is: ${toTitleCase(randomElement[0])} - ${toTitleCase(randomElement[1])} [${randomElement.slice(2, 4).join(", ")}, ${shown}] - ${randomNumber}`;
                        twitchClient.say(channel, returnString);
                    }
            }
        );
    }

    if (command.toLowerCase() === "jigglin") {
        console.log(tags);
        if (tags["vip"] || (tags["badges"] && Object.keys(tags["badges"]).find((key) => key === "broadcaster"))) {
            twitchClient.say(channel, "Jigglin")
            twitchClient.say(channel, "Jigglin Jigglin")
            twitchClient.say(channel, "Jigglin Jigglin Jigglin")
            twitchClient.say(channel, "Jigglin Jigglin Jigglin Jigglin")
            twitchClient.say(channel, "Jigglin Jigglin Jigglin")
            twitchClient.say(channel, "Jigglin Jigglin")
            twitchClient.say(channel, "Jigglin")
        } else {
            twitchClient.say(channel, "You are not worthy.")
        }
    }

    if (command.toLowerCase() === "followage") {
        async function fetchFollowage() {
            const response = await fetch(`https://decapi.me/twitch/followage/lichtlaerm/${tags["username"]}?token=${process.env.DECAPI_API_KEY}`);
            const text = await response.text();
            return text;
        }

        let dateTime = await fetchFollowage();

        twitchClient.say(channel, `${tags["display-name"]} has been following the channel for ${dateTime}.`)
    }

    if (command.toLowerCase() === "buttshot") {

        let quotes = ["Hello, we are about to launch an all-out attack to your houze. Sincerely, the Zombies.",

            "Hello, We wood like to visit for a midnight znack. How does icecream and brains zound? Sincerely, the Zombies.",

            "Hello, We herd you were having a pool party. We think that iz fun.Well be rite over. Sincerely, the Zombies.",

            "Hello, This iz your Muther. Please come over to my house for 'Meatloaf' Leave your front door open and your lawn unguarded. Sincerely, Mom(not the Zombies).",

            "Homeowner, You have failed to submit to our rightful claim. Be advised that unless you comply, we will be forced to take extreme action. Please permit your home and brains to us forthwith. Sincerely, Dr.Edgar Zomboss."]

        let randomNumber = Math.floor(Math.random() * quotes.length);
        const randomElement = quotes[randomNumber];
        twitchClient.say(channel, randomElement)
    }

    let foundCommand = textCommands.find((element) => element.name === command.toLowerCase());

    foundCommand && twitchClient.say(channel, foundCommand.response);


});
