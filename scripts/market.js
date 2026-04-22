import { api, findClaimByName } from "./api.js";
import { getMarketPrice } from "./marketcache.js"

const myId = "648518346355002837";

const claimName = process.argv[2] || "Freeport";

const red = "\x1b[31m";
const green = "\x1b[32m";
const reset = "\x1b[0m";
const gray = "\x1b[2m";
const yellow = "\x1b[93m";

(async () => {
	let claim = undefined;
	try {
		claim = await findClaimByName(claimName);
	} catch (err) { 
		console.log(err.message);
		process.exit(1);
	}
	
	let listings = [];
	let market;
	let page = 0;
	do {
		market = await api.claims[claim.entityId].market.listings({
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

	let i = 0;
	let output = [];
	output.push({ name: "NAME", price: "PRICE", avg: "MKT VAL", qty: "QTY", potentialProfit: "PROFIT POTENTIAL" });

	// get all the price data per item:
	for (let item of listings) {
		let stats = await getMarketPrice(item.itemId);
		const avg = parseInt(stats.avg30d).toFixed(0);

		if (!stats.avg30d || avg <= parseInt(item.price)) continue;
		const potentialProfit = item.quantity*(avg - item.price)

		output.push({ name: `${item.itemName} (T${item.itemTier})`, price: item.price, avg, qty: item.quantity, potentialProfit });

		//i+=1
		//const perc = (i * 100 / listings.length).toFixed(0);
		//process.stdout.write("\r");
		//process.stdout.write(`${perc}%`);
	}

	output = output.sort((a, b) => a.potentialProfit - b.potentialProfit);

	console.log("");

	// print each item's stats:
	const colors = [ gray, red, yellow, reset, green ];
	let cindex = 0;

	function printCell(item, key, width=10) { 
		let cell = item[key];
		if (cell.length > width) cell = cell.substring(0, width);
		let color = colors[cindex];

		process.stdout.write(`${reset}${color}${cell}`);
		process.stdout.write(" ".repeat(width - cell.length)); 

		cindex++;
		if (cindex >= colors.length) cindex = 0;
	}

	for (let item of output) {
		printCell(item, "name", 45);
		printCell(item, "price");
		printCell(item, "avg");
		printCell(item, "qty");
		printCell(item, "potentialProfit");
		process.stdout.write(`${reset}\n`);
	}

})();
