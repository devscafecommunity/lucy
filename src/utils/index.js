const { EmbedBuilder } = require('discord.js');

/**
 * Formata duração em minutos para uma string legível
 * @param {number} minutes - Duração em minutos
 * @returns {string} Duração formatada
 */
function formatDuration(minutes) {
  if (minutes <= 0) return '0 minutos';

  if (minutes < 60) {
    return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    let result = `${hours} hora${hours > 1 ? 's' : ''}`;
    if (remainingMinutes > 0) {
      result += ` e ${remainingMinutes} minuto${remainingMinutes > 1 ? 's' : ''}`;
    }
    return result;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  let result = `${days} dia${days > 1 ? 's' : ''}`;
  if (remainingHours > 0) {
    result += ` e ${remainingHours} hora${remainingHours > 1 ? 's' : ''}`;
  }
  
  return result;
}

/**
 * Valida se um usuário pode ser moderado por outro
 * @param {Interaction} interaction - Interação do Discord
 * @param {User} targetUser - Usuário alvo
 * @param {GuildMember} targetMember - Membro alvo no servidor
 * @returns {Object} Resultado da validação
 */
function validateUser(interaction, targetUser, targetMember) {
  // Verificar se está tentando moderar a si mesmo
  if (targetUser.id === interaction.user.id) {
    return {
      valid: false,
      reason: '❌ Você não pode executar esta ação em si mesmo!'
    };
  }

  // Verificar se é um bot
  if (targetUser.bot) {
    return {
      valid: false,
      reason: '❌ Não posso executar esta ação em um bot!'
    };
  }

  // Verificar se é o dono do servidor
  if (targetUser.id === interaction.guild.ownerId) {
    return {
      valid: false,
      reason: '❌ Não posso executar esta ação no dono do servidor!'
    };
  }

  // Verificar hierarquia de cargos
  if (targetMember && interaction.member) {
    if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
      return {
        valid: false,
        reason: '❌ Você não pode executar esta ação em alguém com cargo igual ou superior ao seu!'
      };
    }

    // Verificar se o bot pode moderar o usuário
    if (interaction.guild.members.me && 
        targetMember.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
      return {
        valid: false,
        reason: '❌ Não posso executar esta ação em alguém com cargo igual ou superior ao meu!'
      };
    }
  }

  return { valid: true };
}

/**
 * Cria um embed padronizado
 * @param {Object} options - Opções do embed
 * @returns {EmbedBuilder} Embed criado
 */
function createEmbed(options = {}) {
  const embed = new EmbedBuilder();

  // Cores predefinidas
  const colors = {
    success: 0x00ff00,
    error: 0xff0000,
    warning: 0xff9900,
    info: 0x00aaff,
    default: 0x7289da
  };

  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.color) {
    const color = colors[options.color] || options.color;
    embed.setColor(color);
  }
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.author) embed.setAuthor(options.author);
  if (options.footer) embed.setFooter(options.footer);
  if (options.timestamp) embed.setTimestamp();
  if (options.url) embed.setURL(options.url);
  
  if (options.fields && Array.isArray(options.fields)) {
    options.fields.forEach(field => {
      embed.addFields({
        name: field.name,
        value: field.value,
        inline: field.inline || false
      });
    });
  }

  return embed;
}

/**
 * Manipula erros de forma padronizada
 * @param {Error} error - Erro ocorrido
 * @param {Interaction} interaction - Interação do Discord
 * @param {string} context - Contexto onde o erro ocorreu
 * @param {string} customMessage - Mensagem customizada para o usuário
 */
async function handleError(error, interaction, context, customMessage = null) {
  console.error(`Erro em ${context}:`, error);

  const errorMessage = customMessage || '❌ Ocorreu um erro ao executar esta ação!';
  const errorReply = {
    content: errorMessage,
    ephemeral: true
  };

  try {
    if (interaction.replied || interaction.deferred) {
      if (interaction.deferred) {
        await interaction.editReply(errorReply);
      } else {
        await interaction.followUp(errorReply);
      }
    } else {
      await interaction.reply(errorReply);
    }
  } catch (replyError) {
    console.error('Erro ao enviar mensagem de erro:', replyError);
  }
}

/**
 * Valida permissões do usuário
 * @param {GuildMember} member - Membro do servidor
 * @param {Array<string>} requiredPermissions - Permissões necessárias
 * @returns {boolean} Se o usuário tem as permissões
 */
function hasPermissions(member, requiredPermissions) {
  if (!member || !requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  return requiredPermissions.every(permission => {
    return member.permissions.has(permission);
  });
}

/**
 * Formata um número como ordinal (1º, 2º, 3º, etc.)
 * @param {number} num - Número para formatar
 * @returns {string} Número ordinal formatado
 */
function formatOrdinal(num) {
  const lastDigit = num % 10;
  const lastTwoDigits = num % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${num}º`;
  }

  switch (lastDigit) {
  case 1:
    return `${num}º`;
  case 2:
    return `${num}º`;
  case 3:
    return `${num}º`;
  default:
    return `${num}º`;
  }
}

/**
 * Trunca um texto para um tamanho específico
 * @param {string} text - Texto para truncar
 * @param {number} maxLength - Tamanho máximo
 * @param {string} suffix - Sufixo para adicionar quando truncado
 * @returns {string} Texto truncado
 */
function truncateText(text, maxLength = 100, suffix = '...') {
  if (!text || text.length <= maxLength) {
    return text || '';
  }

  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitaliza a primeira letra de cada palavra
 * @param {string} str - String para capitalizar
 * @returns {string} String capitalizada
 */
function capitalizeWords(str) {
  if (!str) return '';
  
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

/**
 * Gera um ID único
 * @returns {string} ID único
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Aguarda um tempo específico
 * @param {number} ms - Tempo em millisegundos
 * @returns {Promise} Promise que resolve após o tempo especificado
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Verifica se uma string é um URL válido
 * @param {string} str - String para verificar
 * @returns {boolean} Se é um URL válido
 */
function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Converte bytes para formato legível
 * @param {number} bytes - Número de bytes
 * @param {number} decimals - Número de casas decimais
 * @returns {string} Tamanho formatado
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

module.exports = {
  formatDuration,
  validateUser,
  createEmbed,
  handleError,
  hasPermissions,
  formatOrdinal,
  truncateText,
  capitalizeWords,
  generateId,
  sleep,
  isValidUrl,
  formatBytes
};
