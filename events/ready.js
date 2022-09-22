const statuses = [
	"hack jarlow",
	"ten shots one goal",
	"Human Simulator 2022® Deluxe",
	"onemans ;-;",
	"pasta extrusion (with bronze dye)",
	"this car clangs",
	"muy trollando",
	"EUUUUUUUH",
];

const status = statuses[Math.round(Math.random()*(statuses.length-1))];

module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		console.log(`::: Ready! Logged in as ${client.user.tag}`);
		client.user.setPresence(
			{
				type: "PLAYING",
				activities: [{
					name: status
				}],
				emoji: client.emojis.cache.find(h => h.name == "sauropod")
			}
		);

	},
};