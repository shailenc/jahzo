const { TimestampStyles } = require("@discordjs/builders");

class Player {
	constructor(db) {
		this.collection = db.collection('players');
	}

	async initNewPlayer(userDiscordId) {
		const newPlayer = await this.collection.insertOne(
			{
				discordId: userDiscordId,
				inhouseElo: 500,
				wins: 0,
				losses: 0,
				streak: 0,
			},
		);
		return newPlayer;
	}

	async fetchPlayer(uid) {
		const homie = await this.collection.findOne(
			{ discordId: uid },
		);

		return homie;
	}

	async fetchOrInitPlayer(dcid) {
		const homie = await this.collection.findOneAndUpdate(
			{ discordId: dcid },

			{ $setOnInsert: {
				discordId: userDiscordId,
				inhouseElo: 500,
				wins: 0,
				losses: 0,
				streak: 0,
			},
			},

			{ upsert: true, returnDocument: "after" },
		);

		return homie;
	}

	async makesurepeopleexist(people) {
		// param 'loser' is array of 3 player's discordIDs

		people.forEach(async personId => {
			const res = await this.collection.updateOne(
				// filter
				{ discordId: personId },

				// to update
				{
					// $set: { discordId: personId},

					$setOnInsert: {
						discordId: personId,
						inhouseElo: 500,
						wins: 0,
						losses: 0,
						streak: 0,
					},
				},

				{ upsert: true },

			);
		});
	}

	async postMatchSetElo(winners, losers)
	{
		console.log(winners);
		console.log(losers);
		// param 'winner' is array of 3 player's discordIDs
		winners.forEach(async personId => {
			const res = await this.collection.updateOne(
				// filter
				{ discordId: personId },

				// to update
				[{
					$set: {
						streak: {
							$cond: {
								if: {
									$lte: ["$streak", 0],
								},
								then: 1,
								else: { $sum: ["$streak", 1] },
							},
						},

						wins: { $sum: ["$wins", 1] },
						inhouseElo: { $sum: ["$inhouseElo", 5] },
					},
				}],
			);
		});

		// param 'losers' is array of 3 player's discordIDs
		losers.forEach(async personId => {
			const res = await this.collection.updateOne(
				// filter
				{ discordId: personId },

				// to update
				[{
					$set: {
						streak: {
							$cond: {
								if: {
									$gte: ["$streak", 0],
								},
								then: -1,
								else: { $sum: ["$streak", -1] },
							},
						},

						losses: { $sum: ["$losses", 1] },
						inhouseElo: { $sum: ["$inhouseElo", -5] },
					},
				}],
			);
		});
	}

	async setNick(uid, newname) {

		await this.collection.updateOne(
			// search filter
			{ discordId: uid },

			// stuff to set
			{ $set: { prefName: newname } },

			// options
			{ upsert: true },
		);
	}

	async resetNick(uid) {

		await this.collection.updateOne(
			// search filter
			{ discordId: uid },

			// stuff to set
			{ $unset: { prefName: "" } },
		);
	}
}

module.exports = Player;