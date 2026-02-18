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
const YETKILI_ROLLER = ['1000462054488015042', '1000462280221266141', '1000462479832387615', '1000461367054188625', '1000461569139941507'];
const HOS_GELDIN_KANAL_ID = '1472014377065517146'; 
const LEVEL_LOG_KANAL_ID = '1152567298612264970'; 
const GIF_URL = 'https://cdn.discordapp.com/attachments/1028301267547738244/1473632788745027585/680x240DiscordUstProfil.gif';

const userXP = new Map();
const activeTickets = new Set();

client.once('ready', () => {
    console.log(`🛡️ ${client.user.tag} aktif!`);
    client.user.setActivity('Asya2', { type: 0 });
});

// --- MESAJ OLAYLARI (XP & KOMUTLAR) ---
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    const content = message.content.toLowerCase().trim();

    // XP Sistemi
    let userData = userXP.get(message.author.id) || { xp: 0, level: 1 };
    userData.xp += Math.floor(Math.random() * 10) + 5;
    if (userData.xp >= userData.level * 150) {
        userData.level++; userData.xp = 0;
        const logKanal = message.guild.channels.cache.get(LEVEL_LOG_KANAL_ID);
        if (logKanal) {
            const levelEmbed = new EmbedBuilder().setTitle('🚀 Seviye Atlandı!').setDescription(`Tebrikler ${message.author}! Yeni Seviyen: **${userData.level}**`).setColor('#2ecc71').setImage(GIF_URL);
            logKanal.send({ embeds: [levelEmbed] });
        }
    }
    userXP.set(message.author.id, userData);

    // Ticket Kurulum
    if (content === '!ticket-kur' && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const embed = new EmbedBuilder()
            .setTitle('🎫 Asya2 Destek Sistemi')
            .setDescription(`Sorununuzla ilgili butona tıklayın.\n\n⚠️ **Not:** Aynı anda sadece 1 bilet açabilirsiniz.`)
            .setColor('#2ecc71').setImage(GIF_URL);
        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_bug').setLabel('Hata & Bug').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('ticket_sikayet').setLabel('Küfür & Şikayet').setStyle(ButtonStyle.Secondary)
        );
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_takim').setLabel('Takım Başvurusu').setEmoji('🤝').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('ticket_partner').setLabel('Partnerlik').setEmoji('💎').setStyle(ButtonStyle.Primary)
        );
        await message.channel.send({ embeds: [embed], components: [row1, row2] });
    }
});

// --- ETKİLEŞİMLER (MODAL & SPAM KONTROL) ---
client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId.startsWith('close_')) {
            activeTickets.delete(interaction.customId.split('_')[1]);
            await interaction.reply('Kanal siliniyor...');
            return setTimeout(() => interaction.channel.delete().catch(() => {}), 2000);
        }

        if (interaction.customId.startsWith('ticket_')) {
            if (activeTickets.has(interaction.user.id)) {
                return interaction.reply({ content: "⚠️ Zaten açık bir biletin var!", ephemeral: true });
            }

            // RESİMDEKİ TAKIM BAŞVURU FORMU
            if (interaction.customId === 'ticket_takim') {
                const modal = new ModalBuilder().setCustomId('takim_formu').setTitle('Please answer the question below.');
                
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q1').setLabel("İsim ve Soy isminiz nedir ?").setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q2').setLabel("Kaç Yaşındasınız ve Nerede Yaşıyorsunuz ?").setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q3').setLabel("Hangi Saat Aralığında Ve Günlerde Müsaitsiniz").setStyle(TextInputStyle.Paragraph).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q4').setLabel("Daha Önceki Deneyimleriniz Nelerdir ?").setStyle(TextInputStyle.Paragraph).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q5').setLabel("Sizleri Ekibimize Neden Dahil Etmeliyiz ?").setStyle(TextInputStyle.Paragraph).setRequired(true))
                );
                return await interaction.showModal(modal);
            }

            // Diğer bilet türleri (Bug/Şikayet)
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
            const closeRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`close_${interaction.user.id}`).setLabel('Kapat').setStyle(ButtonStyle.Danger));
            await channel.send({ content: `${interaction.user} Hoş geldin.`, components: [closeRow] });
            return interaction.reply({ content: `Bilet açıldı: ${channel}`, ephemeral: true });
        }
    }

    // Modal Formu Gönderildiğinde
    if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'takim_formu') {
        activeTickets.add(interaction.user.id);
        const q1 = interaction.fields.getTextInputValue('q1');
        const q2 = interaction.fields.getTextInputValue('q2');
        
        const channel = await interaction.guild.channels.create({
            name: `başvuru-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                ...YETKILI_ROLLER.map(r => ({ id: r, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }))
            ]
        });

        const logEmbed = new EmbedBuilder()
            .setTitle('🤝 Yeni Takım Başvurusu')
            .addFields(
                { name: 'İsim Soyisim', value: q1 },
                { name: 'Yaş/Şehir', value: q2 },
                { name: 'Müsaitlik', value: interaction.fields.getTextInputValue('q3') },
                { name: 'Deneyimler', value: interaction.fields.getTextInputValue('q4') },
                { name: 'Neden Biz?', value: interaction.fields.getTextInputValue('q5') }
            )
            .setColor('#5865F2').setFooter({ text: `Başvuran: ${interaction.user.tag}` });

        const closeRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`close_${interaction.user.id}`).setLabel('Kapat').setStyle(ButtonStyle.Danger));
        await channel.send({ content: `🔔 **Yeni Başvuru Geldi!**`, embeds: [logEmbed], components: [closeRow] });
        await interaction.reply({ content: `✅ Başvurunuz başarıyla iletildi! Kanalınız: ${channel}`, ephemeral: true });
    }
});

client.login(TOKEN);
