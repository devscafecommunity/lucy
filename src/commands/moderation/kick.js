const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { validateUser, createEmbed, handleError } = require('../../utils');

class KickCommand {
  constructor() {
    this.name = 'kick';
    this.description = 'Expulsa um membro do servidor';
    this.category = 'moderation';
    this.permissions = ['KickMembers'];
    this.cooldown = 5000; // 5 segundos

    this.data = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addUserOption(option =>
        option
          .setName('usuario')
          .setDescription('Usuário a ser expulso')
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('motivo')
          .setDescription('Motivo da expulsão')
          .setRequired(false)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);
  }

  async execute(interaction) {
    try {
      const targetUser = interaction.options.getUser('usuario');
      const reason = interaction.options.getString('motivo') || 'Nenhum motivo fornecido';

      // Buscar membro no servidor
      let targetMember;
      try {
        targetMember = await interaction.guild.members.fetch(targetUser.id);
      } catch (error) {
        if (error.message.includes('Unknown Member')) {
          return await interaction.reply({
            content: '❌ Usuário não encontrado no servidor!',
            ephemeral: true
          });
        }
        throw error;
      }

      // Validar usuário
      const validation = validateUser(interaction, targetUser, targetMember);
      if (!validation.valid) {
        return await interaction.reply({
          content: validation.reason,
          ephemeral: true
        });
      }

      // Verificar se pode expulsar
      if (!targetMember.kickable) {
        return await interaction.reply({
          content: '❌ Não posso expulsar este usuário. Verifique as permissões e hierarquia de cargos.',
          ephemeral: true
        });
      }

      // Executar expulsão
      await targetMember.kick(reason);

      // Criar embed de sucesso
      const embed = createEmbed({
        title: '✅ Usuário Expulso',
        color: 'success',
        fields: [
          {
            name: '👤 Usuário',
            value: `${targetUser.username} (${targetUser.id})`,
            inline: true
          },
          {
            name: '👮 Moderador',
            value: interaction.user.username,
            inline: true
          },
          {
            name: '📝 Motivo',
            value: reason,
            inline: false
          }
        ],
        footer: {
          text: `Servidor: ${interaction.guild.name}`,
          iconURL: interaction.guild.iconURL()
        },
        timestamp: true
      });

      await interaction.reply({
        embeds: [embed]
      });

      // Log da ação
      console.log(`[KICK] ${targetUser.username} (${targetUser.id}) foi expulso por ${interaction.user.username} (${interaction.user.id}) no servidor ${interaction.guild.name}. Motivo: ${reason}`);

    } catch (error) {
      await handleError(error, interaction, 'kick-command', '❌ Ocorreu um erro ao tentar expulsar o usuário.');
    }
  }
}

module.exports = KickCommand;
