/**
 * Mimics a game board
 * A particular game will have two configurable things:
 * 1. @property: playerCount – Number of Players
 * 2. @property: thresholdScore – The target score, attaining which the player
 * 	  would be considered to have finished the game
 *
 * @property: standings store the players in sequence of their finishing order
 */
class Gameboard {
	constructor(playerCount, thresholdScore) {
		this.playerCount = playerCount;
		this.thresholdScore = thresholdScore;
		this.standings = [];
	}

	addWinner(player) {
		this.standings.push(player);
	}

	resetStandings() {
		this.standings = [];
	}
}

module.exports = Gameboard;
