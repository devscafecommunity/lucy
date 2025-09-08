const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

/**
 * Classe para gerenciar conexão e operações com Supabase (banco de dados persistente)
 * Usada para dados importantes que precisam ser mantidos permanentemente
 */
class PersistentDB {
  constructor() {
    this.supabase = null;
    this.isConnected = false;
    this.migrationTableName = '_migrations';
  }

  /**
   * Inicializa a conexão com o Supabase
   * @param {string} supabaseUrl - URL do projeto Supabase
   * @param {string} supabaseKey - Chave de acesso do Supabase
   */
  async initialize(supabaseUrl, supabaseKey) {
    try {
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('URL e chave do Supabase são obrigatórias');
      }

      this.supabase = createClient(supabaseUrl, supabaseKey);
      
      // Testa a conexão
      const { error } = await this.supabase.from('_health_check').select('*').limit(1);
      if (error && error.code !== 'PGRST116') { // PGRST116 = tabela não existe, o que é ok
        console.log('Conexão com Supabase estabelecida com sucesso');
      }
      
      this.isConnected = true;
      await this.createMigrationsTable();
      
      console.log('✅ PersistentDB inicializado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar PersistentDB:', error.message);
      throw error;
    }
  }

  /**
   * Cria a tabela de migrações se ela não existir
   */
  async createMigrationsTable() {
    try {
      const { error } = await this.supabase.rpc('create_migrations_table');
      
      if (error && !error.message.includes('already exists')) {
        // Se a função RPC não existir, usa SQL direto
        await this.executeSQL(`
          CREATE TABLE IF NOT EXISTS ${this.migrationTableName} (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `);
      }
    } catch (error) {
      console.warn('Aviso ao criar tabela de migrações:', error.message);
    }
  }

  /**
   * Executa uma query SQL raw no Supabase
   * @param {string} sql - Query SQL para executar
   * @param {Array} params - Parâmetros para a query
   */
  async executeSQL(sql, params = []) {
    this.checkConnection();
    
    try {
      const { data, error } = await this.supabase.rpc('execute_sql', {
        sql_query: sql,
        params: params
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao executar SQL:', error.message);
      throw error;
    }
  }

  /**
   * Executa migrações de banco de dados
   * @param {string} migrationsDir - Diretório contendo os arquivos de migração
   */
  async runMigrations(migrationsDir = './migrations/persistent') {
    this.checkConnection();
    
    try {
      console.log('🔄 Executando migrações do banco persistente...');
      
      // Verifica se o diretório existe
      const migrationsPath = path.resolve(migrationsDir);
      try {
        await fs.access(migrationsPath);
      } catch {
        console.log('📁 Diretório de migrações não encontrado, criando...');
        await fs.mkdir(migrationsPath, { recursive: true });
        return;
      }

      // Lista arquivos de migração
      const files = await fs.readdir(migrationsPath);
      const migrationFiles = files
        .filter(file => file.endsWith('.sql'))
        .sort();

      if (migrationFiles.length === 0) {
        console.log('📄 Nenhuma migração encontrada');
        return;
      }

      // Verifica quais migrações já foram executadas
      const { data: executedMigrations } = await this.supabase
        .from(this.migrationTableName)
        .select('name');

      const executedNames = new Set(
        executedMigrations?.map(m => m.name) || []
      );

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
      
      // Executa a migração
      await this.executeSQL(sql);
      
      // Registra a migração como executada
      await this.supabase
        .from(this.migrationTableName)
        .insert({ name: fileName });
      
      console.log(`✅ Migração ${fileName} executada com sucesso`);
    } catch (error) {
      console.error(`❌ Erro ao executar migração ${fileName}:`, error.message);
      throw error;
    }
  }

  /**
   * Operações CRUD simplificadas
   */

  /**
   * Insere dados em uma tabela
   * @param {string} table - Nome da tabela
   * @param {Object|Array} data - Dados para inserir
   */
  async insert(table, data) {
    this.checkConnection();
    const { data: result, error } = await this.supabase
      .from(table)
      .insert(data)
      .select();
    
    if (error) throw error;
    return result;
  }

  /**
   * Busca dados de uma tabela
   * @param {string} table - Nome da tabela
   * @param {Object} options - Opções de busca (select, where, limit, etc.)
   */
  async select(table, options = {}) {
    this.checkConnection();
    
    let query = this.supabase.from(table);
    
    if (options.select) {
      query = query.select(options.select);
    } else {
      query = query.select('*');
    }
    
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.order) {
      query = query.order(options.order.column, { ascending: options.order.ascending !== false });
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Atualiza dados em uma tabela
   * @param {string} table - Nome da tabela
   * @param {Object} data - Dados para atualizar
   * @param {Object} where - Condições WHERE
   */
  async update(table, data, where) {
    this.checkConnection();
    
    let query = this.supabase.from(table).update(data);
    
    Object.entries(where).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data: result, error } = await query.select();
    if (error) throw error;
    return result;
  }

  /**
   * Remove dados de uma tabela
   * @param {string} table - Nome da tabela
   * @param {Object} where - Condições WHERE
   */
  async delete(table, where) {
    this.checkConnection();
    
    let query = this.supabase.from(table);
    
    Object.entries(where).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { error } = await query.delete();
    if (error) throw error;
    return true;
  }

  /**
   * Executa uma transação
   * @param {Function} callback - Função que contém as operações da transação
   */
  async transaction(callback) {
    this.checkConnection();
    
    try {
      // Supabase não tem transações explícitas via JS client
      // Mas podemos simular com RPC que executa múltiplas operações
      return await callback(this);
    } catch (error) {
      console.error('Erro na transação:', error.message);
      throw error;
    }
  }

  /**
   * Verifica se a conexão está ativa
   */
  checkConnection() {
    if (!this.isConnected || !this.supabase) {
      throw new Error('PersistentDB não está inicializado. Chame initialize() primeiro.');
    }
  }

  /**
   * Fecha a conexão (cleanup)
   */
  async disconnect() {
    this.supabase = null;
    this.isConnected = false;
    console.log('🔌 PersistentDB desconectado');
  }

  /**
   * Utilitários
   */

  /**
   * Verifica se uma tabela existe
   * @param {string} tableName - Nome da tabela
   */
  async tableExists(tableName) {
    try {
      const { error } = await this.supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      return !error || error.code !== 'PGRST116';
    } catch {
      return false;
    }
  }

  /**
   * Obtém informações sobre uma tabela
   * @param {string} tableName - Nome da tabela
   */
  async getTableInfo(tableName) {
    try {
      const { data, error } = await this.supabase.rpc('get_table_info', {
        table_name: tableName
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Não foi possível obter informações da tabela:', error.message);
      return null;
    }
  }
}

module.exports = PersistentDB;
