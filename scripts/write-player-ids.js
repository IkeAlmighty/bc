import { appendFileSync } from "fs";
import { api } from "./api.js";

const myId = "648518346355002837";

const red = "\x1b[31m";
const green = "\x1b[32m";
const reset = "\x1b[0m";
const gray = "\x1b[2m";

const alph = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
];

const alph2 = [];
for (let l1 of alph) {
  for (let l2 of alph) {
    alph2.push(`${l1}${l2}`);
  }
}
console.log(alph2);
(async () => {
  // First, compile a list of all players, making sure to follow rate limits.
  // Animate a progress bar since this will take ~30min:
  const playerIds = new Set();
  for (let index = 0; index < alph2.length; index++) {
    const letter = alph2[index];
    const { players } = await api.players({ params: { q: letter } });

    for (let player of players) {
      appendFileSync("playerIds", `${player.entityId}\n`);
    }

    const perc = (((index + 1) * 100) / alph2.length).toFixed(2);
    process.stdout.write("\r");
    process.stdout.write(`${perc}% complete`);
 }
})();
