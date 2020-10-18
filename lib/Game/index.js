/* eslint-disable no-plusplus */
/* eslint-disable no-underscore-dangle */
const Name = require("docker-names");
const Gameboard = require("../Gameboard");
const Player = require("../Player");
const { shuffle } = require("../../helpers");

/**
 * The main class for our application.
 * @property: player – list of all players (Player objects).
 * @property: gameboard – The gameboard for this game.
 * @property: nextTurn – The index for the player (in the - @property: player - list), whose turn is awaited.
 * @property: isGameFinished – Boolean – If the game has finished
 * @property: rollDice – Func – The promise resolver for the rollDice confirmation from user.
 */
class GameOfDice {
	constructor(playerCount, thresholdScore) {
		if (isNaN(playerCount) || playerCount <= 0) {
			throw new Error("Player Count is an invalid number. Please enter a whole number");
		}
		if (isNaN(thresholdScore) || thresholdScore <= 0) {
			throw new Error("The threshold is invalid. Please enter a whole number");
		}

		this.players = [];
		this.gameboard = new Gameboard(playerCount, thresholdScore);
		this.nextTurn = 0;
		this.isGameFinished = false;
		this.rollDice = () => {};

		for (let i = 0; i < playerCount; i++) {
			this.players.push(
				new Player(
					i,
					Name.getRandomName()
						.split("_")
						.map((str) => str.charAt(0).toUpperCase() + str.slice(1))
						.join(" ")
				)
			);
		}
	}

	/**
	 *
	 *  main game logic
	 *
	 *  */

	// to randomise the playing sequence
	// shuffle the player list
	// alternatively could also store the shuffled order in a new list
	// but the original stored sequence has no significance.
	shufflePlayingSequence() {
		shuffle(this.players);
	}

	_incrementTurn() {
		this.nextTurn++;
		this.nextTurn %= this.gameboard.playerCount;
	}

	_getNextPlayer() {
		while (this.players[this.nextTurn].hasFinished) {
			this._incrementTurn();
		}

		return this.players[this.nextTurn];
	}

	getPlayerConfimation() {
		return new Promise((resolve) => {
			this.rollDice = resolve;
		});
	}

	async beginGame() {
		// this.gameboard.resetStandings();

		while (this.gameboard.standings.length !== this.gameboard.playerCount) {
			const player = this._getNextPlayer();

			if (!player.skipTurn) {
				await this.getPlayerConfimation();
			}
			// in case of a skipped turn, playTurn returns null
			// and resets skipTurn to false to enable the player to play his/her next turn.
			const diceValue = player.playTurn();
			if (player.score >= this.gameboard.thresholdScore) {
				player.markGameFinished();
				this.gameboard.addWinner(player);
			}

			// on a six, player gets to play again, if his game is not finished yet
			if (diceValue !== 6) {
				this._incrementTurn();
			}
		}

		this.isGameFinished = true;
	}

	// the following methods are used by blessed.logger
	getPlayerDetails() {
		return this.players[this.nextTurn];
	}

	getCurrentScoreBoard() {
		return [
			["ID", "Name", "Last Two Turns", "Score"],
			...this.players.map(({ id, name, score, rollHistory }) => {
				const turns = rollHistory.length;
				const { [turns - 2]: secondLast, [turns - 1]: last } = rollHistory;
				return [
					id.toString(),
					name,
					`${secondLast || "-"} ${last || "-"}`,
					score.toString(),
				];
			}),
		];
	}

	finalScore() {
		if (!this.isGameFinished) throw new Error("Game is not yet finished");
		return [
			["Rank", "ID", "Name", "Score"],
			...this.gameboard.standings.reduce(
				(acc, { id, name, score }, idx) => [
					...acc,
					[(idx + 1).toString(), id.toString(), name, score.toString()],
				],
				[]
			),
		];
	}
}

module.exports = GameOfDice;
