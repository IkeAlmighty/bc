import { api, getAllClaims } from "./api.js";

const myId = "648518346355002837";

(async () => {
  const { collections } = await api.players[myId]["market-collections"]();

  for (let item of collections) {
    let name = item.itemName;
    name = name.substring(0, 16);
    console.log(
      name,
      ": ",
      " ".repeat(16 - name.length),
      item.quantity,
      " ".repeat(5 - item.quantity.toString().length),
      item.claimName,
    );
  }
})();
