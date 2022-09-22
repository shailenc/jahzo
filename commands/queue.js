/* eslint-disable semi */
/* eslint-disable brace-style */
/* eslint-disable space-before-blocks */
/* eslint-disable indent */
const { SlashCommandBuilder, strikethrough } = require('@discordjs/builders');
const { RichPresenceAssets, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

const { Guilds, Matches, client } = require("../mongo/mongo.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('run some games')
        .addSubcommand(subcommand =>
            subcommand
                .setName("move")
                .setDescription("Move all players back to 'Q' voice channel.")
                .addStringOption(option =>
                    option.setName('location')
                        .setDescription('(Optional) Where to move all inhouse users. Moves all to Q if unspecified.')
                        .setRequired(false)
                        .addChoice('Q', 'q')
                        .addChoice('team VCs', 'teams'),
                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("start")
                .setDescription("Generate random teams for an in-house and move players to respective voice channels.")
                .addStringOption(option =>
                    option.setName('gamemode')
                        .setDescription('(Optional) Gamemode. Defaults to 3v3 if nothing specified.')
                        .setRequired(false)
                        .addChoice('1v1', '1')
                        .addChoice('2v2', '2')
                        .addChoice('3v3', '3')
                        .addChoice('4v4', '4'),
                ),
        ),

    async execute(interaction)
    {
        if (!interaction.guild.available)
        {
            return interaction.reply('guildinfo not available ;-;');
        } else
        {

            if (!interaction.options.getSubcommand())
            {
                // if no subcommand called, perishing simulator the interaction
                return interaction.reply({ content: "Pick an action. You can't just do '/sixmans' without other parameters.", ephemeral: true });

                //
                // OPTION TO BRING ALL MEMBERS IN INHOUSE-VCs TO THE 'Q' VC
                //
            } else if (interaction.options.getSubcommand() === "move")
            {
                // bring all sixmanners into the chosen voice channel(s).

                if (interaction.options.getString('location') == "teams")
                {
                    // check if command caller has any unfinished matches to find team lists for moving people to respective voice channels -- if not then reply
                    const game = await Matches.fetchUnfinishedMatch(interaction.member.id);

                    if (!game)
                    {
                        return interaction.reply({ content: "You don't have an active game running. Try /q start if you're trying to generate teams. (or try /q for a quicker 3v3 queue)", ephemeral: true });
                    }


                    const channelIDs = await Guilds.fetchGuildInhouseIDs(interaction.guild.id);
                    const queueVc = await interaction.guild.channels.fetch(channelIDs.queue);

                    if (!queueVc.members.has(interaction.member.id))
                    {
                        return interaction.reply({ content: "Join the 'Q' vc then try again.", ephemeral: true });
                    }

                    // check if all players still in Q voice chat
                    const people = queueVc.members.map((user) => user.id);
                    const players = game.team1.concat(game.team2);

                    let missingPlayerMentions = "";

                    players.forEach((uid) =>
                    {
                        if (!people.includes(uid))
                        {
                            missingPlayerMentions += `<@${uid}> `;
                        }
                    });

                    if (missingPlayerMentions != "")
                    {
                        return interaction.reply({ content: `people in Q vc:${people.map((id) => "<@" + id + ">")}\npeople we should have:${players.map((id) => "<@" + id + ">")}\nMissing players:\n${missingPlayerMentions}`, ephemeral: true });
                    }


                }

                const channelIDs = await Guilds.fetchGuildInhouseIDs(interaction.guild.id);
                const category = await interaction.guild.channels.fetch(channelIDs.category);

                try
                {
                    category.children.forEach(channel =>
                    {
                        if (channel.isVoice())
                        {
                            channel.members.forEach(user => user.voice.setChannel(channelIDs.queue));
                        }
                    });

                    const mbed = new MessageEmbed().setTitle("aight").setDescription(":bread: :bread: :bread: done :bread: :bread: :bread: ").setColor('#4b7bec');
                    return await interaction.reply({ embeds: [mbed] });

                } catch {
                    const mbed = new MessageEmbed().setTitle("ayo").setDescription("something dun goofed").setColor('#fc5c65');
                    return interaction.reply({ embeds: [mbed] });
                }


                //
                // START SIXMANS GAME, MOVE ALL INTO TEAMCHATS IF VALID
                //
            } else if (interaction.options.getSubcommand() === "start")
            {
                // queue everyone into respective random voice chats

                const channelIDs = await Guilds.fetchGuildInhouseIDs(interaction.guild.id);

                // default to 3v3 if no gamemode specified
                const playersPerTeam = interaction.options.getString('gamemode') ? Number(interaction.options.getString('gamemode')) : 3;

                const queueVc = await interaction.guild.channels.fetch(channelIDs.queue);

                if (!queueVc.members.has(interaction.member.id))
                {
                    return interaction.reply({ content: "Join the 'Q' vc then try again.", ephemeral: true });
                } else
                {

                    // people in the 'Q' VC
                    const people = queueVc.members;

                    if (people.size < playersPerTeam * 2)
                    {
                        return interaction.reply({ content: `Not enough players. (Minimum of ${playersPerTeam * 2}, need ${playersPerTeam * 2 - people.size} more)`, ephemeral: true });

                    } else
                    {

                        // check if all players are eligible (ie arent in any unreported matches)
                        if (people.size < 6)
                        {
                            // becomes string of discordIDs of all players with unreported matches
                            let ineligiblePlayerMentions = "";

                            // discord ID list of all users in the 'Q' voice channel
                            const gamerIDs = people.map((person) => person.id);

                            // check if all players are eligible (aka arent in any unreported matches)
                            for (const id of gamerIDs)
                            {
                                // check for reported matches, if there is one then add to list to give to command caller on reply
                                const unreportedMatches = await Matches.fetchUnfinishedMatch(id);

                                if (unreportedMatches)
                                {
                                    ineligiblePlayerMentions += "<@" + id + ">";
                                }
                            }

                            // if ineligible, then cancel queue and send list of ineligible players in a message
                            if (ineligiblePlayerMentions != "")
                            {
                                return interaction.reply({ content: `The following players are part of a match that is currently unreported and cannot join a queue until their active games are reported/cancelled.\n${ineligiblePlayerMentions}` });
                            }
                        }

                        // move people to appropriate VCs, log team assignments
                        const playerAssignments = {
                            team1: [],
                            team2: [],
                            spec: [],
                        };

                        // move remaining (non-spectator) players to random team, log their team and move them into the respective voice channel
                        try
                        {
                            // returns list of spectators
                            // number of spectators in list is amount s.t. 6 players remain unassigned to a team after spectator assignment
                            const spectators = people.size > PLAYERS_PER_TEAM * 2 ? people.randomKey(people.size - 2 * PLAYERS_PER_TEAM) : 0;

                            if (spectators)
                            {
                                for (const uid of spectators)
                                {
                                    people.get(uid).voice.setChannel(channelIDs.spectator);
                                    playerAssignments.spec.push(uid);
                                    people.delete(uid);
                                }
                            }

                            // from remaining (non-spectator) players in list, randomly assign them to a team and move them to their respective voice channels
                            const blueIDs = people.randomKey(PLAYERS_PER_TEAM);
                            for (const uid of blueIDs)
                            {
                                people.get(uid).voice.setChannel(channelIDs.team1);
                                playerAssignments.team1.push(uid);
                                people.delete(uid);
                            }

                            const orangeIDs = people.randomKey(PLAYERS_PER_TEAM);
                            for (const uid of orangeIDs)
                            {
                                people.get(uid).voice.setChannel(channelIDs.team2);
                                playerAssignments.team2.push(uid);
                                people.delete(uid);
                            }

                        } catch {
                            return interaction.reply(":thinking: Something went wrong in moving users to voice channels.");
                        }

                        if (playersPerTeam != 3)
                        {
                            return interaction.reply({ content: "gl. (match not 3v3 therefore not added to db)", ephemeral: true });
                        }

                        // create match in db
                        try
                        {

                            const createdMatch = await Matches.createNewMatch(interaction.member.id, playerAssignments);

                            const gamelogchannel = await interaction.guild.channels.fetch(channelIDs.gamelogs);

                            let team1mentions = "";
                            let team2mentions = "";

                            playerAssignments.team1.forEach((value) => team1mentions += `<@${value}>\n`);
                            playerAssignments.team2.forEach((value) => team2mentions += `<@${value}>\n`);

                            await gamelogchannel.send(`WOO HERES TEAM 1\n${team1mentions}\nNOW HERES TEAM2\n${team2}`);

                            await interaction.reply({ content: `Teams generated! GLHF :t_rex:\nMatch ID: ${createdMatch._id}`, ephemeral: true });
                        } catch {
                            return interaction.reply(":thinking: Something went wrong when trying to update the database.");
                        }
                    }
                }

            } else
            {
                // if somehow subcommand doesn't exist
                return interaction.reply({ content: "That isn't a command. Try again :deciduous_tree: :sauropod:", ephemeral: true });
            }

        }
    },
};
