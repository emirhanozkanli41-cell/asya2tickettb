const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Bot 7/24 Aktif Durumda!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Web sunucusu ${port} portunda hazır.`);
});

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

client.once('ready', () => {
    console.log(`${client.user.tag} aktif! Bot komutları bekliyor...`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    if (message.content === '!ticket-kur') {
        const embed = new EmbedBuilder()
            .setTitle('🎫 Destek Talebi')
            .setDescription('Yardım almak için aşağıdaki butona tıklayarak bir kanal açabilirsiniz.')
            .setColor(0x00FF00);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_ac')
                .setLabel('Ticket Aç')
                .setEmoji('📩')
                .setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }

    if (message.content === '!basvuru-kur') {
        const embed = new EmbedBuilder()
            .setTitle('🤝 Yetkili/Takım Başvurusu')
            .setDescription('Ekibimize katılmak için butona basıp formu doldurmanız yeterlidir.')
            .setColor(0x5865F2);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('basvuru_yap_buton')
                .setLabel('Başvuru Yap')
                .setEmoji('📝')
                .setStyle(ButtonStyle.Success)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'ticket_ac') {
        try {
            const channel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                ],
            });

            const tEmbed = new EmbedBuilder()
                .setTitle('Destek Kanalı')
                .setDescription(`Hoş geldin ${interaction.user}. Yetkililer birazdan burada olacak.`)
                .setColor(0x3498DB);

            const closeBtn = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('ticket_kapat').setLabel('Kapat').setStyle(ButtonStyle.Danger)
            );

            await channel.send({ embeds: [tEmbed], components: [closeBtn] });
            await interaction.reply({ content: `Kanal açıldı: ${channel}`, ephemeral: true });
        } catch (err) {
            console.error(err);
        }
    }

    if (interaction.isButton() && interaction.customId === 'ticket_kapat') {
        await interaction.reply('Kanal 3 saniye içinde siliniyor...');
        setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
    }

    if (interaction.isButton() && interaction.customId === 'basvuru_yap_buton') {
        const modal = new ModalBuilder().setCustomId('basvuru_formu').setTitle('Başvuru Formu');

        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q1').setLabel("İsim Soyisim?").setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q2').setLabel("Yaş ve Şehir?").setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q3').setLabel("Neden biz?").setStyle(TextInputStyle.Paragraph).setRequired(true))
        );

        await interaction.showModal(modal);
    }

    if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'basvuru_formu') {
        const ad = interaction.fields.getTextInputValue('q1');
        await interaction.reply({ content: `Teşekkürler ${ad}, başvurunuz başarıyla iletildi!`, ephemeral: true });
    }
});

client.login(TOKEN);