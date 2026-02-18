const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Asya2 Bot 7/24 Aktif!'));
app.listen(process.env.PORT || 3000);

const { 
    Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, 
    ButtonStyle, EmbedBuilder, PermissionsBitField, ChannelType,
    ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType 
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

// --- AYARLAR & ROL IDLERI ---
const YETKILI_ROLLER = [
    '1000462054488015042', // Discord Admin
    '1000462280221266141', // Mod
    '1000462479832387615', // Trial Mod
    '1000461367054188625', // Game Admin
    '1000461569139941507'  // Game Master
];

const HOS_GELDIN_KANAL_ID = '1472014377065517146'; 
const LEVEL_LOG_KANAL_ID = '1152567298612264970'; 
const GIF_URL = 'https://cdn.discordapp.com/attachments/1028301267547738244/1473632788745027585/680x240DiscordUstProfil.gif';

const HIZLI_LINKLER = {
    '!site': 'https://www.asya2.com.tr/',
    '!kayıt': 'https://www.asya2.com.tr/kayit-ol',
    '!indir': 'https://www.asya2.com.tr/oyunu-indir'
};

const userXP = new Map();
const activeTickets = new Set(); // Açık bileti olanların ID'lerini tutar

client.once('ready', () => {
    console.log(`🛡️ ${client.user.tag} aktif!`);
    client.user.setActivity('Asya2', { type: 0 });
});

// --- HOŞ GELDİN SİSTEMİ ---
client.on('guildMemberAdd', async (member) => {
    try {
        const kanal = member.guild.channels.cache.get(HOS_GELDIN_KANAL_ID);
        if (!kanal) return;

        const welcomeEmbed = new EmbedBuilder()
            .setTitle('🛡️ Asya2 Krallığına Hoş Geldin!')
            .setDescription(`Selam ${member}! Sunucumuza hoş geldin, seninle daha güçlüyüz!`)
            .setImage(GIF_URL)
            .setColor('#f1c40f')
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Üye Sayısı: ${member.guild.memberCount}`, iconURL: member.guild.iconURL() });

        kanal.send({ content: `Hoş geldin ${member}! ⚔️`, embeds: [welcomeEmbed] });
    } catch (e) { console.log(e) }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    const content = message.content.toLowerCase().trim();
    const args = message.content.split(' ');

    // --- TEMİZLE KOMUTU ---
    if (content.startsWith('!temizle')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply("❌ Bu komutu kullanmak için `Mesajları Yönet` yetkin olmalı.");
        }
        const miktar = parseInt(args[1]);
        if (isNaN(miktar) || miktar < 1 || miktar > 100) {
            return message.reply("⚠️ Lütfen temizlenecek mesaj sayısını girin (1-100 arası).").then(msg => setTimeout(() => msg.delete(), 5000));
        }
        try {
            await message.channel.bulkDelete(miktar + 1, true);
            const basari = await message.channel.send(`✅ **${miktar}** adet mesaj başarıyla temizlendi!`);
            setTimeout(() => basari.delete(), 3000);
        } catch (err) { message.reply("❌ Eski mesajları silemiyorum."); }
        return;
    }

    // --- HIZLI LİNKLER ---
    if (HIZLI_LINKLER[content]) return message.reply(`🔗 **Asya2 Bağlantısı:** ${HIZLI_LINKLER[content]}`);

    // --- XP & SEVİYE SİSTEMİ ---
    let userData = userXP.get(message.author.id) || { xp: 0, level: 1 };
    userData.xp += Math.floor(Math.random() * 10) + 5;
    let nextLevelXP = userData.level * 150;

    if (userData.xp >= nextLevelXP) {
        userData.level++;
        userData.xp = 0;
... (114 satır kaldı)
