const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Asya2 Bot 7/24 Aktif!'));
app.listen(process.env.PORT || 3000);

const { 
    Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, 
    ButtonStyle, EmbedBuilder, ChannelType, PermissionsBitField 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const TOKEN = process.env.TOKEN;

// --- AYARLAR ---
const HOS_GELDIN_KANAL_ID = '1472014377065517146'; 
const userXP = new Map();
const HIZLI_LINKLER = {
    '!site': 'https://www.asya2.com.tr/',
    '!kayıt': 'https://www.asya2.com.tr/kayit-ol',
    '!indir': 'https://www.asya2.com.tr/oyunu-indir'
};

client.once('ready', () => {
    console.log(`🛡️ ${client.user.tag} aktif!`);
});

// 1. HOŞ GELDİN SİSTEMİ
client.on('guildMemberAdd', async (member) => {
    try {
        const kanal = member.guild.channels.cache.get(HOS_GELDIN_KANAL_ID);
        if (!kanal) return;
        const welcomeEmbed = new EmbedBuilder()
            .setTitle('🛡️ Asya2 Krallığına Hoş Geldin!')
            .setDescription(`Selam ${member}! Sunucumuza hoş geldin!`)
            .setImage('https://cdn.discordapp.com/attachments/1028301267547738244/1473632788745027585/680x240DiscordUstProfil.gif')
            .setColor('#f1c40f');
        kanal.send({ content: `Hoş geldin ${member}! ⚔️`, embeds: [welcomeEmbed] });
    } catch (e) { console.log(e) }
});

// 2. KOMUTLAR
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    const content = message.content.toLowerCase().trim();

    // Linkler
    if (HIZLI_LINKLER[content]) {
        return message.reply(`🔗 **Asya2 Bağlantısı:** ${HIZLI_LINKLER[content]}`);
    }

    // Rank
    let userData = userXP.get(message.author.id) || { xp: 0, level: 1 };
    userData.xp += 10;
    if (userData.xp >= userData.level * 150) {
        userData.level++;
        userData.xp = 0;
        message.reply(`🚀 **Seviye Atladın:** ${userData.level}`);
    }
    userXP.set(message.author.id, userData);

    if (content === '!rank') {
        const rankEmbed = new EmbedBuilder()
            .setTitle(`${message.author.username} Rank`)
            .setDescription(`**Seviye:** ${userData.level}\n**XP:** ${userData.xp}`)
            .setColor('#e74c3c');
        return message.channel.send({ embeds: [rankEmbed] });
    }

    // TICKET KURMA (Emojisiz - En Sağlam Hali)
    if (content === '!ticket-kur' && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const embed = new EmbedBuilder()
            .setTitle('🎫 Asya2 Destek Sistemi')
            .setDescription(`Lütfen ihtiyacınız olan departmanı seçin.\n\n⚠️ Gereksiz talepler kapatılır.\n⚖️ Saygılı bir üslup zorunludur.`)
            .setColor('#2ecc71')
            .setImage('https://cdn.discordapp.com/attachments/1028301267547738244/1473628348335915132/4.webp');

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('t_bug').setLabel('Hata & Bug').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('t_sikayet').setLabel('Şikayet').setStyle(ButtonStyle.Secondary)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('t_takim').setLabel('Takım Başvurusu').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('t_partner').setLabel('Partnerlik').setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({ embeds: [embed], components: [row1, row2] });
    }
});

// 3. BUTON ETKİLEŞİMLERİ
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 't_kapat') {
        await interaction.reply('Kanal siliniyor...');
        return setTimeout(() => interaction.channel.delete().catch(() => {}), 2000);
    }

    try {
        const channel = await interaction.guild.channels.create({
            name: `destek-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
            ],
        });

        await interaction.reply({ content: `Kanal açıldı: ${channel}`, ephemeral: true });

        const closeRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('t_kapat').setLabel('Talebi Kapat').setStyle(ButtonStyle.Danger)
        );

        await channel.send({ 
            content: `Selam ${interaction.user}, yetkililer gelene kadar sorununu yazabilirsin.`,
            components: [closeRow] 
        });
    } catch (e) { console.log(e) }
});

client.login(TOKEN);
