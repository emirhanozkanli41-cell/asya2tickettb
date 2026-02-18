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

const HIZLI_LINKLER = {
    '!site': 'https://www.asya2.com.tr/',
    '!kayıt': 'https://www.asya2.com.tr/kayit-ol',
    '!indir': 'https://www.asya2.com.tr/oyunu-indir'
};

client.once('ready', () => {
    console.log(`🛡️ ${client.user.tag} mermi gibi hazır!`);
});

// --- HOŞ GELDİN SİSTEMİ ---
client.on('guildMemberAdd', async (member) => {
    const kanal = member.guild.channels.cache.get(HOS_GELDIN_KANAL_ID);
    if (!kanal) return;
    const welcomeEmbed = new EmbedBuilder()
        .setTitle('🛡️ Asya2 Krallığına Hoş Geldin!')
        .setDescription(`Selam ${member}! Sunucumuza hoş geldin, seninle daha güçlüyüz!`)
        .setImage('https://cdn.discordapp.com/attachments/1028301267547738244/1473632788745027585/680x240DiscordUstProfil.gif')
        .setColor('#f1c40f');
    kanal.send({ content: `Hoş geldin ${member}! ⚔️`, embeds: [welcomeEmbed] });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // 1. HIZLI LİNKLER
    const content = message.content.toLowerCase();
    if (HIZLI_LINKLER[content]) {
        const linkEmbed = new EmbedBuilder()
            .setTitle('🔗 Asya2 Hızlı Erişim')
            .setDescription(`İstediğin bağlantı: **${HIZLI_LINKLER[content]}**`)
            .setColor('#3498db');
        return message.reply({ embeds: [linkEmbed] });
    }

    // 2. XP VE RANK SİSTEMİ
    let userData = userXP.get(message.author.id) || { xp: 0, level: 1 };
    userData.xp += Math.floor(Math.random() * 10) + 5;
    let nextLevelXP = userData.level * 150;
    if (userData.xp >= nextLevelXP) {
        userData.level++;
        userData.xp = 0;
        message.reply(`🚀 **Tebrikler!** Seviye atladın: **${userData.level}**`);
    }
    userXP.set(message.author.id, userData);

    if (message.content === '!rank' || message.content === '!level') {
        const rankEmbed = new EmbedBuilder()
            .setAuthor({ name: `🛡️ ASYA2 RANK`, iconURL: client.user.displayAvatarURL() })
            .setTitle(`${message.author.username} Profil Bilgisi`)
            .setDescription(`**Seviye:** \` ${userData.level} \` \n**XP:** \` ${userData.xp} / ${nextLevelXP} \``)
            .setImage('https://cdn.discordapp.com/attachments/1028301267547738244/1473628348335915132/4.webp') 
            .setColor('#e74c3c');
        return message.channel.send({ embeds: [rankEmbed] });
    }

    // 3. TICKET KURMA (SENİN YENİ KURALLARIN EKLENDİ)
    if (message.content === '!ticket-kur' && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const embed = new EmbedBuilder()
            .setTitle('🎫 Asya2 Destek Sistemi Kuralları')
            .setDescription(`Destek talebi oluşturmadan önce lütfen aşağıdaki kuralları okuyunuz. Talebiniz bu kurallar çerçevesinde değerlendirilecektir.\n\n` +
                            `⚠️ **Gereksiz Talep Oluşturma:** Sorun teşkil etmeyen, sadece selam vermek veya sohbet etmek amacıyla açılan talepler kapatılır. Tekrarı halinde destek sisteminden uzaklaştırma işlemi uygulanabilir.\n\n` +
                            `⏳ **Sabırlı Olun:** Yetkililerimiz yoğunluk durumuna göre en kısa sürede dönüş sağlayacaktır. "Neden bakılmıyor?", "Orada mısınız?" gibi üst üste mesajlar atmak sürecinizi hızlandırmaz, aksine yavaşlatır.\n\n` +
                            `⚖️ **Üslup ve Saygı:** Destek ekibine karşı argo, küfür, hakaret veya aşağılayıcı tutum sergilemek, sınırsız sunucu uzaklaştırmasına (ban) sebep olur.`)
            .setColor('#2ecc71')
            .setImage('https://cdn.discordapp.com/attachments/1028301267547738244/1473628348335915132/4.webp');

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_bug').setLabel('Hata & Bug').setEmoji('1473646621152514050').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('ticket_sikayet').setLabel('Küfür & Şikayet').setEmoji('1473646786534047816').setStyle(ButtonStyle.Secondary)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_takim').setLabel('Takım Başvurusu').setEmoji('1473647070727635034').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('ticket_partner').setLabel('Partnerlik').setEmoji('1473647206400786474').setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({ embeds: [embed], components: [row1, row2] });
    }
});

// --- ETKİLEŞİMLER (BUTONLAR & MODALLAR) ---
client.on('interactionCreate', async (interaction) => {
    const createTicket = async (prefix, title, desc, color) => {
        const channel = await interaction.guild.channels.create({
            name: `${prefix}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
            ],
        });
        const embed = new EmbedBuilder().setTitle(title).setDescription(desc).setColor(color);
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_kapat').setLabel('Talebi Kapat').setStyle(ButtonStyle.Danger));
        await channel.send({ content: `${interaction.user} Hoş geldin!`, embeds: [embed], components: [row] });
        return channel;
    };

    if (interaction.isButton()) {
        if (interaction.customId === 'ticket_bug') {
            const ch = await createTicket('bug', '🛠️ Hata Bildirimi', 'Lütfen hatayı detaylıca yazın.', '#e74c3c');
            await interaction.reply({ content: `Kanal açıldı: ${ch}`, ephemeral: true });
        }
        if (interaction.customId === 'ticket_sikayet') {
            const ch = await createTicket('sikayet', '🚫 Şikayet Bildirimi', 'Şikayetinizi ve kanıtınızı buraya bırakın.', '#95a5a6');
            await interaction.reply({ content: `Kanal açıldı: ${ch}`, ephemeral: true });
        }
        if (interaction.customId === 'ticket_takim') {
            const modal = new ModalBuilder().setCustomId('takim_formu').setTitle('Takım Başvurusu');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t_isim').setLabel("İsim Soyisim?").setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t_yas').setLabel("Yaş ve Şehir?").setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t_deneyim').setLabel("Deneyimler?").setStyle(TextInputStyle.Paragraph).setRequired(true))
            );
            await interaction.showModal(modal);
        }
        if (interaction.customId === 'ticket_partner') {
            const modal = new ModalBuilder().setCustomId('partner_formu').setTitle('Partnerlik Başvurusu');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p_platform').setLabel("Platform (YT/Twitch)?").setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p_link').setLabel("Kanal Linki?").setStyle(TextInputStyle.Short).setRequired(true))
            );
            await interaction.showModal(modal);
        }
        if (interaction.customId === 'ticket_kapat') {
            await interaction.reply('Kanal kilitleniyor...');
            setTimeout(() => interaction.channel.delete().catch(() => {}), 2000);
        }
    }

    if (interaction.type === InteractionType.ModalSubmit) {
        await interaction.reply({ content: `✅ Başvurunuz başarıyla yetkililere iletildi!`, ephemeral: true });
    }
});

client.login(TOKEN);
