const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

class bEmbed
{
	constructor()
	{
		this.brand = {
			botName: "jahzo",

			logoEmojiID: "977111638589177856",
			logoEmojiName: "jahzo",

			botpp: "https://cdn.discordapp.com/app-icons/960380211290050660/4a1f328a894c108c20896b3ff7085a60.png?",
		};

		this.msToTimeout = 8000;

		this.col = {
			red: "#ED4245",
			green:"#2ecc71",
			dark: "#252B2C",
			light: "#636e72",
			white: "#f5f6fa",
			purple: "#9E47C1",
			yellow: "#FDCD1F",
			orange: "#e67e22",
			blue: "#3498db",
		};

		this.desc = {
			wentWrong: ":thinking:  Something went wrong. Try again (or @beef).",
			timeout: `:sleeping: Interaction timed out. (${this.msToTimeout / 1000}s)`,
			cancel: ":boom: This action was cancelled.",
			success: ":thumbsup: Done!",
		};

		this.preset = {
			err: {
				content: "\u200B",
				embeds: [new MessageEmbed().setColor(this.col.red).setDescription(this.desc.wentWrong)],
				components: [],
			},

			timeout: {
				content: "\u200B",
				embeds: [new MessageEmbed().setColor(this.col.red).setDescription(this.desc.timeout)],
				components: [],
			},

			cancelled: {
				content: "\u200B",
				embeds: [new MessageEmbed().setColor(this.col.red).setDescription(this.desc.cancel)],
				components: [],
			},

			success: {
				content: "\u200B",
				embeds: [new MessageEmbed().setColor(this.col.green).setDescription(this.desc.success)],
				components: [],
			},
		};

		this.butt = {
			logo: new MessageButton()
				.setCustomId('disabledButton')
				.setLabel("")
				.setStyle(2)
				.setEmoji({ id: this.brand.logoEmojiID, name:this.brand.logoEmojiName })
				.setDisabled(),
		};

		this.ar = {
			confirm: new MessageActionRow()
				.addComponents(

					new MessageButton()
						.setCustomId('yes')
						.setLabel("")
						.setStyle(3)
						.setEmoji({ id: null, name:"✅" }),

					this.butt.logo,

					new MessageButton()
						.setCustomId('no')
						.setLabel("")
						.setStyle(4)
						.setEmoji({ id: null, name:"⛔" }),
				),
		};
	}

	matchInfo(match)
	{
		let t1mentions = "";
		let t2mentions = "";

		// https://bobbyhadz.com/blog/javascript-format-date-yyyy-mm-dd-hh-mm-ss

		const d = match.date;

		for (const player of match.team1) { t1mentions += "<@" + player + ">\n"; }
		for (const player of match.team2) { t2mentions += "<@" + player + ">\n"; }

		return new MessageEmbed()
			.setColor(this.col.blue)
			.setTitle("Match Overview")
			.setDescription(match.date ? formatDate(d) : "no date/time recorded.")
			.addFields(
				{ name: 'Team 1', value:t1mentions, inline: false },
				{ name: 'Team 2', value:t2mentions, inline: false },
			);
	}

	completedMatchInfo(match)
	{
		let t1mentions = "";
		let t2mentions = "";

		for (const player of match.team1) { t1mentions += "➤ <@" + player + ">\n"; }
		for (const player of match.team2) { t2mentions += "➤ <@" + player + ">\n"; }

		const pic = {
			// unused. size not standard
			trophy: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/twitter/322/trophy_1f3c6.png",

			win: "https://cdn.discordapp.com/attachments/977020367937875998/977072757324021810/crown100.png",

			// blank png, space holder
			loss: "https://cdn.discordapp.com/attachments/960379192149704715/977078682009096232/v1.png",

			// top embed filler pic for the swag
			boom: "https://cdn.discordapp.com/attachments/977082266696183819/977099315770171432/305x5.png",
		};

		const filler = "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀";

		const topEmbed = new MessageEmbed()
			.setColor(this.col.white)
			.setTitle('**Match Completed**')
		// .setDescription((match.date ? `Queued at:⠀ ${formatDate(match.date)}\n` : "*(No start date found)*\n")+`Reported by: <@${match.reporter}>`)
			.setDescription("**Queuetime**: " + (match.date ? `${formatDate(match.date)}` : "(No start date found)") + `\n**Reporter**: <@${match.reporter}>\n**MatchID**: ${match["_id"]}`)
			.setThumbnail(pic.boom)
				// .setTimestamp()
				// .setFooter({ text: `Match ID:${match["_id"]}\nCurrent time:` })
				;

		const team1embed =
			new MessageEmbed()
				.setColor(match.winner == "1" ? this.col.yellow : this.col.dark)
				.setDescription(filler + "\n" + t1mentions)
				.setThumbnail(match.winner == "1" ? pic.win : pic.loss)
				;

		const team2embed =
			new MessageEmbed()
				.setColor(match.winner == "2" ? this.col.yellow : this.col.dark)
				.setDescription(filler + "\n" + t2mentions)
				.setThumbnail(match.winner == "2" ? pic.win : pic.loss);

		// return embed with winning team on top of loser in bot's gamelog message
		// for the aesthetic
		if (match.winner == "1")
		{
			return [topEmbed, team1embed, team2embed];
		}
		else
		{
			return [topEmbed, team2embed, team1embed];
		}
	}
}

module.exports = new bEmbed();

function padTo2Digits(num)
{
	return num.toString().padStart(2, '0');
}

function formatDate(date)
{
	return (
		[
			padTo2Digits(date.getDate()),
			padTo2Digits(date.getMonth() + 1),
			date.getFullYear(),
		].join('-') +
		' ' +
		[
			padTo2Digits(date.getHours()),
			padTo2Digits(date.getMinutes()),
			padTo2Digits(date.getSeconds()),
		].join(':')
	);
}