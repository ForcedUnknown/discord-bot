"use strict";

const Commando = require('discord.js-commando'),
	Gym = require('../../app/gym'),
	Raid = require('../../app/raid');

class StatusCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'status',
			group: 'raids',
			memberName: 'status',
			description: 'Gets an update on a single raid, or lists all the raids available in the channel (context-sensitive).',
			details: 'Use this command when trying to figure out what raids are available or the status of a raid being planned.  NOTE: This does not get all of the raids in the entire discord, it is channel specific.',
			examples: ['\t!status'],
			guildOnly: true,
			argsType: 'multiple'
		});

		client.dispatcher.addInhibitor(message => {
			if (message.command.name === 'status' && !Gym.isValidChannel(message.channel.name)) {
				message.reply('Check out of a raid from its raid channel!');
				return true;
			}
			return false;
		});
	}

	async run(message, args) {
		if (!Raid.validRaid(args[0])) {
			message.channel.send(Raid.getRaidsFormattedMessage(message.channel.id))
				.catch(err => console.log(err));
		} else {
			const raid_id = args[0],
				raid = Raid.getRaid(raid_id),
				formatted_message = await Raid.getFormattedMessage(raid);

			// post a new raid message
			message.channel.send(Raid.getRaidIdMessage(raid), formatted_message)
				.then(status_message => {
					Raid.addMessage(raid_id, status_message);
				})
				.catch(err => console.log(err));
		}
	}
}

module.exports = StatusCommand;
