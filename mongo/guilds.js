class Guild
{

	constructor(db)
	{
		this.collection = db.collection('guilds');
	}

	async updateGuildInhouseIDs(targetGuildID, gamechannelIDs)
	{
		const res = await this.collection.updateOne(
			// search filter
			{ guildID: targetGuildID },

			// stuff to set
			{ $set: { inhouseChannelIDs: gamechannelIDs } },

			// options
			{ upsert: true },
		);
		return res;
	}

	async fetchGuildInhouseIDs(id)
	{
		const result = await this.collection.findOne(
			{ guildID:id },
			{ projection:{ _id:false, inhouseChannelIDs:true } },
		);

		return result.inhouseChannelIDs;
	}

	async fetchGuildGamelog(id)
	{
		const result = await this.collection.findOne(
			{ guildID:id },
			{ projection:{ _id:false, inhouseChannelIDs:true } },
		);

		if (result)
		{
			return result.inhouseChannelIDs.gamelog;
		}
		else
		{
			return 0;
		}
	}
}

module.exports = Guild;