# 🤖 Lucy Bot

Lucy é um bot Discord modular desenvolvido para a comunidade Dev's Cafe, construído com foco em escalabilidade, manutenibilidade e seguindo princípios de Test-Driven Development (TDD).

## 📋 Índice

- [Características](#-características)
- [Arquitetura](#-arquitetura)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Como Desenvolver](#-como-desenvolver)
- [Comandos Disponíveis](#-comandos-disponíveis)
- [Testes](#-testes)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

## ✨ Características

- **Arquitetura Modular**: Comandos e eventos são carregados dinamicamente de arquivos separados
- **Test-Driven Development**: Todos os componentes possuem testes unitários
- **Gerenciamento de Comandos**: Sistema robusto de comandos slash com cooldowns e permissões
- **Sistema de Eventos**: Gerenciamento flexível de eventos do Discord
- **Funções Utilitárias**: Biblioteca reutilizável de funções comuns
- **Hot Reload**: Capacidade de recarregar comandos e eventos sem reiniciar o bot
- **Tratamento de Erros**: Sistema abrangente de captura e tratamento de erros
- **Logs Detalhados**: Sistema de logs para monitoramento e debug

## 🏗️ Arquitetura

O bot é construído seguindo uma arquitetura modular com separação clara de responsabilidades:

```
src/
├── core/           # Núcleo do sistema
│   ├── Bot.js                 # Cliente principal do Discord
│   ├── CommandManager.js     # Gerenciamento de comandos
│   ├── EventManager.js       # Gerenciamento de eventos
│   └── CommandHandler.js     # Processamento de interações
├── commands/       # Comandos organizados por categoria
│   ├── ping.js
│   └── moderation/
│       └── kick.js
├── events/         # Eventos do Discord
│   └── ready.js
└── utils/          # Funções utilitárias reutilizáveis
    └── index.js
```

### Componentes Principais

- **Bot**: Cliente principal que gerencia a conexão com o Discord
- **CommandManager**: Carrega, registra e gerencia comandos dinamicamente
- **EventManager**: Carrega e gerencia eventos do Discord
- **CommandHandler**: Processa interações e executa comandos
- **Utils**: Biblioteca de funções utilitárias comuns

## 🚀 Instalação

### Pré-requisitos

- Node.js 16.9.0 ou superior
- npm ou yarn
- Uma aplicação Discord Bot configurada

### Passos

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/devscafecommunity/lucy.git
   cd lucy
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Configure as variáveis de ambiente**:
   ```bash
   cp .env.example .env
   ```

4. **Execute os testes** (opcional mas recomendado):
   ```bash
   npm test
   ```

5. **Inicie o bot**:
   ```bash
   npm start
   ```

## ⚙️ Configuração

### Variáveis de Ambiente

Configure o arquivo `.env` com suas credenciais:

```env
# Bot Configuration
DISCORD_TOKEN=seu_token_do_bot
CLIENT_ID=id_da_aplicacao
GUILD_ID=id_do_servidor_de_teste (opcional)

# Environment
NODE_ENV=development

# Logging
LOG_LEVEL=info
```

### Obtendo as Credenciais

1. Acesse o [Discord Developer Portal](https://discord.com/developers/applications)
2. Crie uma nova aplicação ou selecione uma existente
3. Vá para a seção "Bot" e copie o token
4. Em "General Information", copie o Application ID (CLIENT_ID)
5. Para GUILD_ID, ative o modo desenvolvedor no Discord e copie o ID do servidor

## 📁 Estrutura do Projeto

```
lucy/
├── src/
│   ├── core/              # Sistema central
│   │   ├── Bot.js
│   │   ├── CommandManager.js
│   │   ├── EventManager.js
│   │   └── CommandHandler.js
│   ├── commands/          # Comandos do bot
│   │   ├── ping.js
│   │   └── moderation/
│   │       └── kick.js
│   ├── events/           # Eventos do Discord
│   │   └── ready.js
│   └── utils/            # Funções utilitárias
│       └── index.js
├── tests/                # Testes unitários
│   ├── core/
│   ├── commands/
│   ├── events/
│   └── utils/
├── coverage/             # Relatórios de cobertura
├── .env.example         # Exemplo de configuração
├── .env                 # Configuração (não versionada)
├── .gitignore
├── jest.config.js       # Configuração do Jest
├── .eslintrc.json      # Configuração do ESLint
├── package.json
└── README.md
```

## 🛠️ Como Desenvolver

### Criando um Novo Comando

1. **Crie o arquivo de teste primeiro** (`tests/commands/meucomando.test.js`):

```javascript
const MeuComando = require('../../src/commands/meucomando');

describe('MeuComando', () => {
  let comando;
  let mockInteraction;

  beforeEach(() => {
    comando = new MeuComando();
    mockInteraction = {
      reply: jest.fn(),
      user: { username: 'testuser' }
    };
  });

  test('should execute command successfully', async () => {
    await comando.execute(mockInteraction);
    expect(mockInteraction.reply).toHaveBeenCalled();
  });
});
```

2. **Implemente o comando** (`src/commands/meucomando.js`):

```javascript
const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, handleError } = require('../utils');

class MeuComando {
  constructor() {
    this.name = 'meucomando';
    this.description = 'Descrição do meu comando';
    this.category = 'geral';
    this.cooldown = 3000;
    this.permissions = [];

    this.data = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description);
  }

  async execute(interaction) {
    try {
      // Lógica do comando aqui
      await interaction.reply('Comando executado!');
    } catch (error) {
      await handleError(error, interaction, 'meucomando');
    }
  }
}

module.exports = MeuComando;
```

### Criando um Novo Evento

1. **Crie o teste** (`tests/events/meuevent.test.js`):

```javascript
const MeuEvent = require('../../src/events/meuevent');

describe('MeuEvent', () => {
  test('should handle event correctly', async () => {
    const evento = new MeuEvent();
    // Teste aqui
  });
});
```

2. **Implemente o evento** (`src/events/meuevent.js`):

```javascript
class MeuEvent {
  constructor() {
    this.name = 'messageCreate';
    this.once = false;
    this.description = 'Executado quando uma mensagem é criada';
  }

  async execute(message) {
    // Lógica do evento aqui
    console.log(`Nova mensagem: ${message.content}`);
  }
}

module.exports = MeuEvent;
```

### Usando Funções Utilitárias

O projeto inclui funções utilitárias reutilizáveis em `src/utils/index.js`:

```javascript
const { 
  formatDuration, 
  createEmbed, 
  handleError, 
  validateUser 
} = require('../utils');

// Formatar tempo
const tempo = formatDuration(90); // "1 hora e 30 minutos"

// Criar embed
const embed = createEmbed({
  title: 'Título',
  description: 'Descrição',
  color: 'success'
});

// Validar usuário para moderação
const validation = validateUser(interaction, targetUser, targetMember);
if (!validation.valid) {
  return await interaction.reply(validation.reason);
}
```

## 🎯 Comandos Disponíveis

### Utilitários
- `/ping` - Mostra o ping do bot e latência da API

### Moderação
- `/kick` - Expulsa um membro do servidor
- `/ban` - Bane um membro do servidor
- `/timeout` - Aplica timeout em um membro

*Mais comandos serão adicionados conforme o desenvolvimento.*

## 🧪 Testes

O projeto utiliza Jest para testes unitários com cobertura abrangente:

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage

# Executar linting
npm run lint

# Corrigir problemas de linting automaticamente
npm run lint:fix
```

### Estrutura de Testes

- **Core**: Testa componentes fundamentais do sistema
- **Commands**: Testa cada comando individualmente
- **Events**: Testa handlers de eventos
- **Utils**: Testa funções utilitárias

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia com nodemon (auto-restart)
npm start           # Inicia em produção

# Testes
npm test            # Executa todos os testes
npm run test:watch  # Testes em modo watch
npm run test:coverage # Relatório de cobertura

# Code Quality
npm run lint        # Verifica código com ESLint
npm run lint:fix    # Corrige problemas automaticamente
```

## 🤝 Contribuindo

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/MinhaFeature`)
3. **Escreva testes** para sua funcionalidade primeiro
4. **Implemente** a funcionalidade
5. **Commit** suas mudanças (`git commit -m 'Add: MinhaFeature'`)
6. **Push** para a branch (`git push origin feature/MinhaFeature`)
7. Abra um **Pull Request**

### Padrões de Código

- Siga o padrão ESLint configurado
- Escreva testes para todas as novas funcionalidades
- Use commits semânticos (Add:, Fix:, Update:, etc.)
- Mantenha a cobertura de testes acima de 80%

## 📝 Logs e Debug

O bot possui sistema de logs detalhado:

```bash
# Logs de desenvolvimento
NODE_ENV=development npm start

# Logs de produção
NODE_ENV=production npm start
```

### Tipos de Log

- 🤖 **Bot Events**: Inicialização e status
- 📦 **Loading**: Carregamento de componentes
- ⚡ **Commands**: Execução de comandos
- ❌ **Errors**: Erros e exceções
- ⚠️ **Warnings**: Avisos e alertas

## 🐛 Troubleshooting

### Bot não inicia
- Verifique se o token está correto no `.env`
- Confirme se as permissões do bot estão configuradas
- Verifique os logs para erros específicos

### Comandos não aparecem
- Execute os comandos uma vez para registrar no Discord
- Em desenvolvimento, use GUILD_ID para registro rápido
- Em produção, comandos globais podem levar até 1 hora

### Testes falhando
- Execute `npm install` para garantir dependências
- Limpe o cache do Jest: `npx jest --clearCache`
- Verifique se não há conflitos de portas/recursos

## 📋 TODO

- [ ] Sistema de database
- [ ] Comandos de economia
- [ ] Sistema de níveis
- [ ] Dashboard web
- [ ] Integração com APIs externas
- [ ] Sistema de tickets
- [ ] Comandos de música

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Equipe

- **Dev's Cafe Community** - Desenvolvimento e manutenção

---

Para mais informações ou dúvidas, entre em contato com a comunidade Dev's Cafe!
