const { Client, GatewayIntentBits } = require('discord.js');
const EventEmitter = require('events');

class Bot extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        ...options.intents || []
      ]
    });

    this.modules = new Map();
    this.commands = new Map();
    this.events = new Map();
    
    this._setupBaseEvents();
  }

  _setupBaseEvents() {
    this.client.on('ready', () => {
      console.log(`Bot ${this.client.user.tag} está online!`);
      this.emit('ready');
    });

    this.client.on('error', (error) => {
      console.error('Erro no cliente Discord:', error);
      this.emit('error', error);
    });
  }

  async start(token) {
    if (!token) {
      throw new Error('Token do Discord é obrigatório');
    }

    try {
      await this.client.login(token);
      return this.client;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  }

  async stop() {
    try {
      await this.client.destroy();
      console.log('Bot desconectado com sucesso');
    } catch (error) {
      console.error('Erro ao desconectar bot:', error);
      throw error;
    }
  }

  on(event, listener) {
    this.client.on(event, listener);
    return this;
  }

  loadModule(module) {
    if (this.modules.has(module.name)) {
      throw new Error(`Módulo ${module.name} já está carregado`);
    }

    this.modules.set(module.name, module);
    
    if (module.commands) {
      module.commands.forEach(command => {
        this.commands.set(command.name, command);
      });
    }

    if (module.events) {
      module.events.forEach(event => {
        this.client.on(event.name, event.execute);
        this.events.set(`${module.name}:${event.name}`, event);
      });
    }

    console.log(`Módulo ${module.name} carregado com sucesso`);
  }

  unloadModule(moduleName) {
    const module = this.modules.get(moduleName);
    if (!module) {
      throw new Error(`Módulo ${moduleName} não encontrado`);
    }

    // Remove comandos do módulo
    if (module.commands) {
      module.commands.forEach(command => {
        this.commands.delete(command.name);
      });
    }

    // Remove eventos do módulo
    if (module.events) {
      module.events.forEach(event => {
        this.client.removeListener(event.name, event.execute);
        this.events.delete(`${moduleName}:${event.name}`);
      });
    }

    this.modules.delete(moduleName);
    console.log(`Módulo ${moduleName} descarregado com sucesso`);
  }

  getModule(name) {
    return this.modules.get(name);
  }

  listModules() {
    return Array.from(this.modules.keys());
  }
}

module.exports = Bot;
