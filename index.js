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
    try {
        const kanal = member.guild.channels.cache.get(HOS_GELDIN_KANAL_ID);
        if (!kanal) return;
        const welcomeEmbed = new EmbedBuilder()
            .setTitle('🛡️ Asya2 Krallığına Hoş Geldin!')
            .setDescription(`Selam ${member}! Sunucumuza hoş geldin, seninle daha güçlüyüz!`)
            .setImage('https://cdn.discordapp.com/attachments/1028301267547738244/1473632788745027585/680x240DiscordUstProfil.gif')
            .setColor('#f1c40f');
        kanal.send({ content: `Hoş geldin ${member}! ⚔️`, embeds: [welcomeEmbed] });
    } catch (err) { console.log("Hoş geldin hatası: " + err) }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const content = message.content.toLowerCase();
    if (HIZLI_LINKLER[content]) {
        const linkEmbed = new EmbedBuilder()
            .setTitle('🔗 Asya2 Hızlı Erişim')
            .setDescription(`İstediğin bağlantı: **${HIZLI_LINKLER[content]}**`)
            .setColor('#3498db');
        return message.reply({ embeds: [linkEmbed] });
    }

    if (message.content === '!rank' || message.content === '!level') {
        let userData = userXP.get(message.author.id) || { xp: 0, level: 1 };
        const rankEmbed = new EmbedBuilder()
            .setAuthor({ name: `🛡️ ASYA2 RANK`, iconURL: client.user.displayAvatarURL() })
            .setTitle(`${message.author.username} Profil Bilgisi`)
            .setDescription(`**Seviye:** \` ${userData.level} \` \n**XP:** \` ${userData.xp} \``)
            .setImage('https://cdn.discordapp.com/attachments/1028301267547738244/1473628348335915132/4.webp') 
            .setColor('#e74c3c');
        return message.channel.send({ embeds: [rankEmbed] });
    }

    if (message.content === '!ticket-kur' && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const embed = new EmbedBuilder()
            .setTitle('🎫 Asya2 Destek Sistemi Kuralları')
            .setDescription(`Destek talebi oluşturmadan önce lütfen aşağıdaki kuralları okuyunuz.\n\n` +
                            `⚠️ **Gereksiz Talep Oluşturma:** Sohbet amaçlı talepler kapatılır.\n\n` +
                            `⏳ **Sabırlı Olun:** Yetkililer en kısa sürede dönüş yapacaktır.\n\n` +
                            `⚖️ **Üslup ve Saygı:** Küfür/Hakaret ban sebebidir.`)
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

// Hataları yakalamak için boş bir etkileşim dinleyici ekleyelim
client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isButton()) {
            if (interaction.customId === 'ticket_kapat') {
                await interaction.reply('Kanal siliniyor...');
                return setTimeout(() => interaction.channel.delete().catch(() => {}), 2000);
            }
            
            // Kanal oluşturma işlemi
            const channel = await interaction.guild.channels.create({
                name: `destek-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                ],
            });
            
            await interaction.reply({ content: `Kanal açıldı: ${channel}`, ephemeral: true });
            await channel.send({ content: `Hoş geldin ${interaction.user}! Yetkililer birazdan burada olacak.`, 
                components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_kapat').setLabel('Kapat').setStyle(ButtonStyle.Danger))] 
            });
        }
    } catch (e) { console.log(e) }
});

client.login(TOKEN).catch(err => console.log("Token Hatası: " + err));
