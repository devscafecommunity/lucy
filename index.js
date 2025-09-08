require('dotenv').config();
const path = require('path');
const Bot = require('./src/core/Bot');
const CommandManager = require('./src/core/CommandManager');
const EventManager = require('./src/core/EventManager');
const CommandHandler = require('./src/core/CommandHandler');

class LucyBot {
  constructor() {
    this.bot = new Bot();
    this.commandManager = new CommandManager(this.bot);
    this.eventManager = new EventManager(this.bot);
    this.commandHandler = new CommandHandler(this.bot);
    
    this._setupEventHandlers();
  }

  _setupEventHandlers() {
    // Handler para interações (comandos slash)
    this.bot.client.on('interactionCreate', async (interaction) => {
      await this.commandHandler.handleInteraction(interaction);
    });

    // Handler customizado para quando o bot estiver totalmente carregado
    this.bot.client.on('botReady', async (data) => {
      console.log('🎉 Sistema totalmente carregado!');
      console.log(`📈 Estatísticas: ${data.guilds} servidores, ${data.users} usuários`);
      
      // Registrar comandos slash após o bot estar online
      try {
        console.log('⚙️ Registrando comandos slash...');
        await this.registerSlashCommands();
      } catch (error) {
        console.error('❌ Erro ao registrar comandos após inicialização:', error);
      }
    });

    // Handler para avisos
    this.bot.client.on('warn', (warning) => {
      console.warn('⚠️ Aviso:', warning);
    });

    // Handler para debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      this.bot.client.on('debug', (info) => {
        console.debug('🔍 Debug:', info);
      });
    }
  }

  async loadComponents() {
    try {
      console.log('📦 Carregando componentes...');

      // Carregar eventos primeiro (incluindo o evento ready)
      const eventsPath = path.join(__dirname, 'src', 'events');
      const loadedEvents = await this.eventManager.loadFromDirectory(eventsPath);
      console.log(`✅ ${loadedEvents.length} eventos carregados`);

      // Carregar comandos
      const commandsPath = path.join(__dirname, 'src', 'commands');
      const loadedCommands = await this.commandManager.loadFromDirectory(commandsPath);
      console.log(`✅ ${loadedCommands.length} comandos carregados`);

      console.log('🎯 Todos os componentes carregados com sucesso!');
      return { events: loadedEvents, commands: loadedCommands };
      
    } catch (error) {
      console.error('❌ Erro ao carregar componentes:', error);
      throw error;
    }
  }

  async registerSlashCommands() {
    try {
      const commands = Array.from(this.bot.commands.values())
        .filter(command => command.data)
        .map(command => command.data.toJSON());

      if (commands.length === 0) {
        console.log('ℹ️ Nenhum comando slash para registrar');
        return;
      }

      console.log(`🔧 Preparando para registrar ${commands.length} comandos...`);

      // Registro global ou por servidor
      if (process.env.GUILD_ID && process.env.NODE_ENV === 'development') {
        // Desenvolvimento: registrar apenas no servidor de teste
        const guild = await this.bot.client.guilds.fetch(process.env.GUILD_ID);
        
        // Limpar comandos existentes primeiro
        console.log('🧹 Limpando comandos existentes do servidor de desenvolvimento...');
        await guild.commands.set([]);
        
        // Registrar novos comandos
        await guild.commands.set(commands);
        console.log(`🔧 ${commands.length} comandos registrados no servidor de desenvolvimento`);
      } else {
        // Produção: registrar globalmente
        console.log('🧹 Limpando comandos globais existentes...');
        await this.bot.client.application.commands.set([]);
        
        // Registrar novos comandos
        await this.bot.client.application.commands.set(commands);
        console.log(`🌐 ${commands.length} comandos registrados globalmente`);
      }

      // Listar comandos registrados
      console.log('📋 Comandos registrados:');
      commands.forEach(command => {
        console.log(`   - /${command.name} - ${command.description}`);
      });
      
    } catch (error) {
      console.error('❌ Erro ao registrar comandos slash:', error);
      
      // Se o erro for relacionado ao token, não falhar completamente
      if (error.message.includes('token')) {
        console.warn('⚠️ Problema com token - comandos serão registrados quando o bot estiver online');
      } else {
        throw error;
      }
    }
  }

  async clearAllCommands() {
    try {
      console.log('🧹 Limpando todos os comandos...');

      if (process.env.GUILD_ID && process.env.NODE_ENV === 'development') {
        // Limpar comandos do servidor de desenvolvimento
        const guild = await this.bot.client.guilds.fetch(process.env.GUILD_ID);
        await guild.commands.set([]);
        console.log('✅ Comandos do servidor de desenvolvimento limpos');
      } else {
        // Limpar comandos globais
        await this.bot.client.application.commands.set([]);
        console.log('✅ Comandos globais limpos');
      }
    } catch (error) {
      console.error('❌ Erro ao limpar comandos:', error);
      throw error;
    }
  }

  async forceRegisterCommands() {
    try {
      console.log('🔄 Forçando registro de comandos...');
      await this.clearAllCommands();
      await this.registerSlashCommands();
    } catch (error) {
      console.error('❌ Erro ao forçar registro de comandos:', error);
      throw error;
    }
  }

  async reloadCommand(commandName) {
    try {
      await this.commandManager.reloadCommand(commandName);
      // Re-registrar comandos após reload se o bot estiver online
      if (this.bot.client.isReady()) {
        await this.registerSlashCommands();
      }
      console.log(`🔄 Comando ${commandName} recarregado com sucesso`);
    } catch (error) {
      console.error(`❌ Erro ao recarregar comando ${commandName}:`, error);
      throw error;
    }
  }

  async reloadEvent(eventName) {
    try {
      await this.eventManager.reloadEvent(eventName);
      console.log(`🔄 Evento ${eventName} recarregado com sucesso`);
    } catch (error) {
      console.error(`❌ Erro ao recarregar evento ${eventName}:`, error);
      throw error;
    }
  }

  async start() {
    try {
      console.log('🚀 Iniciando Lucy Bot...');
      
      // Verificar variáveis de ambiente
      if (!process.env.DISCORD_TOKEN) {
        throw new Error('DISCORD_TOKEN não encontrado nas variáveis de ambiente');
      }

      // Carregar componentes antes de iniciar o bot
      await this.loadComponents();

      // Iniciar o bot (isso vai disparar o evento ready)
      await this.bot.start(process.env.DISCORD_TOKEN);
      
    } catch (error) {
      console.error('❌ Erro ao iniciar o bot:', error);
      process.exit(1);
    }
  }

  async stop() {
    try {
      console.log('🛑 Desligando Lucy Bot...');
      await this.bot.stop();
      console.log('✅ Bot desligado com sucesso');
      process.exit(0);
    } catch (error) {
      console.error('❌ Erro ao desligar o bot:', error);
      process.exit(1);
    }
  }

  // Métodos de conveniência para gerenciamento
  listCommands() {
    return this.commandManager.listCommands();
  }

  listEvents() {
    return this.eventManager.listEvents();
  }

  getCommandInfo(commandName) {
    return this.commandManager.getCommand(commandName);
  }

  getEventInfo(eventName) {
    return this.eventManager.getEvent(eventName);
  }

  getCooldownInfo() {
    return this.commandHandler.getCooldownInfo();
  }

  // Métodos para busca
  searchCommands(query) {
    return this.commandManager.searchCommands(query);
  }

  getCommandsByCategory(category) {
    return this.commandManager.getCommandsByCategory(category);
  }

  // Métodos administrativos
  async refreshCommands() {
    if (this.bot.client.isReady()) {
      await this.forceRegisterCommands();
    } else {
      console.warn('⚠️ Bot não está online. Comandos serão registrados quando estiver pronto.');
    }
  }
}

// Instanciar e iniciar o bot
const lucy = new LucyBot();

// Handlers para encerramento gracioso
process.on('SIGINT', async () => {
  console.log('\n🔄 Recebido SIGINT, encerrando graciosamente...');
  await lucy.stop();
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Recebido SIGTERM, encerrando graciosamente...');
  await lucy.stop();
});

// Handler para erros não tratados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  console.error('Promise:', promise);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Exceção não tratada:', error);
  process.exit(1);
});

// Iniciar o bot
lucy.start();

// Exportar para testes e acesso programático
module.exports = { LucyBot, lucy };

// Função global para limpar comandos via console (útil para debug)
global.clearCommands = async () => {
  if (lucy.bot.client.isReady()) {
    await lucy.clearAllCommands();
  } else {
    console.log('Bot não está online');
  }
};

// Função global para recarregar comandos via console
global.refreshCommands = async () => {
  if (lucy.bot.client.isReady()) {
    await lucy.refreshCommands();
  } else {
    console.log('Bot não está online');
  }
};