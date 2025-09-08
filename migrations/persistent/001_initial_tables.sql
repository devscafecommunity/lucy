-- Migração inicial para banco persistente (Supabase)
-- Tabela de usuários do bot
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discord_id TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    discriminator TEXT,
    avatar_url TEXT,
    premium BOOLEAN DEFAULT FALSE,
    banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de servidores (guilds)
CREATE TABLE IF NOT EXISTS guilds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discord_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    icon_url TEXT,
    owner_id TEXT NOT NULL,
    premium BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de warnings/punições
CREATE TABLE IF NOT EXISTS user_warnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_discord_id TEXT NOT NULL,
    guild_discord_id TEXT NOT NULL,
    moderator_discord_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('warn', 'kick', 'ban', 'timeout')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs de moderação
CREATE TABLE IF NOT EXISTS moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_discord_id TEXT NOT NULL,
    moderator_discord_id TEXT NOT NULL,
    target_discord_id TEXT NOT NULL,
    action TEXT NOT NULL,
    reason TEXT,
    duration TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);
CREATE INDEX IF NOT EXISTS idx_guilds_discord_id ON guilds(discord_id);
CREATE INDEX IF NOT EXISTS idx_warnings_user_guild ON user_warnings(user_discord_id, guild_discord_id);
CREATE INDEX IF NOT EXISTS idx_warnings_created ON user_warnings(created_at);
CREATE INDEX IF NOT EXISTS idx_mod_logs_guild ON moderation_logs(guild_discord_id);
CREATE INDEX IF NOT EXISTS idx_mod_logs_created ON moderation_logs(created_at);

-- RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guilds_updated_at BEFORE UPDATE ON guilds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
