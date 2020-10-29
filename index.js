const blessed = require("blessed");
const { program } = require("commander");
const Game = require("./lib/Game");

// command line configuration
// taking player count and threshold as argv (as per spec)
program
	.version("0.0.1")
	.option("-p, --players <player count>", "number of players who want to play", parseInt)
	.option("-t, --threshold <threshold score>", "threshold score at which a player wins", parseInt)
	.parse(process.argv);

// creates a new game
let game;
try {
	game = new Game(program.players, program.threshold);
} catch (error) {
	console.error(error.message);
	process.exit(0);
}

// initial player list
// users pick a name from this list and stick with it throughout the game.
const playerList = [
	["ID", "Name"],
	...game.players.map(({ id, name }) => [(id + 1).toString(), name]),
];

/**
 * Creates a new curses like UI
 */
const screen = blessed.screen({
	smartCSR: true,
	autoPadding: true,
	title: "Game of Dice",
});

// The main container which contains table and the logger view
const PageContainer = blessed.box({
	width: "100%",
	height: "100%",
	tags: true,
	content: "{center}Game of Dice",
	style: {
		fg: "white",
		bg: "#0f0f0f",
	},
	border: "line",
	padding: {
		top: 1,
		bottom: 1,
		left: 2,
		right: 2,
	},
});

// Will log all the turns
const logger = blessed.log({
	parent: PageContainer,
	top: 5,
	left: 0,
	width: "55%",
	height: "80%",
	border: "line",
	tags: true,
	keys: true,
	vi: true,
	mouse: true,
	scrollback: 200,
	scrollbar: {
		ch: " ",
		track: {
			bg: "yellow",
		},
		style: {
			inverse: true,
		},
	},
});

// will show game scoreboard
// when the game ends this will also show the final tally
const table = blessed.listtable({
	parent: PageContainer,
	top: 5,
	right: 0,
	data: playerList,
	border: "line",
	align: "left",
	tags: true,
	keys: true,
	width: "40%",
	height: "80%",
	vi: true,
	mouse: true,
	interactive: true,
	style: {
		border: {
			fg: "green",
		},
		header: {
			fg: "white",
			bg: "green",
			bold: true,
		},
		cell: {
			fg: "white",
			selected: {
				bg: "#006366",
			},
		},
	},
});

const info = blessed.box({
	parent: PageContainer,
	top: 2,
	width: "shrink",
	border: "line",
	tags: true,
	content: "{bold}Ctrl-C to exit anytime.{/bold} R to roll the dice.",
	height: "shrink",
	style: {
		border: {
			fg: "blue",
		},
	},
});

// creates a log entry in the logger created above
const logTurnRequest = () => {
	const { id, name, rollHistory } = game.getPlayerDetails();
	let logString = `{blue-fg}> (${id}) ${name}'s{/blue-fg} turn.`;

	if (rollHistory.length > 0 && rollHistory[rollHistory.length - 1] === 6) {
		logString = `{blue-fg}> (${id}) ${name}'s{/blue-fg} turn again. {green-fg}666!!!{/green-fg}`;

		// will have to implement a method to fetch previous player's details.
		// const len = rollHistory.length;
		// if (len > 1 && rollHistory[len - 1] === 1 && rollHistory[len - 2] === 1) {
		// 	logString = `{blue-fg}> (${id}) ${name}'s{/blue-fg} will miss next turn. {red-fg}1 1{/red-fg}`;
		// }
	}
	if (rollHistory.length >= 3) {
		const { length } = rollHistory;
		if (length >= 3) {
			const { [length - 1]: last, [length - 2]: sLast, [length - 3]: tLast } = rollHistory;
			if (last + sLast + tLast === 10) {
				logString = `{blue-fg}> (${id}) ${name}'s{/blue-fg} turn again. {green-fg} Last 3 turns' Sum is 10{/green-fg}`;
			}
		}
	}

	table.scrollTo(game.nextTurn + 1);
	table.select(game.nextTurn + 1);
	logger.log(logString);
};

// to ensure that b is disabled after it has initally been pressed
let gameStarted = false;
screen.key("b", () => {
	if (!gameStarted) {
		game.shufflePlayingSequence();
		logger.log("{black-fg}{green-bg}Random Playing sequence Generated !{/green-bg}{/black-fg}");
		logger.pushLine("");

		table.setData(game.getCurrentScoreBoard());
		game.beginGame();
		game.rollDice();
		logTurnRequest();
		screen.render();
	}
	gameStarted = true;
});

// don't use arrow function
// arrows don't have "this"
screen.key("C-c", function (_ch, _key) {
	this.destroy();
	return process.exit(0);
});

// flag to ensure that r is disabled after the game has ended
let stopGameUI = false;
screen.key("r", (_ch, _key) => {
	if (gameStarted) {
		if (!game.isGameFinished) {
			const { id, name, skipTurn } = game.getPlayerDetails();
			if (skipTurn) {
				logger.log(
					`{blue-fg}> (${id}) ${name}'s{/blue-fg} turn is skipped because of two {red-fg}1 1{/red-fg}. Press r to acknowledge.`
				);
			}
			game.rollDice();
			table.setData(game.getCurrentScoreBoard());
			if (!skipTurn) logTurnRequest();
			screen.render();
		} else if (!stopGameUI) {
			const data = game.finalScore();
			// data[1][2] = `{red-fg}${data[1][2]}{/red-fg}`;
			// data[2][2] = `{blue-fg}${data[2][2]}{/blue-fg}`;
			// data[3][2] = `{yellow-fg}${data[3][2]}{/yellow-fg}`;
			table.setData(data);
			logger.log("Game has ended");
			stopGameUI = true;
		}
	}
});

screen.append(PageContainer);

// show inital game instruction
logger.log("{bold}Assign yourselves a name from the list.{/bold}");
logger.log("{red-fg}Press b to begin the game.");
screen.render();
