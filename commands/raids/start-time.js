"use strict";

const Commando = require('discord.js-commando'),
	Gym = require('../../app/gym'),
	Raid = require('../../app/raid'),
	Utility = require('../../app/utility');

class StartTimeCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'start-time',
			group: 'raids',
			memberName: 'start-time',
			aliases: ['start', 'starts'],
			description: 'Set the time the raid will begin.',
			details: 'Use this command to finalize plans for fighting a raid boss.  If possible, try to set times 20 minutes out and always try to arrive at least 5 minutes before the start time being set.',
			examples: ['\t!start-time 2:20pm', '\t!start \'30 minutes\''],
			args: [
				{
					key: 'raid_id',
					label: 'raid id',
					prompt: 'What is the ID of the raid you wish to set the start time for?',
					type: 'raid'
				},
				{
					key: 'start-time',
					label: 'start time',
					prompt: 'What time do you wish to begin this raid?\nExamples: `8:43`, `2:20pm`, `30 minutes`',
					type: 'time',
					min: 'absolute'
				}
			],
			guildOnly: true
		});

		client.dispatcher.addInhibitor(message => {
			if (message.command.name === 'start-time' && !Gym.isValidChannel(message.channel.name)) {
				message.reply('Set the start time of a raid from its raid channel!');
				return true;
			}
			return false;
		});
	}

	async run(message, args) {
		const raid_id = args['raid_id'],
			start_time = args['start-time'],
			info = Raid.setRaidStartTime(raid_id, start_time);

		message.react('👍')
			.catch(err => console.log(err));

		const total_attendees = Raid.getAttendeeCount(info.raid),
			verb =
				total_attendees === 1 ?
					'is' :
					'are',
			noun =
				total_attendees === 1 ?
					'trainer' :
					'trainers';


		// notify all attendees that a time has been set
		for (let i = 0; i < info.raid.attendees.length; i++) {
			let member_id = info.raid.attendees[i];

			// no reason to spam the person who set the time, telling them the time being set haha
			if (member_id !== message.member.id) {
				Raid.getMember(member_id)
					.then(member => member.send(
						`A start time has been set for ${raid_id} @ **${info.raid.start_time}**. ` +
						`There ${verb} currently **${total_attendees}** ${noun} attending!`))
					.catch(err => console.log(err));
			}
		}

		Utility.cleanConversation(message);

		await Raid.refreshStatusMessages(info.raid);
	}
}

module.exports = StartTimeCommand;
