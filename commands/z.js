const { SlashCommandBuilder } = require('@discordjs/builders');
const { Matches } = require("../mongo/mongo.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('z')
		.setDescription('change a match with your id in it to unreported.')
		.setDefaultPermission(false),
	async execute(interaction)
	{
		if (interaction.user.id != "179774906286866442")
		{
			return interaction.reply({ content: "this command is for boeuf only" });
		}

		const h = await Matches.unreportaGame(interaction.user.id);

		if (!h.value) return interaction.reply({ content: "couldn't do it. there's probably no reported games with you in them.", ephemeral: true })
		return interaction.reply({ content: "data forgery complete, document id: ``" + h.value["_id"] + "``", ephemeral: true });
	},
};