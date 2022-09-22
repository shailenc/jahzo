/* eslint-disable indent */
/* eslint-disable no-unused-vars */
const { SlashCommandBuilder } = require('@discordjs/builders');
const { ShardClientUtil } = require('discord.js');
const bEmbeds = require("../assets/bEmbeds.js");
const { MessageEmbed } = require("discord.js");
const { Matches } = require("../mongo/mongo.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('samples')
		.setDescription('for testing purposes')
		.setDefaultPermission(false)
		.addStringOption(option =>
			option.setName('type')
				.setDescription('sends a sample embed. for testing purposes.')
				.setRequired(true)
				.addChoice('red', 'red')
				.addChoice('green', 'green')
				.addChoice('orange', 'orange')
				.addChoice('blue', 'blue')
				.addChoice('yellow', 'yellow')
				.addChoice('purple', 'purple')
				.addChoice('timeout', 'timeout')
				.addChoice('wentWrong', 'wentWrong')
				.addChoice('actionDone', 'actionDone')
				.addChoice('confirm', 'confirm')
				.addChoice('gamelog', 'gamelog'),
		),

	async execute(interaction)
	{

		const choice = interaction.options.getString("type");
		let desc = "sample description";
		let title = "sample title";
		let col = "#ffffff";

		switch (choice)
		{
			case "timeout":
				break;

			case "wentWrong":
				return interaction.reply(bEmbeds.preset.err);
				break;

			case "actionDone":
				desc = ":white_check_mark:  <action> successfully completed.";
				col = bEmbeds.col.green;
				break;

			case "confirm":
				return interaction.reply({
					embeds: [new MessageEmbed().setDescription("Are you sure about doing <action>?").setColor(bEmbeds.col.orange)],
					components: [bEmbeds.ar.confirm],
				});
				break;

			case "gamelog": {
				const h = await Matches.fetchMostRecentMatch(interaction.member.id);
				if (!h) { return interaction.reply(bEmbeds.preset.err); }

				return interaction.reply({ embeds: bEmbeds.completedMatchInfo(h) });
				break;
			}


			default:
				desc = ":sauropod:  Ping-pong? Sample text goes here.";
				col = bEmbeds.col[choice];
				title = "Sample Embed";
				break;
		}

		const embedToSend = new MessageEmbed()
			.setColor(col)
			.setDescription(desc);

		if (title != "sample title")
		{
			embedToSend.setTitle(title);
		}

		return interaction.reply({ embeds: [embedToSend] });
	},
};