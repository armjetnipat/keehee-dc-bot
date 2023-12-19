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
const { Client, IntentsBitField, ActivityType, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
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

// const config = process.env;
var config = require('./config.json');

client.on('ready', async (cl) => {
    console.log(`Bot ${cl.user.tag} is running.`)
    client.user.setActivity('seawsus', { type: ActivityType.Watching })
});

client.on('messageCreate', async (msg) => {

    if (msg.author.bot) return;

    const channel = client.channels.cache.get(msg.channelId);

    if (msg.channelId == config.log_channel.command_channel) {
        if (msg.content.startsWith('!iv-remove')) {
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
                    }, 1000);
                } catch (err) {
                    console.log(err);
                }
            }
        } else if (msg.content.startsWith('!iv-create')) {
            const invite = await channel.createInvite({
                maxAge: 86400,
                maxUses: 1,
            });
            console.log(`Invite create: ${invite.url}`)
            setTimeout(() => {
                msg.delete();
            }, 1000);
        }
    }

});

function isDangerAccont(id) {
    for (let index = 0; index < config.danger_account.length; index++) {
        const danger_acc = config.danger_account[index];
        if (danger_acc == id) {
            return true
        }
    }
    return false
}

function isBannedAccont(id) {
    for (let index = 0; index < config.banned_account.length; index++) {
        const banned_acc = config.banned_account[index];
        if (banned_acc == id) {
            return true
        }
    }
    return false
}

client.on('interactionCreate', async (interaction) => {

    if (interaction.isButton()) {
        if (interaction.customId == 'delete-invite-btn') {
            const inviteCode = interaction.message.embeds[0].fields[0].value;
            const guild = interaction.guild;
            if (guild) {
                try {
                    let btn_text = `Invite link has expired or not found`;
                    const invites = await guild.invites.fetch();
                    await invites.forEach((invite) => {
                        if (invite.code == inviteCode) {
                            invite.delete()
                            btn_text = `Deleted by ${interaction.user.tag}`
                            console.log(`Remove invite code: ${invite.code}`)
                        }
                    });

                    const updated_delete_invite = new ButtonBuilder()
                        .setCustomId('delete-invite-btn')
                        .setLabel(btn_text)
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true)

                    const updatedButton = new ActionRowBuilder().addComponents(updated_delete_invite)

                    const existingEmbed = interaction.message.embeds[0];
                    const updated_embed_invite = new EmbedBuilder(existingEmbed)
                        .setColor(0x555555)

                    await interaction.message.edit({ components: [updatedButton], embeds: [updated_embed_invite] })

                    if (btn_text.startsWith('Deleted')) {
                        interaction.reply({
                            content: `Remove invite code **${inviteCode}** success.`,
                            ephemeral: true
                        });
                    } else {
                        interaction.reply({
                            content: `Invite link has expired or not found`,
                            ephemeral: true
                        });
                    }

                } catch (err) {
                    console.log(err);
                }
            }
        }
    }

})

client.on('inviteCreate', async (invite) => {
    if (invite) {

        const channel = client.channels.cache.get(config.log_channel.invite_create)

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

        if (isDangerAccont(invite.inviterId)) {
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

        const delete_invite = new ButtonBuilder()
            .setCustomId('delete-invite-btn')
            .setLabel('Delete')
            .setStyle(ButtonStyle.Danger)
        
        const invite_button = new ActionRowBuilder().addComponents(delete_invite)

        if (danger_invite.danger) {
            await invite.delete()
            // channel.send({ content: `<@&1159176845766434836>`, embeds: [embed] })
            channel.send({ embeds: [embed] });
        } else {
            channel.send({ embeds: [embed], components: [invite_button] });
        }

    }
});

client.on('inviteDelete', async (invite) => {
    if (invite) {

        const channel = client.channels.cache.get(config.log_channel.invite_delete)

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

        if (isBannedAccont(newState.member.user.id)) {
            newState.setDeaf(true);
            newState.setMute(true);
            setTimeout(() => {
                newState.disconnect(`Banned member`); // Disconnect user
                // newState.setChannel(config.banned_channel, 'Banned Channel') // Move user
            }, 3000);

            const channel = client.channels.cache.get(config.log_channel.banned_join_channel)

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
                .setColor(0xFF0000)
                .setTitle('Member Detect!!')
                .addFields(
                    { name: 'User', value: `<@${newState.member.user.id}>`, inline: true },
                    { name: 'Channel name', value: `${channelName}`, inline: true },
                )
                .setTimestamp()
                .setFooter({ text: 'Developed by JNP', iconURL: 'https://media.discordapp.net/attachments/966527454200070185/993100139109564436/jp.png' });

            channel.send({ content: `<@&1159176845766434836>`, embeds: [embed] })

        }
        // console.log(`${userName} joined the voice channel: ${channelName}`);
    }

});

client.login(config.discord_token);