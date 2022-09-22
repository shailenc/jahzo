const { SlashCommandBuilder } = require('@discordjs/builders');
const { Matches } = require("../mongo/mongo.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('x')
		.setDescription('invents a fake game including yourself and some random IDs to test reporting.')
		.setDefaultPermission(false),
	async execute(interaction)
	{
		if (interaction.user.id != "179774906286866442")
		{
			return interaction.reply({ content: "this command is for boeuf only" });
		}
		await Matches.inventfakegame(interaction.user.id);
		return interaction.reply({ content: "just invented some fake gaming", ephemeral: true });
	},
};