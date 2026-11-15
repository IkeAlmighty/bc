import { api } from "./api.js";

const id = '648518346635061983'

const red = "\x1b[31m";
const green = "\x1b[32m";
const reset = "\x1b[0m";
const gray = "\x1b[2m";

async function getLocation() {
	const { player: { locationX, locationZ } } = await api.players[id]();
	return { locationX, locationZ }
}
