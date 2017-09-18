"use strict";

const log = require('loglevel').getLogger('StartTimeCommand'),
	Commando = require('discord.js-commando'),
	Raid = require('../../app/raid'),
	Utility = require('../../app/utility');

class StartTimeCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'start-time',
			group: 'raids',
			memberName: 'start-time',
			aliases: ['start', 'starts'],
			description: 'Set the time the raid will begin.  Its exact meaning depends on if the actual raid has begun or not.',
			details: 'Use this command to set when a raid begins.  If it has not hatched, this means setting the time at which it does; it if has, this means setting a planned starting time for the actual raid group.  If possible, try to set times 20 minutes out and always try to arrive at least 5 minutes before the start time being set.',
			examples: ['\t!start-time 2:20pm'],
			args: [
				{
					key: 'start-time',
					label: 'start time',
					prompt: 'What time does this raid begin, or you wish to begin this raid?\nExamples: `8:43`, `2:20pm`',
					type: 'time',
					min: 'absolute'
				}
			],
			guildOnly: true
		});

		client.dispatcher.addInhibitor(message => {
			if (message.command.name === 'start-time' && !Raid.validRaid(message.channel.id)) {
				message.reply('Set the start time of a raid from its raid channel!');
				return true;
			}
			return false;
		});
	}

	async run(message, args) {
		const start_time = args['start-time'],
			info = Raid.setRaidStartTime(message.channel.id, start_time);

		message.react('👍')
			.catch(err => log.error(err));

		const total_attendees = Raid.getAttendeeCount(info.raid),
			verb =
				total_attendees === 1 ?
					'is' :
					'are',
			noun =
				total_attendees === 1 ?
					'trainer' :
					'trainers',
			channel = await Raid.getChannel(info.raid.channel_id)
				.catch(err => log.error(err));

		// notify all attendees that a time has been set
		Object.keys(info.raid.attendees)
			.filter(attendee => {
				// no reason to spam the person who set the time, telling them the time being set
				return attendee !== message.member.id;
			})
			.forEach(attendee => {
				Raid.getMember(message.channel.id, attendee)
					.then(member => member.send(
						`A start time has been set for ${channel.toString()}. ` +
						`There ${verb} currently **${total_attendees}** ${noun} attending!`))
					.catch(err => log.error(err));
			});

		Utility.cleanConversation(message);

		Raid.refreshStatusMessages(info.raid);
	}
}

module.exports = StartTimeCommand;
