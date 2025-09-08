const { PermissionsBitField } = require('discord.js');

class CommandHandler {
  constructor(bot) {
    this.bot = bot;
    this.cooldowns = new Map();
  }

  async handleInteraction(interaction) {
    if (!interaction.isCommand()) {
      return false;
    }

    const command = this.bot.commands.get(interaction.commandName);
    
    if (!command) {
      await interaction.reply({
        content: 'Comando não encontrado!',
        ephemeral: true
      });
      return false;
    }

    // Verificar cooldown
    if (this._checkCooldown(command, interaction.user.id)) {
      const cooldownTime = this._getCooldownTime(command, interaction.user.id);
      await interaction.reply({
        content: `Aguarde ${cooldownTime} segundos antes de usar este comando novamente.`,
        ephemeral: true
      });
      return false;
    }

    // Verificar permissões
    if (!this._checkPermissions(command, interaction)) {
      await interaction.reply({
        content: 'Você não tem permissão para usar este comando!',
        ephemeral: true
      });
      return false;
    }

    try {
      // Log do comando executado
      console.log(`Comando ${command.name} executado por ${interaction.user.username} em ${interaction.guild?.name || 'DM'}`);

      // Executar comando
      await command.execute(interaction);

      // Definir cooldown se especificado
      if (command.cooldown) {
        this._setCooldown(command, interaction.user.id);
      }

      return true;
    } catch (error) {
      console.error(`Erro ao executar comando ${command.name}:`, error);

      const errorMessage = {
        content: 'Ocorreu um erro ao executar este comando!',
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }

      return false;
    }
  }

  _checkPermissions(command, interaction) {
    if (!command.permissions || command.permissions.length === 0) {
      return true;
    }

    if (!interaction.member) {
      return false; // DM sem permissões de servidor
    }

    return command.permissions.every(permission => {
      if (typeof permission === 'string') {
        return interaction.member.permissions.has(PermissionsBitField.Flags[permission]);
      }
      return interaction.member.permissions.has(permission);
    });
  }

  _checkCooldown(command, userId) {
    if (!command.cooldown) {
      return false;
    }

    const cooldownKey = `${command.name}:${userId}`;
    const lastUsed = this.cooldowns.get(cooldownKey);

    if (!lastUsed) {
      return false;
    }

    const now = Date.now();
    const cooldownExpired = now - lastUsed >= command.cooldown;

    return !cooldownExpired;
  }

  _setCooldown(command, userId) {
    const cooldownKey = `${command.name}:${userId}`;
    this.cooldowns.set(cooldownKey, Date.now());

    // Limpar cooldown automaticamente após expirar
    setTimeout(() => {
      this.cooldowns.delete(cooldownKey);
    }, command.cooldown);
  }

  _getCooldownTime(command, userId) {
    const cooldownKey = `${command.name}:${userId}`;
    const lastUsed = this.cooldowns.get(cooldownKey);
    const now = Date.now();
    const remainingTime = Math.ceil((command.cooldown - (now - lastUsed)) / 1000);

    return remainingTime;
  }

  clearUserCooldowns(userId) {
    const keysToDelete = [];
    
    for (const [key] of this.cooldowns) {
      if (key.endsWith(`:${userId}`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cooldowns.delete(key));
  }

  clearCommandCooldowns(commandName) {
    const keysToDelete = [];
    
    for (const [key] of this.cooldowns) {
      if (key.startsWith(`${commandName}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cooldowns.delete(key));
  }

  getCooldownInfo() {
    const info = {};
    
    for (const [key, timestamp] of this.cooldowns) {
      const [commandName, userId] = key.split(':');
      if (!info[commandName]) {
        info[commandName] = {};
      }
      info[commandName][userId] = {
        lastUsed: timestamp,
        expiresAt: timestamp + (this.bot.commands.get(commandName)?.cooldown || 0)
      };
    }

    return info;
  }
}

module.exports = CommandHandler;
