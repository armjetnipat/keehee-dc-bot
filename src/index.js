// Import env config
require('dotenv').config();

const fs = require('node:fs');

// Host discsord bot in hosting
const express = require('express');
const express_app = express();
const express_port = 3000;
const url_file = require('./url.json');

express_app.use(express.json())

express_app.get('/', (req, res) => {
    res.send('Server is running.')
});

express_app.post('/shorten', async (req, res) => {

    const fullUrl = req.query.fullUrl
    const shortUrl = req.query.shortUrl

    const jsonData = fs.readFileSync('src/url.json', 'utf-8');
    const url_data = JSON.parse(jsonData);

    for (const shortenUrl in url_data) {
        if (shortUrl == shortenUrl) {
            return res.sendStatus(406)
        }
    }

    url_data[shortUrl] = fullUrl;
    const updatedJsonData = JSON.stringify(url_data, null, 2);
    fs.writeFileSync('src/url.json', updatedJsonData, 'utf-8');
    return res.sendStatus(200)
});

express_app.get('/:shortenUrl', async (req, res) => {
    const shortUrl = req.params.shortenUrl
    for (const shortenUrl in url_file) {
        if (shortUrl == shortenUrl) {
            return res.redirect(url_file[shortenUrl])
        }
    }
    return res.sendStatus(404)
});

express_app.listen(express_port, () => {
    console.log(`Server is running at port ${express_port}`)
});

// Discord Coding
const { Client, IntentsBitField, ActivityType, Partials, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildInvites,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.DirectMessages
    ],
    partials: [
        Partials.Channel,
        Partials.Message
    ]
});

var config = require('./config.json');

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

function get_time() {
    var now = new Date();
    var current_time = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Bangkok"}));
    return {
        date: current_time.getDate(),
        month: current_time.getMonth(),
        year: current_time.getFullYear(),
        hour: String(current_time.getHours()).padStart(2, '0'),
        minute: String(current_time.getMinutes()).padStart(2, '0'),
        second: String(current_time.getSeconds()).padStart(2, '0')
    };
}

function generateRandomString(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

client.on('ready', async (cl) => {
    console.log(`Bot ${cl.user.tag} is running.`);
    client.user.setActivity('seawsus', { type: ActivityType.Streaming, url: 'https://www.youtube.com/watch?v=_e9yMqmXWo0' });

    const commandData = {
        name: 'url',
        description: 'Custom Shorten URL',
        options: [
            {
                name: 'full',
                description: 'Full URL Link',
                type: 3,
                required: true
            },
            {
                name: 'short',
                description: 'Shorten URL',
                type: 3,
                required: false
            }
        ]
    }

    const guild = cl.guilds.cache.get('1139177951607410728');
    guild.commands.create(commandData)
        .then(command => console.log(`Slash command created: ${command.name}`))
        .catch(console.error);

});

client.on('messageCreate', async (msg) => {

    if (msg.channel.type == 1) {
        if (msg.content.startsWith('!คน')) {
            const guild = client.guilds.cache.get('1139177951607410728');

            const voiceChannel = guild.channels.cache.get('1184554702994690118')
            const voiceMembers = voiceChannel.members;

            if (voiceMembers.size === 0) {
                // msg.reply('No members in the voice channel.');
                return;
            }

            
            const usersInVoiceChannel = voiceMembers.map(member => ({
                user: member.user.tag + '\n'
            }));

            const users_in_channel = []

            for (const user of usersInVoiceChannel) {
                users_in_channel.push(user.user)
            }

            var formated_users = users_in_channel.reduce(function(pre, next) {
                return pre + ' ' + next;
            });

            msg.reply(`คนที่อยู่ในดิสตอนนี้มี ${voiceMembers.size} คน คือ:\n\n${formated_users}`);
        }
    }

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

client.on('interactionCreate', async (interaction) => {

    if (interaction.isChatInputCommand()) {
        if (interaction.commandName == 'url') {
            const fullUrl = interaction.options.getString('full');
            const shortUrl = interaction.options.getString('short') || generateRandomString(4);
            const jsonData = fs.readFileSync('src/url.json', 'utf-8');
            const url_data = JSON.parse(jsonData);

            for (const shortenUrl in url_data) {
                if (shortUrl == shortenUrl) {
                    return interaction.reply('Shorten URL is already exist')
                }
            }

            url_data[shortUrl] = fullUrl;
            const updatedJsonData = JSON.stringify(url_data, null, 2);
            fs.writeFileSync('src/url.json', updatedJsonData, 'utf-8');
            return interaction.reply('Shorten URL has been created: ' + 'https://jokeped.net/' + shortUrl);
        }
    }

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
                { name: 'Expired At', value: `${current_time_format.date}/${current_time_format.month}/${current_time_format.year} ${current_time_format.hour}:${current_time_format.minute}:${current_time_format.second}`, inline: true },
            )
            .setTimestamp(invite.createdTimestamp)
            .setFooter({ text: 'Developed by JNP', iconURL: 'https://media.discordapp.net/attachments/966527454200070185/993100139109564436/jp.png' });

        channel.send({ embeds: [embed] });

    }
});

let voice_user = [];
const dis_user = config.disconnect_voice;

setInterval( async () => {

    let current_time = get_time().hour + ':' + get_time().minute;
    for (const user_id in dis_user) {

        if (voice_user[user_id]) {
            const member = await client.guilds.cache.get('1139177951607410728').members.fetch({ user: user_id, force: true });
            if (dis_user[user_id].indexOf(current_time) !== -1) {
                if (member.voice.channel) {
                    member.voice.disconnect();
                }
            }
        }

    }
}, 2000);

client.on('voiceStateUpdate', async (oldState, newState) => {

    // Disconnected
    if (oldState.channelId && !newState.channelId) {
        const targetMember = newState.member;
        const channelName = oldState.channel.name;

        voice_user = voice_user.filter(user_id => user_id !== targetMember.user.id);

        // console.log(`${userName} disconnected from the voice channel: ${channelName}`);
    }

    // Connected
    if (!oldState.channelId && newState.channelId) {
        const targetMember = newState.member;
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

            return channel.send({ content: `<@&1159176845766434836>`, embeds: [embed] })
        }

        voice_user[targetMember.user.id] = true;

        // console.log(`${userName} joined the voice channel: ${channelName}`);

    }

});

client.login(process.env['discord_token']);