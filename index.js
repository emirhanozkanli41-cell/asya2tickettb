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
        GatewayIntentBits.GuildPresences, // <--- BOTUN YEŞİL YANMASI İÇİN BU ŞART!
        GatewayIntentBits.GuildVoiceStates
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

client.once('ready', () => {
    console.log(`🛡️ ${client.user.tag} aktif ve yeşil yanıyor!`);
    
    // Botun durumunu zorla "Online" ve "Asya2 Oynuyor" yapıyoruz
    client.user.setPresence({
        activities: [{ name: 'Asya2 Ticket', type: ActivityType.Playing }],
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
            .setImage(GIF_URL)
            .setColor('#f1c40f')
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Üye Sayısı: ${member.guild.memberCount}`, iconURL: member.guild.iconURL() });

        kanal.send({ content: `Hoş geldin ${member}! ⚔️`, embeds: [welcomeEmbed] });
    } catch (e) { console.log(e) }
});

// --- MESAJ KOMUTLARI & XP SİSTEMİ ---
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    const content = message.content.toLowerCase().trim();
    const args = message.content.split(' ');

    // Rank Sistem Kontrol
    if (content.startsWith('!rank-sistem')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply("❌ Bu ayarı sadece yöneticiler yapabilir.");
        const secim = args[1];
        if (secim === 'aç') {
            rankSistemiAktif = true;
            return message.reply("✅ **Rank ve XP sistemi aktif edildi.**");
        } else if (secim === 'kapat') {
            rankSistemiAktif = false;
            return message.reply("⚠️ **Rank ve XP sistemi kapatıldı.**");
        }
    }

    // Temizle Komutu
    if (content.startsWith('!temizle')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return message.reply("❌ Yetkin yok.");
        const miktar = parseInt(args[1]);
        if (isNaN(miktar) || miktar < 1 || miktar > 100) return message.reply("⚠️ 1-100 arası bir sayı gir.");
        try {
            await message.channel.bulkDelete(miktar + 1, true);
            const msg = await message.channel.send(`✅ **${miktar}** mesaj temizlendi.`);
            setTimeout(() => msg.delete(), 3000);
        } catch (err) { console.log(err) }
        return;
    }

    // Hızlı Linkler
    if (HIZLI_LINKLER[content]) return message.reply(`🔗 **Asya2 Bağlantısı:** ${HIZLI_LINKLER[content]}`);

    // XP & Seviye Sistemi
    if (rankSistemiAktif) {
        let userData = userXP.get(message.author.id) || { xp: 0, level: 1 };
        userData.xp += Math.floor(Math.random() * 10) + 5;
        let nextLevelXP = userData.level * 150;

        if (userData.xp >= nextLevelXP) {
            userData.level++;
            userData.xp = 0;
            const logKanal = message.guild.channels.cache.get(LEVEL_LOG_KANAL_ID);
            if (logKanal) {
                const levelEmbed = new EmbedBuilder()
                    .setTitle('🚀 Asya2 Seviye Atlandı!')
                    .setDescription(`Tebrikler ${message.author}! Krallıkta rütben yükseldi.\n\n**Yeni Seviyen:** \` ${userData.level} \``)
                    .setColor('#2ecc71').setImage(GIF_URL);
                logKanal.send({ content: `${message.author} seviye atladı!`, embeds: [levelEmbed] });
            }
        }
        userXP.set(message.author.id, userData);
    }

    // !Rank Komutu
    if (content === '!rank' || content === '!level') {
        if (!rankSistemiAktif) return message.reply("⚠️ Rank sistemi şu an kapalı.");
        let userData = userXP.get(message.author.id) || { xp: 0, level: 1 };
        const currentNextXP = userData.level * 150;
        const progress = Math.min(Math.floor((userData.xp / currentNextXP) * 10), 10);
        const bar = "🟩".repeat(progress) + "⬜".repeat(10 - progress);
        const rankEmbed = new EmbedBuilder()
            .setTitle(`${message.author.username} Profil Bilgisi`)
            .setDescription(`**Seviye:** \` ${userData.level} \` \n**XP:** \` ${userData.xp} / ${currentNextXP} \` \n\n${bar} %${progress * 10}`)
            .setColor('#e74c3c').setThumbnail(message.author.displayAvatarURL());
        return message.channel.send({ embeds: [rankEmbed] });
    }

    // !Ticket-Kur
    if (content === '!ticket-kur' && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const embed = new EmbedBuilder()
            .setTitle('🎫 Asya2 Destek & Başvuru')
            .setDescription('İşlem yapmak için butonları kullanın.\n\n⚠️ Aynı anda 1 bilet açabilirsiniz.')
            .setColor('#2ecc71').setImage(GIF_URL);
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

// --- BUTON VE MODAL ETKİLEŞİMLERİ ---
client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId.startsWith('close_')) {
            activeTickets.delete(interaction.customId.split('_')[1]);
            await interaction.reply('Kanal siliniyor...');
            return setTimeout(() => interaction.channel.delete().catch(() => {}), 2000);
        }

        if (interaction.customId.startsWith('ticket_')) {
            if (activeTickets.has(interaction.user.id)) return interaction.reply({ content: "⚠️ Açık biletin var!", ephemeral: true });

            if (interaction.customId === 'ticket_takim') {
                const modal = new ModalBuilder().setCustomId('takim_formu').setTitle('Başvuru Formu');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q1').setLabel("İsim ve Soy isminiz nedir ?").setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q2').setLabel("Kaç Yaşındasınız ve Nerede Yaşıyorsunuz ?").setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q3').setLabel("Hangi Saat Aralığında Ve Günlerde Müsaitsiniz").setStyle(TextInputStyle.Paragraph).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q4').setLabel("Daha Önceki Deneyimleriniz Nelerdir ?").setStyle(TextInputStyle.Paragraph).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q5').setLabel("Sizleri Ekibimize Neden Dahil Etmeliyiz ?").setStyle(TextInputStyle.Paragraph).setRequired(true))
                );
                return await interaction.showModal(modal);
            }

            if (interaction.customId === 'ticket_partner') {
                const modal = new ModalBuilder().setCustomId('partner_formu').setTitle('Partnerlik Formu');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p1').setLabel("Hangi Platformda İçerik Üretiyorsunuz ?").setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p2').setLabel("Kanal Linkiniz").setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p3').setLabel("Hangi Günler İçerik Üretmektesiniz ?").setStyle(TextInputStyle.Paragraph).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p4').setLabel("Günlük Kaç Saat İçerik Üretmektesiniz ?").setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p5').setLabel("Bizlere Nasıl Bir Katkıda Bulunabilirsiniz ?").setStyle(TextInputStyle.Paragraph).setRequired(true))
                );
                return await interaction.showModal(modal);
            }

            // Normal Ticket Açma
            activeTickets.add(interaction.user.id);
            const prefix = interaction.customId.split('_')[1];
            const channel = await interaction.guild.channels.create({
                name: `${prefix}-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                    ...YETKILI_ROLLER.map(r => ({ id: r, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }))
                ]
            });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`close_${interaction.user.id}`).setLabel('Kapat').setStyle(ButtonStyle.Danger)
            );

            const ticketEmbed = new EmbedBuilder()
                .setTitle('⚔️ Asya2 Destek')
                .setDescription(`Hoş geldin ${interaction.user}, talebiniz ilgili birime iletildi.`)
                .setColor('#f1c40f')
                .setImage(GIF_URL); 

            await channel.send({ embeds: [ticketEmbed], components: [row] });
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

        const logEmbed = new EmbedBuilder()
            .setColor('#f1c40f')
            .setTitle(isTakim ? '🤝 Yeni Takım Başvurusu' : '💎 Yeni Partnerlik Başvurusu')
            .setImage(GIF_URL);

        if (isTakim) {
            logEmbed.addFields(
                { name: 'İsim Soyisim', value: interaction.fields.getTextInputValue('q1') },
                { name: 'Yaş/Şehir', value: interaction.fields.getTextInputValue('q2') },
                { name: 'Müsaitlik', value: interaction.fields.getTextInputValue('q3') },
                { name: 'Deneyimler', value: interaction.fields.getTextInputValue('q4') },
                { name: 'Neden Biz?', value: interaction.fields.getTextInputValue('q5') }
            );
        } else {
            logEmbed.addFields(
                { name: 'Platform', value: interaction.fields.getTextInputValue('p1') },
                { name: 'Kanal Linki', value: interaction.fields.getTextInputValue('p2') },
                { name: 'Günler', value: interaction.fields.getTextInputValue('p3') },
                { name: 'Saat', value: interaction.fields.getTextInputValue('p4') },
                { name: 'Katkı Planı', value: interaction.fields.getTextInputValue('p5') }
            );
        }

        const closeRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`close_${interaction.user.id}`).setLabel('Kapat').setStyle(ButtonStyle.Danger));
        await channel.send({ embeds: [logEmbed], components: [closeRow] });
        return interaction.reply({ content: `✅ Başvurunuz iletildi: ${channel}`, ephemeral: true });
    }
});

client.login(TOKEN);
