const { rollDice } = require("../../helpers");

/**
 * Mimics a real world game player
 * @property: id – A serial number (a unique identifier)
 * @property: name – Name of the player
 * @property: rollHistory – Stores all the dice roll values a player throws
 * @property: score – The total score for the game. The higher the better.
 * @property: skipTurn – Boolean – whether to skip the next turn.
 * @property: hasFinished – Boolean – whether the player's score has crossed the game's threshold.
 */
class Player {
	constructor(id, name) {
		this.id = id;
		this.name = name;

		this.rollHistory = [];
		this.score = 0;
		this.skipTurn = false;
		this.hasFinished = false;
	}

	// not used anywhere yet. Could be used in future.
	reset() {
		this.score = 0;
		this.skipTurn = false;
		this.hasFinished = false;
		this.rollHistory = [];
	}

	playTurn() {
		if (this.skipTurn) {
			this.skipTurn = false;
			return null;
		}

		const diceValue = rollDice();
		this.score += diceValue;
		this.rollHistory.push(diceValue);

		if (this.rollHistory.length >= 2) {
			const { length } = this.rollHistory;
			if (this.rollHistory[length - 1] === 1 && this.rollHistory[length - 2] === 1) {
				this.skipTurn = true;
			}
		}
		return diceValue;
	}

	markGameFinished() {
		this.hasFinished = true;
	}
}

module.exports = Player;
