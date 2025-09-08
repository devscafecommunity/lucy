const fs = require('fs');
const path = require('path');

class CommandManager {
  constructor(bot) {
    this.bot = bot;
    this.commands = new Map();
    this.commandPaths = new Map();
  }

  async loadFromDirectory(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) {
        throw new Error(`Diretório ${dirPath} não encontrado`);
      }

      const files = fs.readdirSync(dirPath);
      const loadedCommands = [];

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          // Recursivamente carrega comandos de subdiretórios
          const subCommands = await this.loadFromDirectory(filePath);
          loadedCommands.push(...subCommands);
        } else if (file.endsWith('.js') && !file.startsWith('.')) {
          try {
            const command = await this.loadCommand(filePath);
            if (command) {
              loadedCommands.push(command);
            }
          } catch (error) {
            console.error(`Erro ao carregar comando ${file}:`, error.message);
          }
        }
      }

      console.log(`Carregados ${loadedCommands.length} comandos de ${dirPath}`);
      return loadedCommands;
    } catch (error) {
      console.error(`Erro ao carregar comandos de ${dirPath}:`, error.message);
      throw error;
    }
  }

  async loadCommand(commandPath) {
    try {
      const absolutePath = path.resolve(commandPath);
      
      // Remove do cache do require para permitir recarregamento
      delete require.cache[absolutePath];
      
      const commandModule = require(absolutePath);
      const command = typeof commandModule === 'function' ? new commandModule() : commandModule;

      this._validateCommand(command);
      
      this.registerCommand(command);
      this.commandPaths.set(command.name, absolutePath);

      return command;
    } catch (error) {
      console.error(`Erro ao carregar comando de ${commandPath}:`, error.message);
      throw error;
    }
  }

  registerCommand(command) {
    this._validateCommand(command);

    if (this.commands.has(command.name)) {
      throw new Error(`Comando ${command.name} já está registrado`);
    }

    this.commands.set(command.name, command);
    this.bot.commands.set(command.name, command);

    console.log(`Comando ${command.name} registrado com sucesso`);
  }

  unregisterCommand(commandName) {
    if (!this.commands.has(commandName)) {
      throw new Error(`Comando ${commandName} não está registrado`);
    }

    this.commands.delete(commandName);
    this.bot.commands.delete(commandName);
    this.commandPaths.delete(commandName);

    console.log(`Comando ${commandName} desregistrado com sucesso`);
  }

  async reloadCommand(commandName) {
    const commandPath = this.commandPaths.get(commandName);
    if (!commandPath) {
      throw new Error(`Comando ${commandName} não encontrado no cache de caminhos`);
    }

    try {
      // Desregistrar comando atual
      this.unregisterCommand(commandName);
      
      // Recarregar comando
      const reloadedCommand = await this.loadCommand(commandPath);
      
      console.log(`Comando ${commandName} recarregado com sucesso`);
      return reloadedCommand;
    } catch (error) {
      console.error(`Erro ao recarregar comando ${commandName}:`, error.message);
      throw error;
    }
  }

  getCommand(name) {
    return this.commands.get(name);
  }

  listCommands() {
    return Array.from(this.commands.keys());
  }

  getCommandsByCategory(category) {
    const commands = [];
    
    for (const [name, command] of this.commands) {
      if (command.category === category) {
        commands.push(command);
      }
    }

    return commands;
  }

  getCommandInfo() {
    const info = {};
    
    for (const [name, command] of this.commands) {
      info[name] = {
        description: command.description,
        category: command.category || 'geral',
        cooldown: command.cooldown || 0,
        permissions: command.permissions || [],
        usage: command.usage || `/${name}`,
        examples: command.examples || []
      };
    }

    return info;
  }

  searchCommands(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const [name, command] of this.commands) {
      // Busca por nome
      if (name.toLowerCase().includes(lowerQuery)) {
        results.push({ command, relevance: 10 });
        continue;
      }

      // Busca por descrição
      if (command.description && command.description.toLowerCase().includes(lowerQuery)) {
        results.push({ command, relevance: 5 });
        continue;
      }

      // Busca por categoria
      if (command.category && command.category.toLowerCase().includes(lowerQuery)) {
        results.push({ command, relevance: 3 });
        continue;
      }

      // Busca por aliases
      if (command.aliases && command.aliases.some(alias => 
        alias.toLowerCase().includes(lowerQuery))) {
        results.push({ command, relevance: 8 });
      }
    }

    // Ordenar por relevância
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .map(result => result.command);
  }

  _validateCommand(command) {
    if (!command || typeof command !== 'object') {
      throw new Error('Comando deve ser um objeto');
    }

    if (!command.name || typeof command.name !== 'string') {
      throw new Error('Comando deve ter uma propriedade "name" do tipo string');
    }

    if (!command.description || typeof command.description !== 'string') {
      throw new Error('Comando deve ter uma propriedade "description" do tipo string');
    }

    if (!command.execute || typeof command.execute !== 'function') {
      throw new Error('Comando deve ter uma propriedade "execute" que seja uma função');
    }

    // Validações opcionais
    if (command.permissions && !Array.isArray(command.permissions)) {
      throw new Error('Propriedade "permissions" deve ser um array');
    }

    if (command.cooldown && typeof command.cooldown !== 'number') {
      throw new Error('Propriedade "cooldown" deve ser um número');
    }

    if (command.category && typeof command.category !== 'string') {
      throw new Error('Propriedade "category" deve ser uma string');
    }

    if (command.aliases && !Array.isArray(command.aliases)) {
      throw new Error('Propriedade "aliases" deve ser um array');
    }

    if (command.data && typeof command.data.toJSON !== 'function') {
      throw new Error('Propriedade "data" deve ter um método "toJSON"');
    }
  }
}

module.exports = CommandManager;
