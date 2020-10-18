module.exports = {
	rollDice: () => Math.floor(Math.random() * 6) + 1,
	shuffle: (array) => {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
	},
};
