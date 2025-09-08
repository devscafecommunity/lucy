const Database = require('better-sqlite3');
const fs = require('fs').promises;
const path = require('path');

/**
 * Classe para gerenciar banco de dados SQLite local (banco de dados de curto prazo)
 * Usado para dados temporários, cache, sessões e operações corriqueiras do bot
 */
class ShortTermDB {
  constructor() {
    this.db = null;
    this.isConnected = false;
    this.migrationTableName = '_migrations';
    this.dbPath = './data/shortterm.db';
  }

  /**
   * Inicializa a conexão com o banco SQLite
   * @param {string} dbPath - Caminho para o arquivo do banco de dados
   * @param {Object} options - Opções de configuração
   */
  async initialize(dbPath = null, options = {}) {
    try {
      if (dbPath) {
        this.dbPath = dbPath;
      }

      // Cria o diretório se não existir
      const dbDir = path.dirname(this.dbPath);
      await fs.mkdir(dbDir, { recursive: true });

      // Configurações padrão do SQLite
      const defaultOptions = {
        verbose: process.env.NODE_ENV === 'development' ? console.log : null,
        fileMustExist: false,
        timeout: 5000,
        ...options
      };

      this.db = new Database(this.dbPath, defaultOptions);
      this.isConnected = true;

      // Configurações de performance e segurança
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('temp_store = MEMORY');

      await this.createMigrationsTable();
      
      console.log(`✅ ShortTermDB inicializado: ${this.dbPath}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar ShortTermDB:', error.message);
      throw error;
    }
  }

  /**
   * Cria a tabela de migrações se ela não existir
   */
  async createMigrationsTable() {
    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS ${this.migrationTableName} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (error) {
      console.warn('Aviso ao criar tabela de migrações:', error.message);
    }
  }

  /**
   * Executa uma query SQL
   * @param {string} sql - Query SQL para executar
   * @param {Array} params - Parâmetros para a query
   */
  execute(sql, params = []) {
    this.checkConnection();
    
    try {
      const stmt = this.db.prepare(sql);
      return stmt.run(...params);
    } catch (error) {
      console.error('Erro ao executar SQL:', error.message);
      throw error;
    }
  }

  /**
   * Executa uma query de seleção
   * @param {string} sql - Query SQL SELECT
   * @param {Array} params - Parâmetros para a query
   */
  query(sql, params = []) {
    this.checkConnection();
    
    try {
      const stmt = this.db.prepare(sql);
      return stmt.all(...params);
    } catch (error) {
      console.error('Erro ao executar query:', error.message);
      throw error;
    }
  }

  /**
   * Executa uma query que retorna uma única linha
   * @param {string} sql - Query SQL SELECT
   * @param {Array} params - Parâmetros para a query
   */
  queryOne(sql, params = []) {
    this.checkConnection();
    
    try {
      const stmt = this.db.prepare(sql);
      return stmt.get(...params);
    } catch (error) {
      console.error('Erro ao executar queryOne:', error.message);
      throw error;
    }
  }

  /**
   * Executa migrações de banco de dados
   * @param {string} migrationsDir - Diretório contendo os arquivos de migração
   */
  async runMigrations(migrationsDir = './migrations/shortterm') {
    this.checkConnection();
    
    try {
      console.log('🔄 Executando migrações do banco de curto prazo...');
      
      // Verifica se o diretório existe
      const migrationsPath = path.resolve(migrationsDir);
      try {
        await fs.access(migrationsPath);
      } catch {
        console.log('📁 Diretório de migrações não encontrado, criando...');
        await fs.mkdir(migrationsPath, { recursive: true });
        
        // Cria uma migração exemplo
        await this.createExampleMigration(migrationsPath);
        return;
      }

      // Lista arquivos de migração
      const files = await fs.readdir(migrationsPath);
      const migrationFiles = files
        .filter(file => file.endsWith('.sql'))
        .sort();

      if (migrationFiles.length === 0) {
        console.log('📄 Nenhuma migração encontrada');
        await this.createExampleMigration(migrationsPath);
        return;
      }

      // Verifica quais migrações já foram executadas
      const executedMigrations = this.query(
        `SELECT name FROM ${this.migrationTableName}`
      );
      const executedNames = new Set(executedMigrations.map(m => m.name));

      // Executa migrações pendentes
      for (const file of migrationFiles) {
        if (!executedNames.has(file)) {
          await this.executeMigration(migrationsPath, file);
        } else {
          console.log(`⏭️  Migração ${file} já foi executada`);
        }
      }

      console.log('✅ Migrações concluídas');
    } catch (error) {
      console.error('❌ Erro ao executar migrações:', error.message);
      throw error;
    }
  }

  /**
   * Executa uma migração específica
   * @param {string} migrationsPath - Caminho para o diretório de migrações
   * @param {string} fileName - Nome do arquivo de migração
   */
  async executeMigration(migrationsPath, fileName) {
    try {
      console.log(`🔄 Executando migração: ${fileName}`);
      
      const filePath = path.join(migrationsPath, fileName);
      const sql = await fs.readFile(filePath, 'utf8');
      
      // Executa a migração em uma transação
      const transaction = this.db.transaction(() => {
        this.db.exec(sql);
        this.execute(
          `INSERT INTO ${this.migrationTableName} (name) VALUES (?)`,
          [fileName]
        );
      });
      
      transaction();
      
      console.log(`✅ Migração ${fileName} executada com sucesso`);
    } catch (error) {
      console.error(`❌ Erro ao executar migração ${fileName}:`, error.message);
      throw error;
    }
  }

  /**
   * Cria uma migração de exemplo
   * @param {string} migrationsPath - Caminho para o diretório de migrações
   */
  async createExampleMigration(migrationsPath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${timestamp}_001_initial_tables.sql`;
    const filePath = path.join(migrationsPath, fileName);
    
    const exampleSQL = `-- Migração inicial para tabelas do bot
-- Tabela para armazenar configurações temporárias
CREATE TABLE IF NOT EXISTS bot_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para cache de dados
CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para sessões de usuário
CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  session_data TEXT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, guild_id)
);

-- Tabela para logs temporários
CREATE TABLE IF NOT EXISTS temp_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_logs_created ON temp_logs(created_at);
`;

    await fs.writeFile(filePath, exampleSQL, 'utf8');
    console.log(`📝 Migração exemplo criada: ${fileName}`);
  }

  /**
   * Operações CRUD simplificadas
   */

  /**
   * Insere dados em uma tabela
   * @param {string} table - Nome da tabela
   * @param {Object} data - Dados para inserir
   */
  insert(table, data) {
    this.checkConnection();
    
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    return this.execute(sql, values);
  }

  /**
   * Busca dados de uma tabela
   * @param {string} table - Nome da tabela
   * @param {Object} options - Opções de busca
   */
  select(table, options = {}) {
    this.checkConnection();
    
    let sql = `SELECT ${options.select || '*'} FROM ${table}`;
    const params = [];
    
    if (options.where) {
      const whereClause = Object.keys(options.where)
        .map(key => `${key} = ?`)
        .join(' AND ');
      sql += ` WHERE ${whereClause}`;
      params.push(...Object.values(options.where));
    }
    
    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy}`;
      if (options.order === 'DESC') {
        sql += ' DESC';
      }
    }
    
    if (options.limit) {
      sql += ` LIMIT ${options.limit}`;
    }
    
    return options.single ? this.queryOne(sql, params) : this.query(sql, params);
  }

  /**
   * Atualiza dados em uma tabela
   * @param {string} table - Nome da tabela
   * @param {Object} data - Dados para atualizar
   * @param {Object} where - Condições WHERE
   */
  update(table, data, where) {
    this.checkConnection();
    
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    const params = [...Object.values(data), ...Object.values(where)];
    
    return this.execute(sql, params);
  }

  /**
   * Remove dados de uma tabela
   * @param {string} table - Nome da tabela
   * @param {Object} where - Condições WHERE
   */
  delete(table, where) {
    this.checkConnection();
    
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    
    return this.execute(sql, Object.values(where));
  }

  /**
   * Executa uma transação
   * @param {Function} callback - Função que contém as operações da transação
   */
  transaction(callback) {
    this.checkConnection();
    
    const transaction = this.db.transaction(() => {
      return callback(this);
    });
    
    return transaction();
  }

  /**
   * Utilitários específicos para cache e sessões
   */

  /**
   * Define um valor no cache
   * @param {string} key - Chave do cache
   * @param {any} data - Dados para cachear
   * @param {number} ttl - Tempo de vida em segundos (padrão: 1 hora)
   */
  setCache(key, data, ttl = 3600) {
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
    
    return this.execute(
      'INSERT OR REPLACE INTO cache (key, data, expires_at) VALUES (?, ?, ?)',
      [key, JSON.stringify(data), expiresAt]
    );
  }

  /**
   * Obtém um valor do cache
   * @param {string} key - Chave do cache
   */
  getCache(key) {
    const result = this.queryOne(
      'SELECT data FROM cache WHERE key = ? AND expires_at > CURRENT_TIMESTAMP',
      [key]
    );
    
    return result ? JSON.parse(result.data) : null;
  }

  /**
   * Define uma configuração do bot
   * @param {string} key - Chave da configuração
   * @param {any} value - Valor da configuração
   * @param {number} ttl - Tempo de vida em segundos (opcional)
   */
  setSetting(key, value, ttl = null) {
    const expiresAt = ttl ? new Date(Date.now() + ttl * 1000).toISOString() : null;
    
    return this.execute(
      'INSERT OR REPLACE INTO bot_settings (key, value, expires_at) VALUES (?, ?, ?)',
      [key, JSON.stringify(value), expiresAt]
    );
  }

  /**
   * Obtém uma configuração do bot
   * @param {string} key - Chave da configuração
   */
  getSetting(key) {
    const result = this.queryOne(
      'SELECT value FROM bot_settings WHERE key = ? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)',
      [key]
    );
    
    return result ? JSON.parse(result.value) : null;
  }

  /**
   * Limpa dados expirados
   */
  cleanup() {
    console.log('🧹 Limpando dados expirados...');
    
    const cacheDeleted = this.execute(
      'DELETE FROM cache WHERE expires_at <= CURRENT_TIMESTAMP'
    ).changes;
    
    const settingsDeleted = this.execute(
      'DELETE FROM bot_settings WHERE expires_at IS NOT NULL AND expires_at <= CURRENT_TIMESTAMP'
    ).changes;
    
    const sessionsDeleted = this.execute(
      'DELETE FROM user_sessions WHERE expires_at <= CURRENT_TIMESTAMP'
    ).changes;
    
    console.log(`🗑️  Removidos: ${cacheDeleted} caches, ${settingsDeleted} configurações, ${sessionsDeleted} sessões`);
    
    return { cacheDeleted, settingsDeleted, sessionsDeleted };
  }

  /**
   * Verifica se a conexão está ativa
   */
  checkConnection() {
    if (!this.isConnected || !this.db) {
      throw new Error('ShortTermDB não está inicializado. Chame initialize() primeiro.');
    }
  }

  /**
   * Fecha a conexão
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isConnected = false;
      console.log('🔌 ShortTermDB desconectado');
    }
  }

  /**
   * Obtém estatísticas do banco
   */
  getStats() {
    this.checkConnection();
    
    return {
      cacheEntries: this.queryOne('SELECT COUNT(*) as count FROM cache')?.count || 0,
      settings: this.queryOne('SELECT COUNT(*) as count FROM bot_settings')?.count || 0,
      sessions: this.queryOne('SELECT COUNT(*) as count FROM user_sessions')?.count || 0,
      logs: this.queryOne('SELECT COUNT(*) as count FROM temp_logs')?.count || 0,
      dbSize: fs.statSync?.(this.dbPath)?.size || 0
    };
  }

  /**
   * Executa VACUUM para otimizar o banco
   */
  vacuum() {
    this.checkConnection();
    console.log('🔧 Otimizando banco de dados...');
    this.db.exec('VACUUM');
    console.log('✅ Otimização concluída');
  }
}

module.exports = ShortTermDB;
