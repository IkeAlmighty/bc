import { api } from "./api.js";

const myId = "648518346355002837";

let buyLoc = process.argv[2];
if (buyLoc == "-") buyLoc = undefined;
let sellLoc = process.argv[3] || "Freeport";
if (sellLoc == "-") sellLoc = undefined;

let min_ppd = process.argv[5] || 0
let minPrice = process.argv[4] || 500;

const red = "\x1b[31m";
const green = "\x1b[32m";
const reset = "\x1b[0m";
const gray = "\x1b[2m";
const yellow = "\x1b[93m";

console.log(buyLoc?.toUpperCase() || "anywhere", "->", sellLoc?.toUpperCase() || "anywhere");

(async () => {
  let deals = await api.market.deals();
  deals = deals.arbitrage;

  if (sellLoc) {
    deals = deals.filter((d) => d.sellLocation === sellLoc);
  }

  if (buyLoc) {
    deals = deals.filter((d) => d.buyLocation === buyLoc);
  }

  console.log(gray);
  console.log("#".repeat(30));
  for (let item of deals) {
    const cost = item.buyPrice * item.buyQuantity;
    const sellQuantity =
      item.buyQuantity > item.sellQuantity
        ? item.sellQuantity
        : item.buyQuantity;
    const revenue = item.sellPrice * sellQuantity;
    const net = revenue - cost;
    const percentProfit = ((net / revenue) * 100).toFixed(1);

    const dx = item.buyLocationX - item.sellLocationX;
    const dz = item.buyLocationZ - item.sellLocationZ;
    const distance = Math.sqrt(dx ** 2 + dz ** 2).toFixed(0);

    const ppd = (revenue / distance).toFixed(3);
 
    if (net < minPrice) continue;
    if (ppd < min_ppd) continue;

    console.log(
      item.buyLocation.toUpperCase(),
      "->",
      item.sellLocation.toUpperCase(),
    );

    console.log(`R${item.buyRegionId} to R${item.sellRegionId}`);
    console.log("distance: ", distance);

    console.log(reset);
    console.log("item: ", item.itemName);
    console.log("buy count: ", item.buyQuantity);
    console.log(red, "buy total: ", cost);
    console.log(green, "profit: ", net);
    console.log(reset, "percent profit: ", `${percentProfit}%`);
    console.log(yellow, "profit per distance: ", ppd, reset);
    console.log(gray);
    console.log("#".repeat(30));
  }

	console.log("Total of ", deals.length, " deals.");
})();
