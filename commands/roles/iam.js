"use strict";

const log = require('loglevel').getLogger('IAmCommand'),
	Commando = require('discord.js-commando'),
	{CommandGroup} = require('../../app/constants'),
	settings = require('../../data/settings'),
	Helper = require('../../app/helper'),
	Role = require('../../app/role');

class IAmCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'iam',
			group: CommandGroup.ROLES,
			memberName: 'iam',
			aliases: ['assign'],
			description: 'Assign available roles to yourself.',
			details: '?????',
			examples: ['\t!iam Mystic', '\t!role Valor', '\t!assign Instinct'],
			guildOnly: true
		});

		// store a list of message id's spawned from this command, and the page they're on
		this.messages = new Map();

		client.dispatcher.addInhibitor(message => {
			if (!!message.command && message.command.name === 'iam' &&
				!Helper.isBotChannel(message)) {
				return ['invalid-channel', message.reply(Helper.getText('iam.warning', message))];
			}
			return false;
		});

		client.on('messageReactionAdd', (message, user) => {
			this.navigatePage(message, user);
		});

		// clean up messages after 10 minutes of inactivity
		this.update = setInterval(() => {
			const then = Date.now() - 600000;

			this.messages.forEach((value, key, map) => {
				if (then > value.time) {
					value.message.delete()
						.catch(err => log.error(err));
					map.delete(key);
				}
			});
		}, settings.cleanup_interval);
	}

	navigatePage(message, user) {
		if (user.bot || !this.messages.has(message.message.id)) {
			return;
		}

		let current = this.messages.get(message.message.id).current;

		// if no page exists for message, then assume not the right message (as this is a global listener);
		if (isNaN(current)) {
			return;
		}

		if (message.emoji.name === '⬅') {
			if (current > 0) {
				current--;
				this.updatePage(message.message, current);
			}
		} else if (message.emoji.name === '➡') {
			if (current < Math.ceil(Role.count / 5) - 1) {
				current++;
				this.updatePage(message.message, current);
			}
		}

		// remove reaction so that pagination makes a BIT more sense...
		message.remove(user);
	}

	updatePage(message, current) {
		Role.getRoles(message.channel, message.member).then(roles => {
			let count = roles.length;
			const start = current * 5;
			const end = start + 5;

			// making sure no one can go beyond the limits
			if (start > count - 1 || start < 0) {
				return;
			}

			let string = '';
			for (let i = start; i < end; i++) {
				if (!roles[i]) {
					break;
				}

				string += `**${roles[i].value}**\n${(roles[i].description) ? roles[i].description + '\n\n' : ''}`;
			}

			message.edit('Type `!iam <name>` to add one of the following roles to your account.', {
				embed: {
					title: `There are ${count} self assignable roles`,
					description: `${string}`,
					color: 4437377,
					footer: {
						text: `Page ${current + 1} of ${Math.ceil(count / 5)}`
					}
				}
			}).then(bot_message => {
				this.messages.set(bot_message.id, {time: Date.now(), current, message: bot_message});
			});
		}).catch((err) => {
			log.error(err);
		});
	}

	async run(message, args) {
		if (!args.length) {
			// if no arguments were given, send the user a list of roles w/ optional descriptions
			Role.getRoles(message.channel, message.member).then((roles) => {
				let count = roles.length;

				let string = '';
				for (let i = 0; i < Math.min(count, 5); i++) {
					string += `**${roles[i].value}**\n${(roles[i].description) ? roles[i].description + '\n\n' : ''}`;
				}

				message.channel.send(`Type \`${message.client.commandPrefix}iam <name>\` to add one of the following roles to your account.`, {
					embed: {
						title: `There are ${count} self assignable roles`,
						description: `${string}`,
						color: 4437377,
						footer: {
							text: `Page 1 of ${Math.ceil(count / 5)}`
						}
					}
				}).then(bot_message => {
					this.messages.set(bot_message.id, {time: Date.now(), current: 0, message: bot_message});

					bot_message.react('⬅')
						.then(reaction => bot_message.react('➡'))
						.catch(err => log.error(err));
				});
			}).catch((err) => {
				if (err && err.error) {
					message.reply(err.error)
						.catch(err => log.error(err));
				} else {
					log.error(err);
				}
			});
		} else {
			Role.assignRole(message.channel, message.member, args)
				.then(() => message.react(Helper.getEmoji('snorlaxthumbsup') || '👍'))
				.catch(err => {
					if (err && err.error) {
						message.reply(err.error)
							.catch(err => log.error(err));
					} else {
						log.error(err);
					}
				});
		}
	}
}

module.exports = IAmCommand;
