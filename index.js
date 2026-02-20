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
const YETKILI_ROLLER = ['1000462054488015042', '1000462280221266141', '1000462479832387615', '1000461367054188625', '1000461569139941507'];

// KRALLIK & KARAKTER ROLLERİ
const KRALLIK_ROLLER = {
    'bayrak_kirmizi': '1473752790458171568', // Shinsoo
    'bayrak_sari': '1473752888546164897',    // Chunjo
    'bayrak_mavi': '1473752930246070282'     // Jinno
};

const KARAKTER_ROLLER = {
    'rol_savasci': '1473750606161248480',
    'rol_ninja': '1473750645906341908',
    'rol_saman': '1473750696649297981',
    'rol_sura': '1473750745361944802'
};

const HOS_GELDIN_KANAL_ID = '1472014377065517146'; 
const LEVEL_LOG_KANAL_ID = '1473737627743289404'; 
const GIF_URL = 'https://cdn.discordapp.com/attachments/1028301267547738244/1473632788745027585/680x240DiscordUstProfil.gif';
const RANK_FOTO = 'https://cdn.discordapp.com/attachments/1028301267547738244/1473628348335915132/4.webp'; // İstediğin Rank Fotosu

const HIZLI_LINKLER = {
    '!site': 'https://www.asya2.com.tr/',
    '!kayıt': 'https://www.asya2.com.tr/kayit-ol',
    '!indir': 'https://www.asya2.com.tr/oyunu-indir'
};

const userXP = new Map();
const activeTickets = new Set(); 
let rankSistemiAktif = true;

client.once('ready', () => {
    console.log(`🛡️ ${client.user.tag} aktif!`);
});

// --- HOŞ GELDİN SİSTEMİ ---
client.on('guildMemberAdd', async (member) => {
    try {
        const kanal = member.guild.channels.cache.get(HOS_GELDIN_KANAL_ID);
        if (!kanal) return;
        const welcomeEmbed = new EmbedBuilder()
            .setTitle('🛡️ Asya2 Krallığına Hoş Geldin!')
            .setDescription(`Selam ${member}! Sunucumuza hoş geldin, seninle daha güçlüyüz!`)
            .setImage(GIF_URL).setColor('#f1c40f')
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }));
        kanal.send({ content: `Hoş geldin ${member}! ⚔️`, embeds: [welcomeEmbed] });
    } catch (e) { console.log(e) }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    const content = message.content.toLowerCase().trim();
    const args = message.content.split(' ');

    // --- KRALLIK & ROL KURMA KOMUTLARI ---
    if (content === '!krallik-kur' && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const embed = new EmbedBuilder()
            .setTitle('🚩 Asya2 Krallık Seçimi')
            .setDescription('Safını belirle! Sadece bir bayrak seçebilirsin.\n\n🔴 **Shinsoo** | 🟡 **Chunjo** | 🔵 **Jinno**')
            .setColor('#ffffff').setImage(GIF_URL);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('bayrak_kirmizi').setLabel('Shinsoo').setStyle(ButtonStyle.Danger).setEmoji('🔴'),
            new ButtonBuilder().setCustomId('bayrak_sari').setLabel('Chunjo').setStyle(ButtonStyle.Secondary).setEmoji('🟡'),
            new ButtonBuilder().setCustomId('bayrak_mavi').setLabel('Jinno').setStyle(ButtonStyle.Primary).setEmoji('🔵')
        );
        return message.channel.send({ embeds: [embed], components: [row] });
    }

    if (content === '!rol-kur' && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const embed = new EmbedBuilder()
            .setTitle('⚔️ Asya2 Karakter Sınıfı Seçimi')
            .setDescription('Yolunu seç! Sadece bir sınıfa ait olabilirsin.\n\n🛡️ **Savaşçı** | 🏹 **Ninja** | 🔥 **Sura** | ✨ **Şaman**')
            .setColor('#2f3136').setImage(GIF_URL);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('rol_savasci').setLabel('Savaşçı').setStyle(ButtonStyle.Secondary).setEmoji('🛡️'),
            new ButtonBuilder().setCustomId('rol_ninja').setLabel('Ninja').setStyle(ButtonStyle.Success).setEmoji('🏹'),
            new ButtonBuilder().setCustomId('rol_sura').setLabel('Sura').setStyle(ButtonStyle.Danger).setEmoji('🔥'),
            new ButtonBuilder().setCustomId('rol_saman').setLabel('Şaman').setStyle(ButtonStyle.Primary).setEmoji('✨')
        );
        return message.channel.send({ embeds: [embed], components: [row] });
    }

    // --- RANK SİSTEMİ AÇ/KAPAT ---
    if (content.startsWith('!rank-sistem')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
        if (args[1] === 'aç') { rankSistemiAktif = true; return message.reply("✅ Rank sistemi açıldı."); }
        if (args[1] === 'kapat') { rankSistemiAktif = false; return message.reply("⚠️ Rank sistemi kapatıldı."); }
    }

    // --- XP & GÖRSEL RANK SİSTEMİ ---
    if (rankSistemiAktif && !content.startsWith('!')) {
        let userData = userXP.get(message.author.id) || { xp: 0, level: 1 };
        userData.xp += Math.floor(Math.random() * 10) + 5;
        let nextLevelXP = userData.level * 200;

        if (userData.xp >= nextLevelXP) {
            userData.level++;
            userData.xp = 0;
            const logKanal = message.guild.channels.cache.get(LEVEL_LOG_KANAL_ID);
            if (logKanal) {
                const lvEmbed = new EmbedBuilder()
                    .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
                    .setTitle('🚀 SEVİYE ATLANDI!')
                    .setDescription(`🛡️ **Tebrikler!** Krallıkta rütben yükseldi.\n\n**Yeni Seviye:** \` ${userData.level} \``)
                    .setImage(RANK_FOTO) // Senin attığın özel .webp görseli
                    .setColor('#f1c40f').setTimestamp();
                logKanal.send({ content: `${message.author} seviye atladı!`, embeds: [lvEmbed] });
            }
        }
        userXP.set(message.author.id, userData);
    }

    // --- PROFİL/RANK KOMUTU ---
    if (content === '!rank' || content === '!level') {
        let userData = userXP.get(message.author.id) || { xp: 0, level: 1 };
        const currentNextXP = userData.level * 200;
        const bar = "🟩".repeat(Math.min(Math.floor((userData.xp / currentNextXP) * 10), 10)) + "⬜".repeat(10 - Math.min(Math.floor((userData.xp / currentNextXP) * 10), 10));
        const rankEmbed = new EmbedBuilder()
            .setTitle(`${message.author.username} Profil Bilgisi`)
            .setDescription(`**Seviye:** \` ${userData.level} \` \n**XP:** \` ${userData.xp} / ${currentNextXP} \` \n\n${bar}`)
            .setColor('#f1c40f').setThumbnail(message.author.displayAvatarURL());
        return message.channel.send({ embeds: [rankEmbed] });
    }

    if (HIZLI_LINKLER[content]) return message.reply(HIZLI_LINKLER[content]);

    if (content.startsWith('!temizle')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
        const miktar = parseInt(args[1]);
        if (miktar > 0 && miktar <= 100) await message.channel.bulkDelete(miktar + 1, true);
    }

    if (content === '!ticket-kur' && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const embed = new EmbedBuilder().setTitle('🎫 Asya2 Destek').setDescription('İşlem seçiniz.').setColor('#2ecc71').setImage(GIF_URL);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_bug').setLabel('Hata & Bug').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('ticket_sikayet').setLabel('Küfür & Şikayet').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ticket_takim').setLabel('Takım Başvurusu').setStyle(ButtonStyle.Success)
        );
        return message.channel.send({ embeds: [embed], components: [row] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        // Krallık Seçimi
        if (interaction.customId.startsWith('bayrak_')) {
            const roleId = KRALLIK_ROLLER[interaction.customId];
            await interaction.member.roles.remove(Object.values(KRALLIK_ROLLER)).catch(() => {});
            await interaction.member.roles.add(roleId);
            return interaction.reply({ content: "🚩 Krallığın başarıyla seçildi!", ephemeral: true });
        }
        // Karakter Seçimi
        if (interaction.customId.startsWith('rol_')) {
            const roleId = KARAKTER_ROLLER[interaction.customId];
            await interaction.member.roles.remove(Object.values(KARAKTER_ROLLER)).catch(() => {});
            await interaction.member.roles.add(roleId);
            return interaction.reply({ content: "⚔️ Karakter sınıfın güncellendi!", ephemeral: true });
        }
        // Ticket Kapatma
        if (interaction.customId.startsWith('close_')) {
            activeTickets.delete(interaction.customId.split('_')[1]);
            return interaction.channel.delete().catch(() => {});
        }
        // Ticket Açma
        if (interaction.customId.startsWith('ticket_')) {
            if (activeTickets.has(interaction.user.id)) return interaction.reply({ content: "⚠️ Açık biletin var!", ephemeral: true });
            
            // Modal Gerektiren Biletler (Takım Başvurusu vb.)
            if (interaction.customId === 'ticket_takim') {
                const modal = new ModalBuilder().setCustomId('takim_formu').setTitle('Başvuru Formu');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q1').setLabel("İsim ve Soy isminiz nedir ?").setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q2').setLabel("Yaş ve Şehir ?").setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q3').setLabel("Deneyimleriniz?").setStyle(TextInputStyle.Paragraph).setRequired(true))
                );
                return await interaction.showModal(modal);
            }

            activeTickets.add(interaction.user.id);
            const channel = await interaction.guild.channels.create({
                name: `destek-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                    ...YETKILI_ROLLER.map(r => ({ id: r, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }))
                ]
            });
            const closeBtn = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`close_${interaction.user.id}`).setLabel('Kapat').setStyle(ButtonStyle.Danger));
            await channel.send({ content: `⚔️ Hoş geldin ${interaction.user}, biletin açıldı.`, components: [closeBtn] });
            return interaction.reply({ content: `Bilet açıldı: ${channel}`, ephemeral: true });
        }
    }

    if (interaction.type === InteractionType.ModalSubmit) {
        activeTickets.add(interaction.user.id);
        const channel = await interaction.guild.channels.create({
            name: `başvuru-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                ...YETKILI_ROLLER.map(r => ({ id: r, allow: [PermissionsBitField.Flags.ViewChannel] }))
            ]
        });
        const closeBtn = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`close_${interaction.user.id}`).setLabel('Kapat').setStyle(ButtonStyle.Danger));
        await channel.send({ content: `✅ Yeni Başvuru Geldi! \nİsim: ${interaction.fields.getTextInputValue('q1')}`, components: [closeBtn] });
        return interaction.reply({ content: `Başvurunuz iletildi: ${channel}`, ephemeral: true });
    }
});

client.login(TOKEN);
