// Import env config
require('dotenv').config();

// Host discsord bot in hosting
const express = require('express');
const express_app = express();
const express_port = 3000;

express_app.get('/', (req, res) => {
    res.send('Server is running.')
});

express_app.listen(express_port, () => {
    console.log(`Server is running at port ${express_port}`)
});

// Discord Coding
const { Client, IntentsBitField } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildInvites,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.MessageContent
    ]
});

const config = process.env;

client.on('ready', async (cl) => {
    console.log(`Bot ${cl.user.tag} is running.`)
});

client.on('messageCreate', async (msg) => {

    if (msg.author.bot) return;

    const channel = client.channels.cache.get(msg.channelId);

    if (msg.channelId == config.LOG_CHANNEL) {
        if (msg.content.startsWith('!rm-allInvite')) {
            const guild = msg.guild;
            if (guild) {
                try {
                    const invites = await guild.invites.fetch();
                    invites.forEach((invite) => {
                        invite.delete()
                        console.log(`Remove invite code: ${invite.code}`)
                    });
                    console.log(`Total: ${invites.size}`);
                    // msg.reply(`Remove total: **${invites.size}** code`);
                    setTimeout(() => {
                        msg.delete();
                    }, 2000);
                } catch (err) {
                    console.log(err);
                }
            }
        } else if (msg.content.startsWith('!create-invite')) {
            const invite = await channel.createInvite({
                maxAge: 86400,
                maxUses: 1,
            });
            console.log(`Invite create: ${invite.url}`)
            setTimeout(() => {
                msg.delete();
            }, 2000);
        }
    }

});

client.on('inviteCreate', async (invite) => {
    if (invite) {

        const channel = client.channels.cache.get(config.LOG_CHANNEL)

        const date_create = new Date(invite.createdTimestamp);
        const date_create_format = {
            date: date_create.getDate(),
            month: date_create.getMonth(),
            year: date_create.getFullYear(),
            hour: String(date_create.getHours()).padStart(2, '0'),
            minute: String(date_create.getMinutes()).padStart(2, '0'),
            second: String(date_create.getSeconds()).padStart(2, '0')
        }

        const date_expire = new Date(invite.expiresTimestamp);
        const date_expire_format = {
            date: date_expire.getDate(),
            month: date_expire.getMonth(),
            year: date_expire.getFullYear(),
            hour: String(date_expire.getHours()).padStart(2, '0'),
            minute: String(date_expire.getMinutes()).padStart(2, '0'),
            second: String(date_expire.getSeconds()).padStart(2, '0')
        }

        let danger_invite = {
            color: 0x00FF00,
            danger: false
        };

        if (invite.inviterId == config.DANGER_INVITE || invite.inviterId == config.BOSS_ACCOUNT_BANNED) {
            danger_invite.color = 0xFF0000
            danger_invite.danger = true
        }

        const embed = new EmbedBuilder()
            .setColor(danger_invite.color)
            .setTitle('Invite Detect!! (Create)')
            .addFields(
                { name: 'Invite Code', value: `${invite.code}`, inline: true },
                { name: 'Invite Author', value: `<@${invite.inviterId}>`, inline: true },
                { name: 'Invite Link', value: `https://discord.gg/${invite.code}`, inline: true },
                { name: 'Create At', value: `${date_create_format.date}/${date_create_format.month}/${date_create_format.year} ${date_create_format.hour}:${date_create_format.minute}:${date_create_format.second}`, inline: true },
                { name: 'Expired At', value: `${date_expire_format.date}/${date_expire_format.month}/${date_expire_format.year} ${date_expire_format.hour}:${date_expire_format.minute}:${date_expire_format.second}`, inline: true },
                { name: 'Danger (Optional)', value: `${danger_invite.danger}`, inline: true },
            )
            .setTimestamp(invite.createdTimestamp)
            .setFooter({ text: 'Developed by JNP', iconURL: 'https://media.discordapp.net/attachments/966527454200070185/993100139109564436/jp.png' });

        if (danger_invite.danger) {
            await invite.delete()
            channel.send({ content: `<@&1159176845766434836>`, embeds: [embed] })
        } else {
            channel.send({ embeds: [embed] });
        }

    }
});

client.on('inviteDelete', async (invite) => {
    if (invite) {

        const channel = client.channels.cache.get(config.LOG_CHANNEL)

        const current_time = new Date();
        const current_time_format = {
            date: current_time.getDate(),
            month: current_time.getMonth(),
            year: current_time.getFullYear(),
            hour: String(current_time.getHours()).padStart(2, '0'),
            minute: String(current_time.getMinutes()).padStart(2, '0'),
            second: String(current_time.getSeconds()).padStart(2, '0')
        }

        const embed = new EmbedBuilder()
            .setColor(0x0000FF)
            .setTitle('Invite Detect!! (Delete)')
            .addFields(
                { name: 'Invite Link', value: `https://discord.gg/${invite.code}`, inline: true },
                { name: 'Expire Time', value: `${current_time_format.date}/${current_time_format.month}/${current_time_format.year} ${current_time_format.hour}:${current_time_format.minute}:${current_time_format.second}`, inline: true },
            )
            .setTimestamp(invite.createdTimestamp)
            .setFooter({ text: 'Developed by JNP', iconURL: 'https://media.discordapp.net/attachments/966527454200070185/993100139109564436/jp.png' });

        channel.send({ embeds: [embed] });

    }
});

client.on('voiceStateUpdate', async (oldState, newState) => {

    // Disconnected
    if (oldState.channelId && !newState.channelId) {
        const userName = newState.member.user.tag;
        const channelName = oldState.channel.name;

        // console.log(`${userName} disconnected from the voice channel: ${channelName}`);
    }

    // Connected
    if (!oldState.channelId && newState.channelId) {
        const userName = newState.member.user.tag;
        const channelName = newState.channel.name;

        if (newState.member.user.id == config.BOSS_ACCOUNT_BANNED) {
            setTimeout(() => {
                newState.disconnect(`Banned member`); // Disconnect user
                // newState.setChannel(config.BANNED_CHANNEL, 'Banned Channel') // Move user
            }, 3000);
        }
        // console.log(`${userName} joined the voice channel: ${channelName}`);
    }

});

client.login(config.DISCORD_TOKEN);