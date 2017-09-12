"use strict";

const Commando = require('discord.js-commando'),
	Gym = require('../../app/gym'),
	Raid = require('../../app/raid'),
	Utility = require('../../app/utility');

class TimeRemainingCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'time-left',
			group: 'raids',
			memberName: 'time-left',
			aliases: ['left', 'time-remaining', 'remaining', 'remain', 'end-time', 'ends', 'end'],
			description: 'Sets the time that the raid will cease to exist.',
			details: 'Use this command to set remaining time on a raid.',
			examples: ['\t!time-left 1:45', '\t!remain 50'],
			args: [
				{
					key: 'raid_id',
					label: 'raid id',
					prompt: 'What is the ID of the raid you wish to set the time remaining for?',
					type: 'raid'
				},
				{
					key: 'time-left',
					label: 'time left',
					prompt: 'How much time is remaining on the raid (use h:mm or mm format)?\nExample: `1:43`',
					type: 'time',
					min: 'relative'
				}
			],
			argsPromptLimit: 3,
			guildOnly: true
		});

		client.dispatcher.addInhibitor(message => {
			if (message.command.name === 'time-left' && !Gym.isValidChannel(message.channel.name)) {
				message.reply('Set the end time for a raid from its raid channel!');
				return true;
			}
			return false;
		});
	}

	async run(message, args) {
		const raid_id = args['raid_id'],
			time = args['time-left'],
			info = Raid.setRaidEndTime(raid_id, time);

		message.react('👍')
			.catch(err => console.log(err));

		Utility.cleanConversation(message);

		await Raid.refreshStatusMessages(info.raid);
	}
}

module.exports = TimeRemainingCommand;
