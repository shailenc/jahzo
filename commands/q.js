/* eslint-disable semi */
/* eslint-disable brace-style */
/* eslint-disable space-before-blocks */
/* eslint-disable indent */
const { SlashCommandBuilder, strikethrough } = require('@discordjs/builders');
const { RichPresenceAssets, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { Guilds, Matches, client } = require("../mongo/mongo.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('q')
        .setDescription('Shorthand command for "/queue start 3v3" for speed/convenience purposes.'),

    async execute(interaction)
    {
        if (!interaction.guild.available)
        {
            return interaction.reply('guildinfo not available ;-;');
        }
        else
        {
            // 'q' slash command is for a quick 3v3 queue
            const PLAYERS_PER_TEAM = 3;

            //
            // START SIXMANS GAME, MOVE ALL INTO TEAMCHATS IF VALID
            //

            // fetch list of IDs of the guild's inhouse channels
            const channelIDs = await Guilds.fetchGuildInhouseIDs(interaction.guild.id);


            // check if command caller is in the correct voice channel (default channel name "Q")
            const queueVc = await interaction.guild.channels.fetch(channelIDs.queue);

            // if command caller isn't in the right voice channel, cancel queueing
            if (!queueVc.members.has(interaction.member.id))
            {
                return interaction.reply({ content: "Join the 'Q' vc then try again.", ephemeral: true });
            } else {
                // collection of discord users in the 'Q' VC
                const people = queueVc.members;

                if (people.size < PLAYERS_PER_TEAM * 2)
                {
                    return interaction.reply({ content: `Not enough players. (Minimum of ${PLAYERS_PER_TEAM * 2}, need ${PLAYERS_PER_TEAM * 2 - people.size} more)`, ephemeral: true });

                } else
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

                    // player list for each team
                    const playerAssignments = {
                        team1: [],
                        team2: [],
                        spec: [],
                    };

                    // move all players to respective voice channels, log into playerAssignments
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

                    }
                    catch
                    {
                        // some error happens, just cancels queue. no error logging at the moment (lol)
                        return interaction.reply(":thinking: Something went wrong in moving users to voice channels.");
                    }

                    // create new unreported match in the db
                    try
                    {
                        const createdMatch = await Matches.createNewMatch(interaction.member.id, playerAssignments);

                        await interaction.reply({ content: `Teams generated! GLHF :t_rex:\nMatch ID: ${createdMatch._id}`, ephemeral: true });
                    } catch {
                        return interaction.reply(":thinking: Something went wrong when trying to update the database.");
                    }
                }
            }
        }
    },
};
