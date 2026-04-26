import { api, findClaimByName } from "./api.js";
import { getMarketPrice } from "./marketcache.js"

const claimName = process.argv[2] || "Freeport";
const anchorPortName = process.argv[3] || "Freeport";

const red = "\x1b[31m";
const green = "\x1b[32m";
const reset = "\x1b[0m";
const gray = "\x1b[2m";
const yellow = "\x1b[93m";

(async () => {
	let claim = undefined;
	let anchorPort = undefined;
	try {
		claim = await findClaimByName(claimName);
		anchorPort = await findClaimByName(anchorPortName);
	} catch (err) { 
		console.log(err.message);
		process.exit(1);
	}
	
	// get the listings for the claim:
	async	function getListings(claim, side) {
		let listings = [];
		let market;
		let page = 0;
		do {
			market = await api.claims[claim.entityId].market.listings({
				params: {
					page,
					limit: 200,
					side
				} 
			});
			market.listings.forEach(o => listings.push(o));
			page++;
		}
		while (market.listings.length);

		return listings;
	}

	let claimListings = await getListings(claim, "sell");
	let compareListings = await getListings(anchorPort, "sell");

	let i = 0;
	let output = [];
	output.push({ name: "NAME", price: "$$", comparison: "CMP", qty: "QTY", potentialProfit: "NET", vol: "VOL" });

	// get all the price data per item:
	for (let item of claimListings) {
		
		// skip the item if it is above market avg:
		let stats = await getMarketPrice(item.itemId);
		const avg = parseInt(stats.avg30d).toFixed(0);
		if (item.price > avg) continue

		// check the anchor port to see if there is a similar order:
		const comparableItem = compareListings.find(i => i.itemId === item.itemId);

		const comparePrice = comparableItem?.price;

		if (item.price - (comparePrice || item.price + 1) >= 0) continue;

		const potentialProfit = item.quantity*Math.abs((item.price - (comparePrice || 0)));

		output.push({ name: `${item.itemName} (T${item.itemTier})`, price: item.price, comparison: comparableItem?.price || "-", qty: item.quantity, potentialProfit});

		//i+=1
		//const perc = (i * 100 / listings.length).toFixed(0);
		//process.stdout.write("\r");
		//process.stdout.write(`${perc}%`);
	}

	output = output.sort((a, b) => (a.potentialProfit - b.potentialProfit));

	console.log("");

	// print each item's stats:
	const colors = [ gray, red, yellow, reset, green ];
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
		printCell(item, "comparison");
		printCell(item, "qty");
		printCell(item, "potentialProfit");
		process.stdout.write(`${reset}\n`);
	}

})();
