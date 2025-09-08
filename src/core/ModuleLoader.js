const fs = require('fs');
const path = require('path');

class ModuleLoader {
  constructor(bot) {
    this.bot = bot;
    this.moduleCache = new Map();
  }

  async loadFromDirectory(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) {
        throw new Error(`Diretório ${dirPath} não encontrado`);
      }

      const files = fs.readdirSync(dirPath);
      const loadedModules = [];

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          // Recursivamente carrega módulos de subdiretórios
          const subModules = await this.loadFromDirectory(filePath);
          loadedModules.push(...subModules);
        } else if (file.endsWith('.js') && !file.startsWith('.')) {
          try {
            const module = await this.loadModule(filePath);
            if (module) {
              loadedModules.push(module);
            }
          } catch (error) {
            console.error(`Erro ao carregar módulo ${file}:`, error.message);
          }
        }
      }

      console.log(`Carregados ${loadedModules.length} módulos de ${dirPath}`);
      return loadedModules;
    } catch (error) {
      console.error(`Erro ao carregar módulos de ${dirPath}:`, error.message);
      throw error;
    }
  }

  async loadModule(modulePath) {
    try {
      const absolutePath = path.resolve(modulePath);
      
      // Remove do cache do require para permitir recarregamento
      delete require.cache[absolutePath];
      
      const moduleExports = require(absolutePath);
      const module = typeof moduleExports === 'function' ? new moduleExports() : moduleExports;

      this._validateModule(module);
      
      this.bot.loadModule(module);
      this.moduleCache.set(module.name, {
        path: absolutePath,
        module: module,
        loadTime: new Date()
      });

      return module;
    } catch (error) {
      console.error(`Erro ao carregar módulo de ${modulePath}:`, error.message);
      throw error;
    }
  }

  async reloadModule(moduleName) {
    const cachedModule = this.moduleCache.get(moduleName);
    if (!cachedModule) {
      throw new Error(`Módulo ${moduleName} não encontrado no cache`);
    }

    try {
      // Descarrega o módulo atual
      this.bot.unloadModule(moduleName);
      
      // Recarrega o módulo
      await this.loadModule(cachedModule.path);
      
      console.log(`Módulo ${moduleName} recarregado com sucesso`);
    } catch (error) {
      console.error(`Erro ao recarregar módulo ${moduleName}:`, error.message);
      throw error;
    }
  }

  unloadModule(moduleName) {
    try {
      this.bot.unloadModule(moduleName);
      this.moduleCache.delete(moduleName);
      console.log(`Módulo ${moduleName} descarregado com sucesso`);
    } catch (error) {
      console.error(`Erro ao descarregar módulo ${moduleName}:`, error.message);
      throw error;
    }
  }

  listLoadedModules() {
    return Array.from(this.moduleCache.keys());
  }

  getModuleInfo(moduleName) {
    return this.moduleCache.get(moduleName);
  }

  _validateModule(module) {
    if (!module || typeof module !== 'object') {
      throw new Error('Módulo deve ser um objeto');
    }

    if (!module.name || typeof module.name !== 'string') {
      throw new Error('Módulo deve ter uma propriedade "name" do tipo string');
    }

    if (!module.version || typeof module.version !== 'string') {
      throw new Error('Módulo deve ter uma propriedade "version" do tipo string');
    }

    // Validações opcionais
    if (module.commands && !Array.isArray(module.commands)) {
      throw new Error('Propriedade "commands" deve ser um array');
    }

    if (module.events && !Array.isArray(module.events)) {
      throw new Error('Propriedade "events" deve ser um array');
    }

    if (module.init && typeof module.init !== 'function') {
      throw new Error('Propriedade "init" deve ser uma função');
    }

    if (module.destroy && typeof module.destroy !== 'function') {
      throw new Error('Propriedade "destroy" deve ser uma função');
    }
  }
}

module.exports = ModuleLoader;
