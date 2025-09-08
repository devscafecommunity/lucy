# 📊 Módulos de Banco de Dados do Lucy Bot

Este documento explica como usar os módulos `PersistentDB` e `ShortTermDB` implementados no Lucy Bot.

## 📁 Estrutura dos Módulos

```
src/
├── modules/
│   ├── persistentdb.js    # Conexão com Supabase (dados permanentes)
│   └── shorttermdb.js     # SQLite local (dados temporários)
├── migrations/
│   ├── persistent/        # Migrações do Supabase
│   └── shortterm/         # Migrações do SQLite
└── data/                  # Banco SQLite local (criado automaticamente)
```

## 🚀 Configuração Inicial

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Configurações do Supabase (Banco Persistente)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua_chave_anon_do_supabase_aqui

# Configurações opcionais do SQLite
SQLITE_PATH=./data/shortterm.db
```

### 2. Dependências

As dependências já foram instaladas:
- `@supabase/supabase-js` - Cliente do Supabase
- `better-sqlite3` - Driver SQLite

### 3. Inicialização no Bot

Use o `DatabaseManager` (já implementado) no seu `Bot.js`:

```javascript
const DatabaseManager = require('./database-manager');

class Bot {
  constructor() {
    this.databaseManager = new DatabaseManager();
  }

  async start() {
    // Inicializar bancos antes do login
    await this.databaseManager.initialize();
    
    // ... resto da inicialização
    await this.client.login(process.env.DISCORD_TOKEN);
  }

  getDatabase() {
    return {
      persistent: this.databaseManager.getPersistentDB(),
      shortTerm: this.databaseManager.getShortTermDB()
    };
  }
}
```

## 💾 PersistentDB (Supabase)

### Características
- ✅ Dados permanentes e importantes
- ✅ Backup automático na nuvem
- ✅ Escalabilidade alta
- ✅ Suporte a PostgreSQL completo
- ✅ Sistema de migrações robusto

### Uso Básico

```javascript
const { persistent } = bot.getDatabase();

// Inserir usuário
const user = await persistent.insert('users', {
  discord_id: '123456789',
  username: 'Usuario',
  premium: false
});

// Buscar usuários
const users = await persistent.select('users', {
  where: { premium: true },
  limit: 10,
  order: { column: 'created_at', ascending: false }
});

// Atualizar usuário
await persistent.update('users', 
  { premium: true }, 
  { discord_id: '123456789' }
);

// Deletar usuário
await persistent.delete('users', { discord_id: '123456789' });
```

### Transações
```javascript
await persistent.transaction(async (db) => {
  await db.insert('users', userData);
  await db.insert('user_warnings', warningData);
  // Se qualquer operação falhar, tudo será revertido
});
```

## 🔄 ShortTermDB (SQLite)

### Características
- ✅ Dados temporários e cache
- ✅ Performance alta para operações locais
- ✅ Sem dependência de internet
- ✅ Limpeza automática de dados expirados
- ✅ Ideal para sessões e configurações temporárias

### Uso Básico

```javascript
const { shortTerm } = bot.getDatabase();

// Operações CRUD simples
shortTerm.insert('user_sessions', {
  user_id: '123456789',
  guild_id: '987654321',
  session_data: JSON.stringify({ level: 5 }),
  expires_at: new Date(Date.now() + 3600000).toISOString()
});

// Buscar com opções
const sessions = shortTerm.select('user_sessions', {
  where: { user_id: '123456789' },
  orderBy: 'created_at',
  order: 'DESC',
  limit: 5
});
```

### Sistema de Cache
```javascript
// Armazenar no cache (1 hora de duração)
shortTerm.setCache('user:123456789', { level: 5, coins: 1000 }, 3600);

// Recuperar do cache
const userData = shortTerm.getCache('user:123456789');
if (userData) {
  console.log('Dados do cache:', userData);
}
```

### Configurações Temporárias
```javascript
// Definir configuração (sem expiração)
shortTerm.setSetting('maintenance_mode', true);

// Definir configuração com expiração (2 horas)
shortTerm.setSetting('event_active', { name: 'Double XP' }, 7200);

// Recuperar configuração
const maintenanceMode = shortTerm.getSetting('maintenance_mode');
```

## 📋 Exemplo Prático em Comando

```javascript
class UserInfoCommand {
  async execute(interaction) {
    const { persistent, shortTerm } = bot.getDatabase();
    const targetUser = interaction.options.getUser('usuario');

    try {
      // 1. Verificar cache primeiro (rápido)
      let userData = shortTerm.getCache(`user:${targetUser.id}`);

      if (!userData) {
        // 2. Se não estiver no cache, buscar no banco persistente
        const dbUsers = await persistent.select('users', {
          where: { discord_id: targetUser.id },
          limit: 1
        });

        if (dbUsers.length > 0) {
          userData = dbUsers[0];
        } else {
          // 3. Se não existir, criar novo usuário
          const newUser = await persistent.insert('users', {
            discord_id: targetUser.id,
            username: targetUser.username,
            avatar_url: targetUser.displayAvatarURL()
          });
          userData = newUser[0];
        }

        // 4. Armazenar no cache por 30 minutos
        shortTerm.setCache(`user:${targetUser.id}`, userData, 1800);
      }

      // 5. Criar sessão temporária
      shortTerm.insert('user_sessions', {
        user_id: targetUser.id,
        guild_id: interaction.guild.id,
        session_data: JSON.stringify({ command: 'userinfo' }),
        expires_at: new Date(Date.now() + 3600000).toISOString()
      });

      await interaction.reply(`Usuário: ${userData.username}`);

    } catch (error) {
      console.error('Erro:', error);
      await interaction.reply('❌ Erro ao buscar dados do usuário');
    }
  }
}
```

## 🔧 Migrações

### Criando Migrações

**Para PersistentDB (Supabase):**
```sql
-- migrations/persistent/002_add_premium_features.sql
ALTER TABLE users ADD COLUMN premium_expires_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX idx_users_premium_expires ON users(premium_expires_at);
```

**Para ShortTermDB (SQLite):**
```sql
-- migrations/shortterm/002_add_logs_table.sql
CREATE TABLE action_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Executando Migrações

As migrações são executadas automaticamente na inicialização do bot:

```javascript
await persistent.runMigrations('./migrations/persistent');
await shortTerm.runMigrations('./migrations/shortterm');
```

## 🧹 Limpeza Automática

O `ShortTermDB` possui limpeza automática de dados expirados que roda a cada hora:

```javascript
// Manual
shortTerm.cleanup();

// Estatísticas após limpeza
const stats = shortTerm.getStats();
console.log('Entradas no cache:', stats.cacheEntries);
console.log('Sessões ativas:', stats.sessions);
```

## ⚡ Dicas de Performance

### PersistentDB
- Use índices nas colunas mais consultadas
- Prefira `select` com `where` específico ao invés de buscar tudo
- Use transações para operações múltiplas relacionadas

### ShortTermDB
- Use o cache para dados acessados frequentemente
- Execute `vacuum()` periodicamente para otimização
- Monitore o tamanho do banco com `getStats()`

## 🔒 Segurança

### PersistentDB
- Row Level Security (RLS) habilitado por padrão
- Nunca exponha a `SUPABASE_KEY` no cliente
- Use políticas do Supabase para controle de acesso

### ShortTermDB
- Dados sensíveis devem ser criptografados antes do armazenamento
- O arquivo SQLite é local, proteja o acesso ao servidor

## 📊 Monitoramento

```javascript
// Obter estatísticas dos bancos
const stats = await databaseManager.getStats();
console.log('Stats:', stats);
```

## 🚨 Tratamento de Erros

Ambos os módulos possuem tratamento robusto de erros:

```javascript
try {
  await persistent.select('users', { where: { id: 'invalid' } });
} catch (error) {
  console.error('Erro no banco:', error.message);
  // Implementar fallback ou retry
}
```

---

## 📝 Resumo

- **PersistentDB**: Para dados importantes que precisam ser mantidos permanentemente
- **ShortTermDB**: Para cache, sessões e dados temporários
- **Migrações**: Sistema robusto para evolução do schema
- **Performance**: Cache inteligente e limpeza automática
- **Segurança**: RLS e boas práticas implementadas

Esses módulos tornam o desenvolvimento muito mais eficiente, evitando reescrita de código de banco de dados em cada comando e evento! 🚀
