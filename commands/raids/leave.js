"use strict";

const Commando = require('discord.js-commando'),
	Gym = require('../../app/gym'),
	Raid = require('../../app/raid'),
	Utility = require('../../app/utility');

class LeaveCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'leave',
			group: 'raids',
			memberName: 'leave',
			aliases: ['part'],
			description: 'Can\'t make it to a raid? no problem, just leave it.',
			details: 'Use this command to leave a raid if you can no longer attend.  Don\'t stress, these things happen!',
			examples: ['\t!leave', '\t!part'],
			args: [
				{
					key: 'raid_id',
					label: 'raid id',
					prompt: 'What is the ID of the raid you wish to leave?',
					type: 'raid'
				}
			],
			guildOnly: true
		});

		client.dispatcher.addInhibitor(message => {
			if (message.command.name === 'leave' && !Gym.isValidChannel(message.channel.name)) {
				message.reply('Leave a raid from its raid channel!');
				return true;
			}
			return false;
		});
	}

	async run(message, args) {
		const raid_id = args['raid_id'],
			info = Raid.removeAttendee(raid_id, message.member.id);

		if (!info.error) {
			message.react('👍')
				.catch(err => console.log(err));

			Utility.cleanConversation(message);

			// get previous bot message & update
			await Raid.refreshStatusMessages(info.raid);
		} else {
			message.reply(info.error)
				.catch(err => console.log(err));
		}
	}
}

module.exports = LeaveCommand;
