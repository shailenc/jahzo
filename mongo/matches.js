class Match
{
	constructor(db)
	{
		this.collection = db.collection('matches');
	}

	async createNewMatch(userDiscordId, players)
	{

		const newMatch = await this.collection.insertOne(
			{
				team1: players.team1,
				team2: players.team2,
				// reporter: userDiscordId,
				winner: "unreported",
				date: new Date(),
			},
		);

		return newMatch;
	}

	async fetchUnfinishedMatch(dcid)
	{
		const game = await this.collection.findOne(
			{
				winner: "unreported",
				$or: [{ team1: dcid }, { team2: dcid }],
			},
		);

		if (game)
		{
			return game;
		}
		else
		{
			return 0;
		}
	}

	async fetchMostRecentMatch(dcid)
	{
		const game = await this.collection.findOne(
			{
				$or: [{ winner: 1 }, { winner: 2 }],
				$or: [{ team1: dcid }, { team2: dcid }],
			},
		);

		if (game)
		{
			return game;
		}
		else
		{
			return 0;
		}
	}

	async reportMatch(matchId, dcid, winner)
	{
		const res = await this.collection.findOneAndUpdate(
			// search filter
			{ _id: matchId },

			// stuff to set
			{ $set: { winner: winner, reporter: dcid } },

			{ upsert: true, returnDocument: "after" },
		);

		return res;
	}

	async cancelMatch(matchID, dcid)
	{

		// old one, to just delete match
		// const res = await this.collection.updateOne({ _id: matchId });

		// new one: keeps match but flag as cancelled
		// allows for recovery/reporting if falsely reported
		const res = await this.collection.updateOne(
			// search filter
			{ _id: matchID },

			// stuff to set
			{ $set: { winner: "cancelled", reporter: dcid } },

			{ upsert: true },
		);

		// will be 0 if fail, 1 if deleted
		// return res.deletedCount;
	}

	async unreportaGame(dcid)
	{
		const res = await this.collection.findOneAndUpdate(
			// search filter
			{
				$or: [{ team1: dcid }, { team2: dcid }],
			},

			// stuff to set
			{
				$set: { winner: "unreported" },
				$unset: { reporter: "" },
			},

			{ projection: { _id: 1 } },
		);

		return res;
	}

	async inventfakegame(dcid)
	{
		const res = await this.collection.insertOne(
			{
				team1: [dcid, "144627649115979776", "890342167187427388"],
				team2: ["208442899308740608", "191000982048473088", "483422716612050945"],
				winner: "unreported",
				date: new Date(),
			},
		);

		return res;
	}

	//
	// NEED TO MAKE FETCHGAMES -- FIGURE OUT PAGINATION; (DISCORD BUTTONS + MONGO STUFF)
	//
}

module.exports = Match;