const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Asya2 Bot 7/24 Aktif!'));
app.listen(process.env.PORT || 3000);

const { 
    Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, 
    ButtonStyle, EmbedBuilder, PermissionsBitField, ChannelType,
    ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType,
    ActivityType 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences // Profil güncellemeleri için önemli
    ]
});

const TOKEN = process.env.TOKEN;

// --- AYARLAR & ROL IDLERI ---
const YETKILI_ROLLER = [
    '1000462054488015042', '1000462280221266141', '1000462479832387615', 
    '1000461367054188625', '1000461569139941507'
];

const KARAKTER_ROLLER = {
    'rol_savasci': '1473750606161248480',
    'rol_ninja': '1473750645906341908',
    'rol_saman': '1473750696649297981',
    'rol_sura': '1473750745361944802'
};

const KRALLIK_ROLLER = {
    'bayrak_kirmizi': '1473752790458171568', 
    'bayrak_sari': '1473752888546164897',    
    'bayrak_mavi': '1473752930246070282'     
};

const HOS_GELDIN_KANAL_ID = '1472014377065517146'; 
const LEVEL_LOG_KANAL_ID = '1473737627743289404'; 
const GIF_URL = 'https://cdn.discordapp.com/attachments/1028301267547738244/1473632788745027585/680x240DiscordUstProfil.gif';

const HIZLI_LINKLER = {
    '!site': 'https://www.asya2.com.tr/',
    '!kayıt': 'https://www.asya2.com.tr/kayit-ol',
    '!indir': 'https://www.asya2.com.tr/oyunu-indir'
};

const userXP = new Map();
const activeTickets = new Set(); 
let rankSistemiAktif = true;

// --- BOT HAZIR OLDUĞUNDA (RPC BURADA) ---
client.once('ready', () => {
    console.log(`🛡️ ${client.user.tag} aktif!`);
    
    // Asya2 RPC Ayarı
    client.user.setPresence({
        activities: [{ 
            name: 'Asya2', 
            type: ActivityType.Playing, // "Asya2 Oynuyor"
            // Not: Logo için Developer Portal'daki "Rich Presence" kısmına 
            // resmi yükleyip ismini 'asya2_logo' yapman lazım.
            details: '🛡️ Ejderhalarla Savaşta!',
            state: '⚔️ Yeni Maceraya Hazırlanıyor'
        }],
        status: 'online',
    });
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
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Üye Sayısı: ${member.guild.memberCount}` });
        kanal.send({ content: `Hoş geldin ${member}! ⚔️`, embeds: [welcomeEmbed] });
    } catch (e) { console.log(e) }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    const content = message.content.toLowerCase().trim();
    const args = message.content.split(' ');

    // --- KURULUM KOMUTLARI ---
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

    // --- XP & RANK SİSTEMİ ---
    if (rankSistemiAktif && !content.startsWith('!')) {
        let userData = userXP.get(message.author.id) || { xp: 0, level: 1 };
        userData.xp += Math.floor(Math.random() * 10) + 5;
        if (userData.xp >= userData.level * 150) {
            userData.level++; userData.xp = 0;
            const logKanal = message.guild.channels.cache.get(LEVEL_LOG_KANAL_ID);
            if (logKanal) {
                const lvEmbed = new EmbedBuilder().setTitle('🚀 Seviye Atlandı!').setDescription(`${message.author} Yeni Seviye: \`${userData.level}\``).setColor('#2ecc71');
                logKanal.send({ embeds: [lvEmbed] });
            }
        }
        userXP.set(message.author.id, userData);
    }

    // --- TEMİZLE & LİNKLER ---
    if (content.startsWith('!temizle')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
        const miktar = parseInt(args[1]);
        if (miktar > 0 && miktar <= 100) await message.channel.bulkDelete(miktar + 1, true);
        return;
    }

    if (HIZLI_LINKLER[content]) return message.reply(`🔗 **Asya2:** ${HIZLI_LINKLER[content]}`);

    if (content === '!ticket-kur' && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const embed = new EmbedBuilder().setTitle('🎫 Asya2 Destek').setDescription('İşlem seçiniz.').setColor('#2ecc71').setImage(GIF_URL);
        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_bug').setLabel('Hata & Bug').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('ticket_sikayet').setLabel('Küfür & Şikayet').setStyle(ButtonStyle.Secondary)
        );
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_takim').setLabel('Takım Başvurusu').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('ticket_partner').setLabel('Partnerlik').setStyle(ButtonStyle.Primary)
        );
        return message.channel.send({ embeds: [embed], components: [row1, row2] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId.startsWith('bayrak_')) {
            const roleId = KRALLIK_ROLLER[interaction.customId];
            if (interaction.member.roles.cache.has(roleId)) return interaction.reply({ content: "⚠️ Zaten bu krallıktasın!", ephemeral: true });
            await interaction.member.roles.remove(Object.values(KRALLIK_ROLLER)).catch(() => {});
            await interaction.member.roles.add(roleId);
            return interaction.reply({ content: "🚩 Krallığın başarıyla güncellendi!", ephemeral: true });
        }

        if (interaction.customId.startsWith('rol_')) {
            const roleId = KARAKTER_ROLLER[interaction.customId];
            if (interaction.member.roles.cache.has(roleId)) return interaction.reply({ content: "⚠️ Zaten bu sınıftasın!", ephemeral: true });
            await interaction.member.roles.remove(Object.values(KARAKTER_ROLLER)).catch(() => {});
            await interaction.member.roles.add(roleId);
            return interaction.reply({ content: "⚔️ Karakter sınıfın başarıyla değiştirildi!", ephemeral: true });
        }

        if (interaction.customId.startsWith('close_')) {
            activeTickets.delete(interaction.customId.split('_')[1]);
            return interaction.channel.delete().catch(() => {});
        }

        if (interaction.customId.startsWith('ticket_')) {
            if (activeTickets.has(interaction.user.id)) return interaction.reply({ content: "⚠️ Açık biletin var!", ephemeral: true });

            if (interaction.customId === 'ticket_takim') {
                const modal = new ModalBuilder().setCustomId('takim_formu').setTitle('Başvuru Formu');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q1').setLabel("İsim ve Soy isminiz nedir ?").setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q2').setLabel("Kaç Yaşındasınız ve Nerede Yaşıyorsunuz ?").setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q3').setLabel("Müsaitlik Saatleriniz").setStyle(TextInputStyle.Paragraph).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q4').setLabel("Deneyimleriniz").setStyle(TextInputStyle.Paragraph).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q5').setLabel("Neden Biz?").setStyle(TextInputStyle.Paragraph).setRequired(true))
                );
                return await interaction.showModal(modal);
            }

            if (interaction.customId === 'ticket_partner') {
                const modal = new ModalBuilder().setCustomId('partner_formu').setTitle('Partnerlik Formu');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p1').setLabel("Platformunuz?").setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p2').setLabel("Kanal Linkiniz").setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p3').setLabel("İçerik Günleriniz").setStyle(TextInputStyle.Paragraph).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p4').setLabel("Günlük Kaç Saat?").setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p5').setLabel("Katkı Planınız").setStyle(TextInputStyle.Paragraph).setRequired(true))
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
        const isTakim = interaction.customId === 'takim_formu';
        const channel = await interaction.guild.channels.create({
            name: `${isTakim ? 'başvuru' : 'partner'}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                ...YETKILI_ROLLER.map(r => ({ id: r, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }))
            ]
        });

        const logEmbed = new EmbedBuilder().setColor('#f1c40f').setTitle(isTakim ? '🤝 Yeni Takım Başvurusu' : '💎 Yeni Partnerlik Başvurusu').setImage(GIF_URL);
        
        if (isTakim) {
            logEmbed.addFields(
                { name: 'İsim/Yaş', value: `${interaction.fields.getTextInputValue('q1')} / ${interaction.fields.getTextInputValue('q2')}` },
                { name: 'Deneyim/Neden', value: `${interaction.fields.getTextInputValue('q4')}\n${interaction.fields.getTextInputValue('q5')}` }
            );
        }

        const closeBtn = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`close_${interaction.user.id}`).setLabel('Kapat').setStyle(ButtonStyle.Danger));
        await channel.send({ embeds: [logEmbed], components: [closeBtn] });
        return interaction.reply({ content: `✅ Başvurunuz iletildi: ${channel}`, ephemeral: true });
    }
});

client.login(TOKEN);
