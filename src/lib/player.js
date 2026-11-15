import { api } from "./api.js";

// TODO: replace with dot env access:
const id = '648518346635061983'

async function getLocation() {
	const { player: { locationX, locationZ } } = await api.players[id]();
	return { locationX, locationZ }
}
