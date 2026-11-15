//import player from './lib/player.js'
//import claims from './lib/claims.js'
import market from './lib/market.js'
import readline from 'readline';

console.log("ike's Bitcraft Terminal Tools");
console.log("type 'help' to see available commands.");

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

async function get_input(quit) {
	if (quit) {
		rl.close()
		return
	}

	rl.question(">> ", c => {
		let q = await dispatch_command(c);
		await get_input(q)
	});
}

async function dispatch_command(command) {
	switch (command) {
		case "market":
			await market.getNearestMarketData();
			break;
	}

	return command == "q" || command == "quit" || command == "exit"
}

(async ()=> { await get_input() })()
