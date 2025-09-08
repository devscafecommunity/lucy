/**
 * Exemplo de como usar os módulos PersistentDB e ShortTermDB em um comando
 * Este arquivo demonstra as funcionalidades dos módulos de banco de dados
 */

const { SlashCommandBuilder } = require('discord.js');
const PersistentDB = require('../../modules/persistentdb');
const ShortTermDB = require('../../modules/shorttermdb');

class ExampleDbCommand {
  constructor() {
    this.name = 'exemplo-db';
    this.description = 'Demonstra o uso dos módulos de banco de dados';
    this.category = 'admin';
    this.permissions = ['Administrator'];

    this.data = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addSubcommand(subcommand =>
        subcommand
          .setName('cache')
          .setDescription('Testa operações de cache')
          .addStringOption(option =>
            option
              .setName('chave')
              .setDescription('Chave para o cache')
              .setRequired(true)
          )
          .addStringOption(option =>
            option
              .setName('valor')
              .setDescription('Valor para armazenar')
              .setRequired(false)
          )
      )
      .addSubcommand(subcommand =>
        subcommand
          .setName('usuario')
          .setDescription('Testa operações de usuário no banco persistente')
          .addUserOption(option =>
            option
              .setName('usuario')
              .setDescription('Usuário para processar')
              .setRequired(true)
          )
      );
  }

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      // Inicializar os bancos de dados (normalmente seria feito no Bot.js)
      const persistentDB = new PersistentDB();
      const shortTermDB = new ShortTermDB();

      // Para este exemplo, vamos assumir que já foram inicializados
      // await persistentDB.initialize(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
      // await shortTermDB.initialize();

      if (subcommand === 'cache') {
        await this.handleCacheCommand(interaction, shortTermDB);
      } else if (subcommand === 'usuario') {
        await this.handleUserCommand(interaction, persistentDB, shortTermDB);
      }

    } catch (error) {
      console.error('Erro no comando exemplo-db:', error);
      await interaction.reply({
        content: '❌ Erro ao executar operação no banco de dados',
        ephemeral: true
      });
    }
  }

  async handleCacheCommand(interaction, shortTermDB) {
    const chave = interaction.options.getString('chave');
    const valor = interaction.options.getString('valor');

    if (valor) {
      // Armazenar no cache por 1 hora
      shortTermDB.setCache(chave, { data: valor, user: interaction.user.id }, 3600);
      
      await interaction.reply({
        content: `✅ Valor armazenado no cache com chave: \`${chave}\``,
        ephemeral: true
      });
    } else {
      // Recuperar do cache
      const cachedData = shortTermDB.getCache(chave);
      
      if (cachedData) {
        await interaction.reply({
          content: `📦 Cache encontrado:\n\`\`\`json\n${JSON.stringify(cachedData, null, 2)}\n\`\`\``,
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: `❌ Nenhum cache encontrado para a chave: \`${chave}\``,
          ephemeral: true
        });
      }
    }
  }

  async handleUserCommand(interaction, persistentDB, shortTermDB) {
    const targetUser = interaction.options.getUser('usuario');

    try {
      // Verificar se o usuário existe no cache primeiro (ShortTermDB)
      let userData = shortTermDB.getCache(`user:${targetUser.id}`);

      if (!userData) {
        // Se não estiver no cache, buscar no banco persistente
        const dbUser = await persistentDB.select('users', {
          where: { discord_id: targetUser.id },
          limit: 1
        });

        if (dbUser && dbUser.length > 0) {
          userData = dbUser[0];
        } else {
          // Se não existir, criar novo usuário
          userData = {
            discord_id: targetUser.id,
            username: targetUser.username,
            discriminator: targetUser.discriminator,
            avatar_url: targetUser.displayAvatarURL()
          };

          const newUser = await persistentDB.insert('users', userData);
          userData = newUser[0];
        }

        // Armazenar no cache por 30 minutos
        shortTermDB.setCache(`user:${targetUser.id}`, userData, 1800);
      }

      // Criar uma sessão temporária no ShortTermDB
      const sessionData = {
        user_id: targetUser.id,
        guild_id: interaction.guild.id,
        session_data: JSON.stringify({
          last_command: this.name,
          timestamp: new Date().toISOString()
        }),
        expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hora
      };

      shortTermDB.insert('user_sessions', sessionData);

      await interaction.reply({
        content: `✅ Usuário processado:\n\`\`\`json\n${JSON.stringify({
          id: userData.id,
          discord_id: userData.discord_id,
          username: userData.username,
          created_at: userData.created_at
        }, null, 2)}\n\`\`\``,
        ephemeral: true
      });

    } catch (error) {
      console.error('Erro ao processar usuário:', error);
      await interaction.reply({
        content: '❌ Erro ao processar dados do usuário',
        ephemeral: true
      });
    }
  }
}

module.exports = ExampleDbCommand;
