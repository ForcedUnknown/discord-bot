"use strict";

const Commando = require('discord.js-commando'),
	Constants = require('../../app/constants'),
	Gym = require('../../app/gym'),
	Raid = require('../../app/raid'),
	Utility = require('../../app/utility');

class CheckOutCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'check-out',
			group: 'raids',
			memberName: 'check-out',
			aliases: ['depart'],
			description: 'Let others know you have gone to the wrong location.',
			details: 'Use this command in case you thought you were at the right location, but were not.',
			examples: ['\t!check-out', '\t!checkout'],
			args: [
				{
					key: 'raid_id',
					label: 'raid id',
					prompt: 'What is the ID of the raid you wish to check out of?',
					type: 'raid'
				}
			],
			guildOnly: true
		});

		client.dispatcher.addInhibitor(message => {
			if (message.command.name === 'check-out' && !Gym.isValidChannel(message.channel.name)) {
				message.reply('Check out of a raid from its raid channel!');
				return true;
			}
			return false;
		});
	}

	async run(message, args) {
		const raid_id = rags['raid_id'],
			info = Raid.setMemberStatus(raid_id, message.member.id, Constants.RaidStatus.INTERESTED);

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

module.exports = CheckOutCommand;
