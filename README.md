# Jahzo
A matchmaking bot allowing for quick private-match queueing for games of up to 6 players (1v1, 2v2, or 3v3). Includes several easy-to-use commands for match creation and reporting (W/L), all collected match and player data is stored and retrievable from a MongoDB database (not included in this repo).

This bot was used to entirely automate the creation of random teams for private Rocket League scrimmages, as creating fair teams and assigning players to the correct voice channels was taking a few minutes between each match and had become tedious. Jahzo cut the time wasted between matches from 1-3 minutes to less than 5 seconds.

### Usage
- Once the bot is running and added to a discord server with admin permissions, an admin (has administrator permission in the server) has to run the `/admin buildchannels` command prior to use to create the neccessary voice and text channels for jahzo to run and post logs for games.
- All participants must join the created `Q` voice channel, then any player runs the `/q` (queue) command. Jahzo will automatically assign fair teams, and move each player to their respective teams' voice channel.
- Once the played match concludes, any player participating in the match can run `/r` (report) to report the match outcome.
  - Once a match is reported, all player ELOs will be adjusted as needed, match data will be saved to the database and posted to the `#game-log` channel, and all players in the team voice channels will be automatically moved back to the `Q` voice channel for easy re-queueing or match discussion as desired.
 
- Users can also check anyone's profile with `/elo` and change their own nicknames with `/nick` if desired
