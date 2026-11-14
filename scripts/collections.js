import { api, getAllClaims } from "./api.js";
import dotenv from 'dotenv';
dotenv.config()

const myId = process.env.PLAYER_ID;

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
