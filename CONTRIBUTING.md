# Contribuindo para Lucy Bot

Obrigado pelo interesse em contribuir com o Lucy Bot! Este guia vai te ajudar a entender como contribuir efetivamente.

## 🚀 Como Começar

### 1. Configuração do Ambiente

1. Faça fork do repositório
2. Clone seu fork:
   ```bash
   git clone https://github.com/seu-usuario/lucy.git
   cd lucy
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Configure o ambiente:
   ```bash
   cp .env.example .env
   # Edite o .env com suas credenciais
   ```

### 2. Executar Testes

Antes de fazer qualquer alteração, certifique-se de que todos os testes passam:

```bash
npm test
```

## 📝 Padrões de Desenvolvimento

### Test-Driven Development (TDD)

**SEMPRE** escreva os testes primeiro, depois implemente a funcionalidade:

1. **Red**: Escreva um teste que falhe
2. **Green**: Escreva o código mínimo para passar
3. **Refactor**: Melhore o código mantendo os testes passando

### Padrão de Commits

Use commits semânticos:

- `Add: nova funcionalidade`
- `Fix: correção de bug`
- `Update: alteração em funcionalidade existente`
- `Remove: remoção de código`
- `Docs: alterações na documentação`
- `Test: adição ou alteração de testes`
- `Refactor: refatoração sem mudança de funcionalidade`

### Estrutura de Branch

- `main` - Branch principal (protegida)
- `develop` - Branch de desenvolvimento
- `feature/nome-da-feature` - Novas funcionalidades
- `fix/nome-do-bug` - Correções
- `hotfix/nome-do-hotfix` - Correções urgentes

## 🛠️ Tipos de Contribuição

### 1. Adicionando Comandos

#### Exemplo: Comando de Ajuda

**1. Criar teste primeiro:**
```javascript
// tests/commands/help.test.js
const HelpCommand = require('../../src/commands/help');

describe('HelpCommand', () => {
  test('should list available commands', async () => {
    const command = new HelpCommand();
    const mockInteraction = {
      reply: jest.fn()
    };
    
    await command.execute(mockInteraction);
    
    expect(mockInteraction.reply).toHaveBeenCalled();
  });
});
```

**2. Implementar comando:**
```javascript
// src/commands/help.js
const { SlashCommandBuilder } = require('discord.js');

class HelpCommand {
  constructor() {
    this.name = 'help';
    this.description = 'Mostra lista de comandos disponíveis';
    // ... resto da implementação
  }
  
  async execute(interaction) {
    // Implementação
  }
}

module.exports = HelpCommand;
```

### 2. Adicionando Eventos

Similar aos comandos, mas na pasta `src/events/`:

```javascript
// src/events/guildMemberAdd.js
class GuildMemberAddEvent {
  constructor() {
    this.name = 'guildMemberAdd';
    this.once = false;
  }
  
  async execute(member) {
    // Lógica do evento
  }
}

module.exports = GuildMemberAddEvent;
```

### 3. Adicionando Utilitários

Funções reutilizáveis em `src/utils/index.js`:

```javascript
/**
 * Nova função utilitária
 * @param {string} input - Entrada
 * @returns {string} Saída processada
 */
function minhaFuncao(input) {
  // Implementação
  return input.toUpperCase();
}

module.exports = {
  // ... outras funções
  minhaFuncao
};
```

## 🧪 Padrões de Teste

### 1. Estrutura de Teste

```javascript
describe('NomeDoComponente', () => {
  let component;
  let mockDependencies;

  beforeEach(() => {
    // Setup antes de cada teste
    mockDependencies = {
      // mocks necessários
    };
    component = new NomeDoComponente(mockDependencies);
  });

  afterEach(() => {
    // Limpeza após cada teste
    jest.clearAllMocks();
  });

  test('should do something specific', () => {
    // Arrange (preparar)
    const input = 'test input';
    
    // Act (executar)
    const result = component.method(input);
    
    // Assert (verificar)
    expect(result).toBe('expected output');
  });
});
```

### 2. Cobertura de Testes

Mantenha a cobertura acima de 80%:

```bash
npm run test:coverage
```

### 3. Mocking

Use mocks para dependências externas:

```javascript
jest.mock('discord.js');
jest.mock('../utils');

const mockInteraction = {
  reply: jest.fn(),
  user: { id: '123', username: 'testuser' },
  guild: { id: '456', name: 'Test Guild' }
};
```

## 🔍 Code Review

### Checklist para Pull Requests

- [ ] Todos os testes passam
- [ ] Cobertura de testes mantida/aumentada
- [ ] Código segue padrões ESLint
- [ ] Documentação atualizada (se necessário)
- [ ] Commits seguem padrão semântico
- [ ] Funcionalidade testada manualmente
- [ ] Não quebra funcionalidades existentes

### O que revisar

1. **Funcionalidade**: O código faz o que deveria?
2. **Testes**: Há testes adequados?
3. **Performance**: Há problemas de performance?
4. **Segurança**: Há vulnerabilidades?
5. **Padrões**: Segue os padrões do projeto?

## 🐛 Reportando Bugs

Use o template de issue para bugs:

```markdown
**Descrição do Bug**
Descrição clara do problema.

**Para Reproduzir**
1. Execute comando X
2. Faça Y
3. Veja erro Z

**Comportamento Esperado**
O que deveria acontecer.

**Screenshots/Logs**
Se aplicável, adicione prints ou logs.

**Ambiente**
- OS: [Windows/Linux/Mac]
- Node.js: [versão]
- Discord.js: [versão]
```

## 💡 Sugerindo Funcionalidades

Use o template de feature request:

```markdown
**Sua sugestão está relacionada a um problema?**
Descrição clara do problema.

**Descreva a solução que você gostaria**
Descrição clara do que você quer.

**Descreva alternativas consideradas**
Outras soluções que você pensou.

**Contexto adicional**
Qualquer contexto ou screenshot.
```

## 📞 Comunicação

### Canais de Comunicação

- **GitHub Issues**: Para bugs e features
- **GitHub Discussions**: Para perguntas gerais
- **Discord da Dev's Cafe**: Para discussões em tempo real

### Etiqueta

- Seja respeitoso e construtivo
- Use linguagem clara e objetiva
- Forneça contexto suficiente
- Seja paciente com reviews

## 🏆 Reconhecimento

Contribuições significativas serão reconhecidas:

- Adição ao arquivo CONTRIBUTORS.md
- Menção nas release notes
- Badge de contribuidor no Discord

## 📚 Recursos Úteis

- [Discord.js Guide](https://discordjs.guide/)
- [Jest Documentation](https://jestjs.io/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Dúvidas?** Abra uma issue com a tag `question` ou entre no Discord da Dev's Cafe!

Obrigado por contribuir! 🎉
