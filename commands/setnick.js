const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { Players } = require("../mongo/mongo.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setnick')
		.setDescription('Change the nickname displayed on your bot-generated profile.')
		.addStringOption(option =>
			option.setName('name')
				.setDescription('Update your nickname shown on /elo.')
				.setRequired(true),
		),
	async execute(interaction)
	{

		const newnick = interaction.options.getString("name"); 
		console.log(newnick);

		try
		{
			await Players.setNick(interaction.member.id, newnick);
			return interaction.reply({ content: `:white_check_mark: Changed your nick in the db to ${newnick}` });
		}
		catch
		{
			return interaction.reply({ content: "Couldn't change data :t_rex:", epheremal: true });
		}
	},
};