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
        GatewayIntentBits.GuildMembers // Giriş-çıkış takibi için şart
    ]
});

const TOKEN = process.env.TOKEN;

// --- AYARLAR ---
const userXP = new Map();
const HOS_GELDIN_KANAL_ID = '1472014377065517146'; // Verdiğin ID'yi buraya ekledim.

client.once('ready', () => {
    console.log(`${client.user.tag} aktif ve Asya2 için hazır!`);
    client.user.setActivity('Asya2 Rank & Destek', { type: 3 });
});

// --- HOŞ GELDİN SİSTEMİ (Üye Girişi) ---
client.on('guildMemberAdd', async (member) => {
    const kanal = member.guild.channels.cache.get(HOS_GELDIN_KANAL_ID);
    if (!kanal) return;

    const welcomeEmbed = new EmbedBuilder()
        .setTitle('🛡️ Asya2 Krallığına Hoş Geldin!')
        .setDescription(`Selam ${member}! Seninle birlikte bir kişi daha güçlendik. Sunucumuzda keyifli vakit geçirmeni dileriz!\n\n**Asya2 Dünyasına Hoş Geldin!**`)
        .setImage('https://cdn.discordapp.com/attachments/1028301267547738244/1473632788745027585/680x240DiscordUstProfil.gif?ex=6996eafb&is=6995997b&hm=b487bc7e421d5712072666a200b5a349a6676781f12ddd55575249274970464d&')
        .setColor('#f1c40f')
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `Seninle birlikte ${member.guild.memberCount} kişiyiz!`, iconURL: member.guild.iconURL() });

    kanal.send({ content: `Hoş geldin ${member}! ⚔️`, embeds: [welcomeEmbed] });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // --- XP VE LEVEL SİSTEMİ ---
    let userData = userXP.get(message.author.id) || { xp: 0, level: 1 };
    const gainedXP = Math.floor(Math.random() * 10) + 5; 
    userData.xp += gainedXP;

    let nextLevelXP = userData.level * 150; 
    if (userData.xp >= nextLevelXP) {
        userData.level++;
        userData.xp = 0;
        message.reply(`🚀 **Tebrikler ${message.author}!** Seviye atladın! Artık **Seviye ${userData.level}** oldun!`);
    }
    userXP.set(message.author.id, userData);

    // --- !RANK KOMUTU ---
    if (message.content === '!rank' || message.content === '!level') {
        const progress = Math.floor((userData.xp / nextLevelXP) * 10);
        const bar = "🟩".repeat(progress) + "⬜".repeat(10 - progress);

        const rankEmbed = new EmbedBuilder()
            .setAuthor({ name: `🛡️ ASYA2 RÜTBE SİSTEMİ`, iconURL: client.user.displayAvatarURL() })
            .setTitle(`${message.author.username} - Oyuncu Bilgileri`)
            .setDescription(`**🔱 Rütbe:** #1 (Savaşçı)\n**⭐ Seviye:** \` ${userData.level} \` \n**✨ Tecrübe:** \` ${userData.xp} / ${nextLevelXP} XP \` \n\n**📊 Gelişim:**\n${bar} **%${progress * 10}**`)
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .setImage('https://cdn.discordapp.com/attachments/1028301267547738244/1473628348335915132/4.webp') 
            .setColor('#e74c3c')
            .setFooter({ text: 'Asya2 Gelişim Sistemi' });

        return message.channel.send({ embeds: [rankEmbed] });
    }

    // --- !TICKET-KUR KOMUTU ---
    if (message.content === '!ticket-kur' && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const embed = new EmbedBuilder()
            .setTitle('🎫 Destek Sistemi')
            .setDescription('Konu ile ilgili aşağıda bulunan butonlara tıklayarak ticket oluşturabilirsin.')
            .setColor('#2ecc71')
            .setImage('https://cdn.discordapp.com/attachments/1028301267547738244/1473628348335915132/4.webp')
            .setFooter({ text: 'Asya2 - Kalite ve Güvenin Adresi' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_olustur').setLabel('Ticket Oluştur').setEmoji('📩').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('ticket_hile').setLabel('Hile & Bug Bildirimi').setEmoji('🛡️').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('ticket_takim').setLabel('Takım Başvurusu').setEmoji('🤝').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('ticket_partner').setLabel('Partnerlik Başvurusu').setEmoji('💎').setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// --- ETKİLEŞİMLER (BUTONLAR VE MODALLAR) ---
client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === 'ticket_takim') {
            const modal = new ModalBuilder().setCustomId('takim_formu').setTitle('Takım Başvuru Formu');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t_isim').setLabel("İsim ve Soy isminiz nedir ?").setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t_yas').setLabel("Kaç Yaşındasınız ve Nerede Yaşıyorsunuz ?").setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t_saat').setLabel("Hangi Saat Aralığında Müsaitsiniz?").setStyle(TextInputStyle.Paragraph).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t_deneyim').setLabel("Daha Önceki Deneyimleriniz Nelerdir ?").setStyle(TextInputStyle.Paragraph).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t_neden').setLabel("Sizi Neden Dahil Etmeliyiz ?").setStyle(TextInputStyle.Paragraph).setRequired(true))
            );
            return await interaction.showModal(modal);
        }

        if (interaction.customId === 'ticket_partner') {
            const modal = new ModalBuilder().setCustomId('partner_formu').setTitle('Partnerlik Başvuru Formu');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p_platform').setLabel("Platform?").setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p_link').setLabel("Kanal Linkiniz").setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p_gunler').setLabel("Yayın Günleri?").setStyle(TextInputStyle.Paragraph).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p_saat').setLabel("Günlük Saat?").setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().
