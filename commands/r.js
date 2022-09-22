/* eslint-disable no-trailing-spaces */
/* eslint-disable indent */
const { SlashCommandBuilder } = require('@discordjs/builders');
const { Matches, Guilds, Players } = require("../mongo/mongo.js");
const bEmbeds = require("../assets/bEmbeds.js");
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('r')
		.setDescription('report game outcome.'),
	async execute(interaction)
	{

		// ✅ 🗑️ ❌

		// get command caller's most recent unreported game
		// assumes they only have one unreported game
		// in the (unintentional) case that somehow they're in two unreported matches, may cause issues but that just has to get fixed manually for now
		const game = await Matches.fetchUnfinishedMatch(interaction.member.id);

		if (!game)
		{
			return interaction.reply({ content: "<:kanje:985322981028933702> I can't find a game to report", ephemeral: true });

		}
		else
		{
			const row = new MessageActionRow()
				.addComponents(
					new MessageButton()
						.setCustomId('W')
						.setLabel("Win")
						.setStyle(3)
						.setEmoji(""),

					bEmbeds.butt.logo,

					new MessageButton()
						.setCustomId('L')
						.setLabel("Loss")
						.setStyle(4),
				);

			const row2 = new MessageActionRow()
				.addComponents(
					new MessageButton()
						.setCustomId('cancel')
						.setLabel("Cancel match")
						.setStyle(2),
				);

			// send message with embed, and buttons (win, cancel, loss) for match reporting
			const msg = await interaction.reply({ embeds: [bEmbeds.matchInfo(game)], components: [row, row2], fetchReply: true, ephemeral: true });

			// filter for button event listener on bot's sent message, only accept button interactions from command caller
			const filter = i =>
			{
				i.deferUpdate();
				return i.user.id === interaction.user.id;
			};


			// component interaction
			let compInteraction = "";

			// wait for user buttonpress, if nothing then just edit msg to a timeout msg
			try
			{
				compInteraction = await msg.awaitMessageComponent({ filter, time: bEmbeds.msToTimeout });
			}
			catch 
			{
				return interaction.editReply(bEmbeds.preset.timeout);
			}


			try
			{
				// if user selects cancel match
				if (compInteraction.customId === "cancel")
				{
					await Matches.cancelMatch(game["_id"], interaction.user.id);
					return interaction.editReply(bEmbeds.preset.success);
				}

				// check if user has an unreported game in the db
				const unfinishedMatch = await Matches.fetchUnfinishedMatch(interaction.user.id);
				if(!unfinishedMatch)
				{
					return interaction.editReply({
						content: "You don't have an unfinished match to report.",
						embeds: [],
						components: [],
					});
				}

				// for game-log channel object
				let glc = 0;

				// try fetching discord channels, edit reply to an error msg if breaks
				try
				{
					const glChannelID = await Guilds.fetchGuildGamelog(interaction.guild.id);
					glc = await interaction.guild.channels.fetch(glChannelID);
				}
				catch(e)
				{	
					console.log(e);
					return interaction.editReply({
						content: "Match not reported as something went wrong when finding the inhouse channels.\n(Get someone with admin perms *(@beef ???)* to do \`/admin buildchannels\`, then try reporting the match again.)",
						embeds: [],
						components: [],
					});
				}

				let winner = 1;

				if (compInteraction.customId == "W" && unfinishedMatch.team1.includes(interaction.user.id) || compInteraction.customId == "L" && unfinishedMatch.team2.includes(interaction.user.id))
				{
					winner = 1;
				}
				else
				{
					winner = 2;
				}

				// report game in db, change ELO for players
				const reportedGame = await Matches.reportMatch(unfinishedMatch['_id'], interaction.user.id, winner);

				await glc.send({ embeds: bEmbeds.completedMatchInfo(reportedGame) });

				// reply to reporter
				interaction.editReply({
					embeds: [new MessageEmbed().setColor(bEmbeds.col.green).setDescription(`:thumbsup: Match with ID ${reportedGame["_id"]} reported.`)],
					components: [],
				});

				const guildIHchannelIDs = await Guilds.fetchGuildInhouseIDs(interaction.guild.id);
				const category = await interaction.guild.channels.fetch(guildIHchannelIDs.category);

				// move all users back to the 'Q' channel once match is reported
				try
				{
					category.children.forEach(channel =>
					{
						if (channel.isVoice())
						{
							channel.members.forEach(user => user.voice.setChannel(guildIHchannelIDs.queue));
						}
					});

					const mbed = new MessageEmbed().setDescription(":bread: All players returned to the Q vc.").setColor(bEmbeds.col.blue);

					return await interaction.editReply({ embeds: [new MessageEmbed().setColor(bEmbeds.col.green).setDescription(`:thumbsup: Match with ID ${reportedGame["_id"]} reported.`), mbed] });

				}
				catch 
				{
					return interaction.editReply({ embeds: [bEmbeds.preset.err] });
				}

			}
			catch (error)
			{
				console.log(error);
				interaction.editReply(bEmbeds.preset.err);
			}
		}
	},
};