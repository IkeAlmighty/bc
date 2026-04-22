import { api } from "./api.js";
import { writeFile, writeFileSync, readFileSync, existsSync } from "fs";
let cache = {};

if (!existsSync("market-cache.json")) {
	writeFileSync("market-cache.json", "{}");
}

try {
	const contents = readFileSync("market-cache.json");
	cache = JSON.parse(contents);
} catch (err) {
	console.error(err);
}

export async function getMarketPrice(itemId) { 
	let itemData = cache[itemId];
	let write = false;

	// check that this data is not stale:
	const fifteenDays = 1000 * 60 * 60 * 24 * 15;
	if (itemData?.ts < Date.now() - fifteenDays) {
		console.log(itemId, " has no ts or an old ts, update triggered");
		itemData = null;
	}

	// try for item endpoint
	if (!itemData) {
		const { priceStats } = await api.market.item[itemId]["price-history"]();
		itemData = priceStats;
		write = true;
	}

	// try for cargo endpoint
	if (!itemData) { 
		const { priceStats } = await api.market.cargo[itemId]["price-history"]();
		itemData = priceStats;
		write = true;
	}

	if (write) await writeToCache(itemId, itemData);
	return itemData;
}

async function writeToCache(key, value) {
	cache[key] = {...value, ts: Date.now() };
	await writeFile(
		"market-cache.json", 
		JSON.stringify(cache), 
		() => console.log(" ...updated cache for itemId", key)
	);
	
}

// tests:
if (process.env.NODE_ENV==="TEST") {
	(async () => {
		const { items } = await api.items();
		for (let item of items) {
			const priceStats = await getMarketPrice(item.id);
		}
	})(); 
}
