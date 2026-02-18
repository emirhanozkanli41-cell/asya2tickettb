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
        const logKanal = message.guild.channels.cache.get(LEVEL_LOG_KANAL_ID);
        if (logKanal) {
            const levelEmbed = new EmbedBuilder()
                .setTitle('🚀 Asya2 Seviye Atlandı!')
                .setDescription(`Tebrikler ${message.author}! Krallıkta rütben yükseldi.\n\n**Yeni Seviyen:** \` ${userData.level} \``)
                .setColor('#2ecc71')
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .setImage(GIF_URL);
            logKanal.send({ content: `${message.author} seviye atladı!`, embeds: [levelEmbed] });
        }
    }
    userXP.set(message.author.id, userData);

    // --- !RANK KOMUTU ---
    if (content === '!rank' || content === '!level') {
        const currentNextXP = userData.level * 150;
        const progress = Math.min(Math.floor((userData.xp / currentNextXP) * 10), 10);
        const bar = "🟩".repeat(progress) + "⬜".repeat(10 - progress);
        const rankEmbed = new EmbedBuilder()
            .setAuthor({ name: `🛡️ ASYA2 RANK`, iconURL: client.user.displayAvatarURL() })
            .setTitle(`${message.author.username} Profil Bilgisi`)
            .setDescription(`**Seviye:** \` ${userData.level} \` \n**XP:** \` ${userData.xp} / ${currentNextXP} \` \n\n${bar} %${progress * 10}`)
            .setImage('https://cdn.discordapp.com/attachments/1028301267547738244/1473628348335915132/4.webp') 
            .setColor('#e74c3c')
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
        return message.channel.send({ embeds: [rankEmbed] });
    }

    // --- !TICKET-KUR KOMUTU ---
    if (content === '!ticket-kur' && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const embed = new EmbedBuilder()
            .setTitle('🎫 Asya2 Destek Sistemi')
            .setDescription(`Sorununuzla ilgili butona tıklayarak işlem başlatın.\n\n⚠️ **Dikkat:** Aynı anda sadece 1 aktif bilet açabilirsiniz.`)
            .setColor('#2ecc71')
            .setImage(GIF_URL)
            .setFooter({ text: 'Asya2 - Kalite ve Güvenin Adresi' });

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_bug').setLabel('Hata & Bug').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('ticket_sikayet').setLabel('Küfür & Şikayet').setStyle(ButtonStyle.Secondary)
        );
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_takim').setLabel('Takım Başvurusu').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('ticket_partner').setLabel('Partnerlik').setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({ embeds: [embed], components: [row1, row2] });
    }
});

// --- ETKİLEŞİMLER (BUTON & MODAL) ---
client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        // TICKET KAPATMA
        if (interaction.customId.startsWith('close_')) {
            const ownerId = interaction.customId.split('_')[1];
            activeTickets.delete(ownerId); // Kişinin bilet açma engelini kaldır
            await interaction.reply('Kanal 2 saniye içinde siliniyor...');
            return setTimeout(() => interaction.channel.delete().catch(() => {}), 2000);
        }

        // TICKET AÇMA (SPAM ENGELİ)
        if (interaction.customId.startsWith('ticket_')) {
            if (activeTickets.has(interaction.user.id)) {
                return interaction.reply({ content: "⚠️ **Zaten açık bir biletin var!** Onu kapatmadan yenisini açamazsın.", ephemeral: true });
            }

            // MODAL GEREKTİRENLER (Takım & Partner)
            if (interaction.customId === 'ticket_takim' || interaction.customId === 'ticket_partner') {
                const isTakim = interaction.customId === 'ticket_takim';
                const modal = new ModalBuilder().setCustomId(isTakim ? 'takim_formu' : 'partner_formu').setTitle('Başvuru Formu');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('f1').setLabel("İsim/Platform?").setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('f2').setLabel("Yaş/Link?").setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('f3').setLabel("Detaylar?").setStyle(TextInputStyle.Paragraph).setRequired(true))
                );
                return await interaction.showModal(modal);
            }

            // NORMAL BİLETLER (Bug & Şikayet)
            activeTickets.add(interaction.user.id);
            const prefix = interaction.customId.split('_')[1];
            
            const channel = await interaction.guild.channels.create({
                name: `${prefix}-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                    ...YETKILI_ROLLER.map(rolID => ({ id: rolID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }))
                ],
            });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`close_${interaction.user.id}`).setLabel('Kapat').setStyle(ButtonStyle.Danger)
            );
            const ticketEmbed = new EmbedBuilder()
                .setTitle('⚔️ Asya2 Destek')
                .setDescription(`${interaction.user} Hoş geldin, destek ekibi bilgilendirildi.`)
                .setColor('#f1c40f').setImage(GIF_URL);

            await channel.send({ embeds: [ticketEmbed], components: [row] });
            return await interaction.reply({ content: `Bilet açıldı: ${channel}`, ephemeral: true });
        }
    }

    if (interaction.type === InteractionType.ModalSubmit) {
        await interaction.reply({ content: `✅ Başvurunuz kaydedildi!`, ephemeral: true });
    }
});

client.login(TOKEN);
