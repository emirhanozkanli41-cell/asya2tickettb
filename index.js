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

// --- AYARLAR ---
const userXP = new Map();
const HOS_GELDIN_KANAL_ID = '1472014377065517146'; 

client.once('ready', () => {
    console.log(`${client.user.tag} aktif!`);
    client.user.setActivity('Asya2 Rank & Destek', { type: 3 });
});

// --- HOŞ GELDİN SİSTEMİ ---
client.on('guildMemberAdd', async (member) => {
    const kanal = member.guild.channels.cache.get(HOS_GELDIN_KANAL_ID);
    if (!kanal) return;

    const welcomeEmbed = new EmbedBuilder()
        .setTitle('🛡️ Asya2 Krallığına Hoş Geldin!')
        .setDescription(`Selam ${member}! Sunucumuza hoş geldin, seninle daha güçlüyüz!`)
        .setImage('https://cdn.discordapp.com/attachments/1028301267547738244/1473632788745027585/680x240DiscordUstProfil.gif')
        .setColor('#f1c40f')
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `Üye Sayısı: ${member.guild.memberCount}`, iconURL: member.guild.iconURL() });

    kanal.send({ content: `Hoş geldin ${member}! ⚔️`, embeds: [welcomeEmbed] });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // --- XP SİSTEMİ ---
    let userData = userXP.get(message.author.id) || { xp: 0, level: 1 };
    userData.xp += Math.floor(Math.random() * 10) + 5;
    let nextLevelXP = userData.level * 150;

    if (userData.xp >= nextLevelXP) {
        userData.level++;
        userData.xp = 0;
        message.reply(`🚀 **Tebrikler!** Seviye atladın: **${userData.level}**`);
    }
    userXP.set(message.author.id, userData);

    // --- !RANK KOMUTU ---
    if (message.content === '!rank' || message.content === '!level') {
        const progress = Math.floor((userData.xp / nextLevelXP) * 10);
        const bar = "🟩".repeat(progress) + "⬜".repeat(10 - progress);

        const rankEmbed = new EmbedBuilder()
            .setAuthor({ name: `🛡️ ASYA2 RANK`, iconURL: client.user.displayAvatarURL() })
            .setTitle(`${message.author.username} Profil Bilgisi`)
            .setDescription(`**Seviye:** \` ${userData.level} \` \n**XP:** \` ${userData.xp} / ${nextLevelXP} \` \n\n${bar} %${progress * 10}`)
            .setImage('https://cdn.discordapp.com/attachments/1028301267547738244/1473628348335915132/4.webp') 
            .setColor('#e74c3c')
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

        return message.channel.send({ embeds: [rankEmbed] });
    }

    // --- !TICKET-KUR KOMUTU ---
    if (message.content === '!ticket-kur' && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const embed = new EmbedBuilder()
            .setTitle('🎫 Destek Sistemi')
            .setDescription('Aşağıdaki butonlardan başvuru yapabilir veya ticket açabilirsin.')
            .setColor('#2ecc71')
            .setImage('https://cdn.discordapp.com/attachments/1028301267547738244/1473628348335915132/4.webp');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_olustur').setLabel('Ticket').setEmoji('📩').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('ticket_takim').setLabel('Takım Başvurusu').setEmoji('🤝').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('ticket_partner').setLabel('Partnerlik').setEmoji('💎').setStyle(ButtonStyle.Danger)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// --- ETKİLEŞİMLER ---
client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === 'ticket_takim') {
            const modal = new ModalBuilder().setCustomId('takim_formu').setTitle('Takım Başvurusu');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t_isim').setLabel("İsim Soyisim?").setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t_yas').setLabel("Yaş ve Şehir?").setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t_saat').setLabel("Müsaitlik Durumu?").setStyle(TextInputStyle.Paragraph).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t_deneyim').setLabel("Deneyimler?").setStyle(TextInputStyle.Paragraph).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t_neden').setLabel("Neden Biz?").setStyle(TextInputStyle.Paragraph).setRequired(true))
            );
            return await interaction.showModal(modal);
        }

        if (interaction.customId === 'ticket_partner') {
            const modal = new ModalBuilder().setCustomId('partner_formu').setTitle('Partnerlik Başvurusu');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p_platform').setLabel("Platform?").setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p_link').setLabel("Link?").setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p_gunler').setLabel("İçerik Günleri?").setStyle(TextInputStyle.Paragraph).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p_saat').setLabel("Günlük Saat?").setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p_katki').setLabel("Katkı?").setStyle(TextInputStyle.Paragraph).setRequired(true))
            );
            return await interaction.showModal(modal);
        }

        if (interaction.customId === 'ticket_olustur') {
            const channel = await interaction.guild.channels.create({
                name: `destek-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                ],
            });
            const embed = new EmbedBuilder().setTitle('🎫 Destek').setDescription('Yetkililer birazdan burada olacak.').setColor('#3498DB');
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_kapat').setLabel('Kapat').setStyle(ButtonStyle.Danger));
            await channel.send({ embeds: [embed], components: [row] });
            return await interaction.reply({ content: `Kanal açıldı: ${channel}`, ephemeral: true });
        }

        if (interaction.customId === 'ticket_kapat') {
            await interaction.reply('Kanal siliniyor...');
            setTimeout(() => interaction.channel.delete().catch(() => {}), 2000);
        }
    }

    if (interaction.type === InteractionType.ModalSubmit) {
        await interaction.reply({ content: `✅ Başvurunuz başarıyla kaydedildi!`, ephemeral: true });
    }
});

client.login(TOKEN);
