/**
 * Exemplo de como inicializar e configurar os módulos de banco de dados
 * Adicione este código ao seu Bot.js ou em um módulo de inicialização
 */

const PersistentDB = require('./src/modules/persistentdb');
const ShortTermDB = require('./src/modules/shorttermdb');

class DatabaseManager {
  constructor() {
    this.persistentDB = new PersistentDB();
    this.shortTermDB = new ShortTermDB();
    this.isInitialized = false;
  }

  /**
   * Inicializa ambos os bancos de dados
   */
  async initialize() {
    try {
      console.log('🔄 Inicializando bancos de dados...');

      // Inicializar banco persistente (Supabase)
      if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
        await this.persistentDB.initialize(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_KEY
        );
        
        // Executar migrações do banco persistente
        await this.persistentDB.runMigrations('./migrations/persistent');
      } else {
        console.warn('⚠️  Variáveis SUPABASE_URL e SUPABASE_KEY não encontradas. PersistentDB não será inicializado.');
      }

      // Inicializar banco de curto prazo (SQLite)
      await this.shortTermDB.initialize('./data/shortterm.db');
      
      // Executar migrações do banco de curto prazo
      await this.shortTermDB.runMigrations('./migrations/shortterm');

      // Configurar limpeza automática de dados expirados (a cada hora)
      this.setupCleanupInterval();

      this.isInitialized = true;
      console.log('✅ Bancos de dados inicializados com sucesso');

      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar bancos de dados:', error.message);
      throw error;
    }
  }

  /**
   * Configura limpeza automática de dados expirados
   */
  setupCleanupInterval() {
    // Limpeza a cada hora (3600000 ms)
    setInterval(() => {
      try {
        this.shortTermDB.cleanup();
        console.log('🧹 Limpeza automática concluída');
      } catch (error) {
        console.error('❌ Erro na limpeza automática:', error.message);
      }
    }, 3600000);

    console.log('⏰ Limpeza automática configurada (a cada hora)');
  }

  /**
   * Obtém uma instância do banco persistente
   */
  getPersistentDB() {
    if (!this.isInitialized) {
      throw new Error('DatabaseManager não foi inicializado. Chame initialize() primeiro.');
    }
    return this.persistentDB;
  }

  /**
   * Obtém uma instância do banco de curto prazo
   */
  getShortTermDB() {
    if (!this.isInitialized) {
      throw new Error('DatabaseManager não foi inicializado. Chame initialize() primeiro.');
    }
    return this.shortTermDB;
  }

  /**
   * Obtém estatísticas dos bancos
   */
  async getStats() {
    const stats = {
      shortTerm: this.shortTermDB.getStats(),
      persistent: null
    };

    try {
      // Exemplo de estatísticas do banco persistente
      const userCount = await this.persistentDB.select('users', { select: 'COUNT(*) as count' });
      const guildCount = await this.persistentDB.select('guilds', { select: 'COUNT(*) as count' });
      
      stats.persistent = {
        users: userCount[0]?.count || 0,
        guilds: guildCount[0]?.count || 0
      };
    } catch (error) {
      console.warn('Não foi possível obter estatísticas do banco persistente:', error.message);
    }

    return stats;
  }

  /**
   * Fecha as conexões dos bancos
   */
  async shutdown() {
    console.log('🔄 Fechando conexões dos bancos de dados...');
    
    try {
      await this.persistentDB.disconnect();
      this.shortTermDB.close();
      
      console.log('✅ Bancos de dados desconectados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao fechar bancos de dados:', error.message);
    }
  }
}

// Exemplo de uso no Bot.js
/*
const DatabaseManager = require('./database-manager');

class Bot {
  constructor() {
    this.databaseManager = new DatabaseManager();
    // ... outras propriedades
  }

  async start() {
    try {
      // Inicializar bancos antes de fazer login
      await this.databaseManager.initialize();
      
      // ... resto da inicialização do bot
      await this.client.login(process.env.BOT_TOKEN);
      
    } catch (error) {
      console.error('Erro ao iniciar bot:', error);
      process.exit(1);
    }
  }

  // Método para obter os bancos em comandos/eventos
  getDatabase() {
    return {
      persistent: this.databaseManager.getPersistentDB(),
      shortTerm: this.databaseManager.getShortTermDB()
    };
  }

  async stop() {
    await this.databaseManager.shutdown();
    // ... resto do cleanup
  }
}
*/

module.exports = DatabaseManager;
