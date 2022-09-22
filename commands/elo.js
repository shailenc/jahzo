const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const bEmbeds = require('../assets/bEmbeds.js');
const { Players } = require("../mongo/mongo.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('elo')
		.setDescription("Check your/a player's inhouse elo.")
		.addUserOption(option =>
			option
				.setName("user")
				.setDescription("User for the in-house ELO check.")
				.setRequired(false),
		),

	async execute(interaction)
	{

		// if no user specified, assume player to check is the user who called the command
		const user = interaction.options.getUser('user') ? interaction.options.getUser('user') : interaction.user;
		const playerToFetch = user.id ? user.id : interaction.user.id;

		// get playerinfo from db
		await Players.makesurepeopleexist([playerToFetch]);
		const playerInfo = await Players.fetchPlayer(playerToFetch);
		console.log(playerInfo);

		if (playerInfo)
		{
			// if player exists in the db

			const userAvatar = (user) => user.displayAvatarURL();

			const mbed = new MessageEmbed()
				.setTitle(`${(typeof playerInfo.prefName) === "undefined" ? user.username : playerInfo.prefName}`)
				// .setDescription(" ")
				.setColor(bEmbeds.col.purple)
				.setDescription(`(As of <t:${Math.floor(new Date().getTime() / 1000)}:t>)`)
				.setThumbnail(userAvatar(user))
				.addFields({
					name: "Overview",
					value: `ELO: ${playerInfo.inhouseElo}\nWins: ${playerInfo.wins}\nLosses: ${playerInfo.losses}\nStreak: ${playerInfo.streak > 0 ? playerInfo.streak + "W" : (-1) * playerInfo.streak + "L"}`,
				});

			return interaction.reply({ embeds: [mbed] });
		}
		else
		{
			// no data in db found for player
			return interaction.reply({ content: `Couldn't find data for ${user.username} :t_rex:`, ephemeral: true });
		}

	},
};