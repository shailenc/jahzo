const { MongoClient } = require('mongodb');
const Players = require('./players.js');
const Guilds = require('./guilds.js');
const Match = require('./matches.js');

class MongoBot {
	constructor() {
		const url = "mongodb://0.0.0.0:27017/";

		this.client = new MongoClient(url);
	}
	async init() {
		await this.client.connect();
		console.log('::: Connected to the db');

		this.db = this.client.db("rlbot");

		this.Players = new Players(this.db);
		this.Guilds = new Guilds(this.db);
		this.Matches = new Match(this.db);
	}
}

module.exports = new MongoBot();