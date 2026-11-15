import { api } from "./api.js";
import { getMarketPrice } from "./marketcache.js"
import player from "./player.js"
import claims from "./claims.js"
import dotenv from 'dotenv';
dotenv.config()

const red = "\x1b[31m";
const green = "\x1b[32m";
const reset = "\x1b[0m";
const gray = "\x1b[2m";
const yellow = "\x1b[93m";

async function getNearestMarketData() {
	// first, get the player's location:
	playerLocation = await player.getLocation()	

	// then, get the nearest claim to location:
	nearestClaim = await claims.getNearest(playerLocation);

	// then, grab the market data!
	marketData = await getMarketData(nearestClaim);

	// then print it :)
	printMarketData(marketData)
}

async function getMarketData({ entityId }) {
	let listings = [];
	let market;
	let page = 0;
	do {
		market = await api.claims[entityId].market.listings({
			params: {
				page,
				limit: 200,
				side: "sell"
			} 
		});
		market.listings.forEach(o => listings.push(o));
		page++;
	}
	while (market.listings.length);

	return listings
}

function printMarketData(listings) {
	let i = 0;
	let output = [];
	output.push({ name: "NAME", price: "$$", avg: "MKT", qty: "QTY", potentialProfit: "NET", vol: "VOL", percentDifference: "% Diff" });

	// get all the price data per item:
	for (let item of listings) {
		let stats = await getMarketPrice(item.itemId);
		const avg = parseInt(stats.avg30d).toFixed(0);

		if (!stats.avg30d || avg <= parseInt(item.price)) continue;
		const potentialProfit = item.quantity*(avg - item.price)
		const releaseDate = new Date("2026-11-13");
		const today = new Date();
		const diff = (today - releaseDate) / 1000 / 60 / 60 / 24;
		const vol = (stats.totalVolume / diff).toFixed(2);
		const percentDifference = ((avg - item.price) * 100 / avg).toFixed(2);

		output.push({ name: `${item.itemName} (T${item.itemTier})`, price: item.price, avg, qty: item.quantity, potentialProfit, vol, percentDifference});

		//i+=1
		//const perc = (i * 100 / listings.length).toFixed(0);
		//process.stdout.write("\r");
		//process.stdout.write(`${perc}%`);
	}

	output = output.sort((a, b) => (a.potentialProfit / b.potentialProfit) - (b.percentDifference  / a.percentDifference) - (b.vol / a.vol));

	console.log("");

	// print each item's stats:
	const colors = [ gray, red, yellow, reset, green, reset, reset];
	let cindex = 0;

	function printCell(item, key, width=7) { 
		let cell = item[key];
		if (cell.length > width) cell = cell.substring(0, width);
		let color = colors[cindex];

		process.stdout.write(`${reset}${color}${cell}`);
		process.stdout.write(" ".repeat(width - cell.toString().length)); 

		cindex++;
		if (cindex >= colors.length) cindex = 0;
	}

	for (let item of output) {
		printCell(item, "name", 45);
		printCell(item, "price");
		printCell(item, "avg");
		printCell(item, "qty");
		printCell(item, "potentialProfit");
		printCell(item, "vol");
		printCell(item, "percentDifference");
		process.stdout.write(`${reset}\n`);
	}
}
