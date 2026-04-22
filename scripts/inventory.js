import { api } from "./api.js";
import { getMarketPrice } from "./marketcache.js"

const myId = "648518346355002837";

const red = "\x1b[31m";
const green = "\x1b[32m";
const reset = "\x1b[0m";
const gray = "\x1b[2m";
const yellow = "\x1b[93m";

(async () => {

	const { inventories } = await api.players[myId].inventories()	
	
	const inv = inventories.filter(i=> i.inventoryName==="Inventory")[0]?.pockets || [];
	const skiff = inventories.filter(i=> i.inventoryName==="gem's Skiff (I)")[0]?.pockets || [];

	const pockets = inv.concat(skiff);
	const inventory = pockets.map(p => p.contents);

	let totalHc = 0;
	let output = "\n";
	let i = 0;
	for (let item of inventory) {

		let stats = await getMarketPrice(item.itemId);

		const info = await api.items[item.itemId]();
		const name = info.item.name;

		const avg = parseInt(stats.avg30d).toFixed(0);
		totalHc += avg*item.quantity;

		if (avg <= parseInt(item.price)) continue;

		output += `${gray}${name} x${item.quantity}${reset} ${green}${avg}${reset}\n`;

		i+=1
		const perc = (i * 100 / inventory.length).toFixed(0);
		process.stdout.write("\r");
		process.stdout.write(`${perc}%`);
	}

	console.log(output);
	process.stdout.write(reset);
	console.log("Total Market Value:", totalHc);
})();
