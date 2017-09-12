"use strict";

const Commando = require('discord.js-commando'),
	Raid = require('../app/raid');

class RaidType extends Commando.ArgumentType {
	constructor(client) {
		super(client, 'raid');
	}

	validate(value, message, arg) {
		const valid = Raid.validRaid(value);

		if (!valid) {
			message.reply(Raid.getRaidsFormattedMessage(message.channel.id));
		}

		return valid;
	}

	parse(value, message, arg) {
		return value;
	}
}

module.exports = RaidType;