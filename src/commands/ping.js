const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, handleError } = require('../utils');

class PingCommand {
  constructor() {
    this.name = 'ping';
    this.description = 'Mostra o ping do bot';
    this.category = 'utility';
    this.cooldown = 3000; // 3 segundos
    this.permissions = [];
    
    this.data = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description);
  }

  async execute(interaction) {
    const startTime = Date.now();
    
    try {
      await interaction.deferReply();
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const apiLatency = interaction.client.ws.ping;

      const embed = createEmbed({
        title: '🏓 Pong!',
        color: 'success',
        fields: [
          {
            name: '⏱️ Tempo de Resposta',
            value: `${responseTime}ms`,
            inline: true
          },
          {
            name: '📡 Latência da API',
            value: `${apiLatency}ms`,
            inline: true
          },
          {
            name: '📊 Status',
            value: this._getStatusEmoji(apiLatency),
            inline: true
          }
        ],
        footer: {
          text: `Executado por ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL()
        },
        timestamp: true
      });

      await interaction.editReply({
        embeds: [embed]
      });
    } catch (error) {
      await handleError(error, interaction, 'ping-command');
      
      // Fallback para resposta simples
      try {
        const fallbackReply = {
          content: '🏓 Pong! (modo simples)',
          ephemeral: false
        };

        if (interaction.deferred) {
          await interaction.editReply(fallbackReply);
        } else {
          await interaction.reply(fallbackReply);
        }
      } catch (fallbackError) {
        console.error('Erro no fallback do comando ping:', fallbackError);
      }
    }
  }

  _getStatusEmoji(ping) {
    if (ping < 100) return '🟢 Excelente';
    if (ping < 200) return '🟡 Bom';
    if (ping < 300) return '🟠 Regular';
    return '🔴 Ruim';
  }
}

module.exports = PingCommand;
