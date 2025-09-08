const fs = require('fs');
const path = require('path');

class EventManager {
  constructor(bot) {
    this.bot = bot;
    this.events = new Map();
    this.eventPaths = new Map();
    this.eventHandlers = new Map(); // Para armazenar handlers para poder remover depois
  }

  async loadFromDirectory(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) {
        throw new Error(`Diretório ${dirPath} não encontrado`);
      }

      const files = fs.readdirSync(dirPath);
      const loadedEvents = [];

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          // Recursivamente carrega eventos de subdiretórios
          const subEvents = await this.loadFromDirectory(filePath);
          loadedEvents.push(...subEvents);
        } else if (file.endsWith('.js') && !file.startsWith('.')) {
          try {
            const event = await this.loadEvent(filePath);
            if (event) {
              loadedEvents.push(event);
            }
          } catch (error) {
            console.error(`Erro ao carregar evento ${file}:`, error.message);
          }
        }
      }

      console.log(`Carregados ${loadedEvents.length} eventos de ${dirPath}`);
      return loadedEvents;
    } catch (error) {
      console.error(`Erro ao carregar eventos de ${dirPath}:`, error.message);
      throw error;
    }
  }

  async loadEvent(eventPath) {
    try {
      const absolutePath = path.resolve(eventPath);
      
      // Remove do cache do require para permitir recarregamento
      delete require.cache[absolutePath];
      
      const eventModule = require(absolutePath);
      const event = typeof eventModule === 'function' ? new eventModule() : eventModule;

      this._validateEvent(event);
      
      this.registerEvent(event);
      this.eventPaths.set(event.name, absolutePath);

      return event;
    } catch (error) {
      console.error(`Erro ao carregar evento de ${eventPath}:`, error.message);
      throw error;
    }
  }

  registerEvent(event) {
    this._validateEvent(event);

    if (this.events.has(event.name)) {
      console.warn(`Evento ${event.name} já está registrado, sobrescrevendo...`);
      this.unregisterEvent(event.name);
    }

    // Criar handler wrapper para capturar erros
    const eventHandler = async (...args) => {
      try {
        await event.execute(...args);
      } catch (error) {
        console.error(`Erro ao executar evento ${event.name}:`, error);
      }
    };

    this.events.set(event.name, event);
    this.eventHandlers.set(event.name, eventHandler);

    // Registrar no client do Discord
    if (event.once) {
      this.bot.client.once(event.name, eventHandler);
    } else {
      this.bot.client.on(event.name, eventHandler);
    }

    console.log(`Evento ${event.name} registrado com sucesso`);
  }

  unregisterEvent(eventName) {
    if (!this.events.has(eventName)) {
      throw new Error(`Evento ${eventName} não está registrado`);
    }

    const eventHandler = this.eventHandlers.get(eventName);
    
    if (eventHandler) {
      this.bot.client.removeListener(eventName, eventHandler);
    }

    this.events.delete(eventName);
    this.eventHandlers.delete(eventName);
    this.eventPaths.delete(eventName);

    console.log(`Evento ${eventName} desregistrado com sucesso`);
  }

  async reloadEvent(eventName) {
    const eventPath = this.eventPaths.get(eventName);
    if (!eventPath) {
      throw new Error(`Evento ${eventName} não encontrado no cache de caminhos`);
    }

    try {
      // Desregistrar evento atual
      this.unregisterEvent(eventName);
      
      // Recarregar evento
      const reloadedEvent = await this.loadEvent(eventPath);
      
      console.log(`Evento ${eventName} recarregado com sucesso`);
      return reloadedEvent;
    } catch (error) {
      console.error(`Erro ao recarregar evento ${eventName}:`, error.message);
      throw error;
    }
  }

  getEvent(name) {
    return this.events.get(name);
  }

  listEvents() {
    return Array.from(this.events.keys());
  }

  getEventsByType(type) {
    const events = [];
    
    for (const [name, event] of this.events) {
      if (event.type === type) {
        events.push(event);
      }
    }

    return events;
  }

  getEventInfo() {
    const info = {};
    
    for (const [name, event] of this.events) {
      info[name] = {
        description: event.description || 'Sem descrição',
        once: event.once || false,
        type: event.type || 'discord',
        enabled: event.enabled !== false
      };
    }

    return info;
  }

  enableEvent(eventName) {
    const event = this.events.get(eventName);
    if (!event) {
      throw new Error(`Evento ${eventName} não encontrado`);
    }

    if (event.enabled === false) {
      event.enabled = true;
      
      // Re-registrar o evento
      const eventHandler = this.eventHandlers.get(eventName);
      if (eventHandler) {
        if (event.once) {
          this.bot.client.once(eventName, eventHandler);
        } else {
          this.bot.client.on(eventName, eventHandler);
        }
      }
      
      console.log(`Evento ${eventName} habilitado`);
    }
  }

  disableEvent(eventName) {
    const event = this.events.get(eventName);
    if (!event) {
      throw new Error(`Evento ${eventName} não encontrado`);
    }

    if (event.enabled !== false) {
      event.enabled = false;
      
      // Remover listener temporariamente
      const eventHandler = this.eventHandlers.get(eventName);
      if (eventHandler) {
        this.bot.client.removeListener(eventName, eventHandler);
      }
      
      console.log(`Evento ${eventName} desabilitado`);
    }
  }

  _validateEvent(event) {
    if (!event || typeof event !== 'object') {
      throw new Error('Evento deve ser um objeto');
    }

    if (!event.name || typeof event.name !== 'string') {
      throw new Error('Evento deve ter uma propriedade "name" do tipo string');
    }

    if (!event.execute || typeof event.execute !== 'function') {
      throw new Error('Evento deve ter uma propriedade "execute" que seja uma função');
    }

    // Validações opcionais
    if (event.once !== undefined && typeof event.once !== 'boolean') {
      throw new Error('Propriedade "once" deve ser um boolean');
    }

    if (event.enabled !== undefined && typeof event.enabled !== 'boolean') {
      throw new Error('Propriedade "enabled" deve ser um boolean');
    }

    if (event.description && typeof event.description !== 'string') {
      throw new Error('Propriedade "description" deve ser uma string');
    }

    if (event.type && typeof event.type !== 'string') {
      throw new Error('Propriedade "type" deve ser uma string');
    }
  }
}

module.exports = EventManager;
