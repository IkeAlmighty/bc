import { appendFileSync } from "fs";
import { api } from "./api.js";

const red = "\x1b[31m";
const green = "\x1b[32m";
const reset = "\x1b[0m";
const gray = "\x1b[2m";

(async () => {
	const { players } = await api.players({ params: { q: "gem" } });
	console.log(players)	
})();
