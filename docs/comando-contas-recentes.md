# 🔍 Comando: Contas Recentes

O comando `/contas-recentes` é uma ferramenta poderosa de moderação que permite identificar usuários com contas criadas recentemente ou que entraram no servidor há pouco tempo. Útil para detectar possíveis contas alternativas, raids ou usuários suspeitos.

## 📋 Informações do Comando

- **Nome:** `/contas-recentes`
- **Categoria:** Moderação
- **Permissões:** `ModerateMembers` (Moderar Membros)
- **Cooldown:** 30 segundos

## 🎯 Funcionalidades

### ✅ O que o comando faz:
- Analisa todos os membros do servidor
- Identifica contas criadas recentemente (padrão: menos de 30 dias)
- Identifica usuários que entraram no servidor recentemente
- Gera um arquivo TXT detalhado com os resultados
- Anexa o arquivo automaticamente na resposta

### 📊 Informações coletadas:
- **ID do usuário**
- **Nome de usuário e tag**
- **Nome no servidor**
- **Data de criação da conta** (com quantos dias atrás)
- **Data de entrada no servidor** (com quantos dias atrás)
- **Cargos do usuário**
- **Link do avatar**
- **Se é bot ou não**

## 🛠️ Parâmetros do Comando

### `filtro` (opcional)
Tipo de análise a ser realizada:
- **`account`** - Apenas contas criadas recentemente
- **`joined`** - Apenas usuários que entraram recentemente 
- **`both`** - Ambos os critérios (padrão)

### `dias` (opcional)
- **Tipo:** Número inteiro
- **Min:** 1 dia
- **Max:** 90 dias  
- **Padrão:** 30 dias
- **Descrição:** Quantos dias considerar como "recente"

### `incluir-bots` (opcional)
- **Tipo:** Verdadeiro/Falso
- **Padrão:** Falso
- **Descrição:** Se deve incluir bots na análise

## 💡 Exemplos de Uso

### Uso Básico
```
/contas-recentes
```
- Busca contas criadas OU usuários que entraram nos últimos 30 dias
- Não inclui bots

### Apenas Contas Novas
```
/contas-recentes filtro:account dias:7
```
- Busca apenas contas criadas nos últimos 7 dias
- Não inclui bots

### Análise Completa
```
/contas-recentes filtro:both dias:14 incluir-bots:true
```
- Busca contas criadas OU que entraram nos últimos 14 dias
- Inclui bots na análise

### Entrada Recente no Servidor
```
/contas-recentes filtro:joined dias:3
```
- Busca apenas usuários que entraram nos últimos 3 dias
- Útil para detectar waves de novos membros

## 📄 Formato do Arquivo TXT

O arquivo gerado contém:

```
================================================================================
RELATÓRIO DE CONTAS RECENTES - NOME DO SERVIDOR
================================================================================
Gerado em: 14/09/2025 15:30:45
Filtro aplicado: Conta criada OU entrou no servidor recentemente
Período analisado: Últimos 30 dias
Total de usuários encontrados: 15
================================================================================

001. UsuarioExemplo#1234
     ID: 123456789012345678
     Nome no servidor: Usuário Exemplo
     Conta criada: 10/09/2025 20:30:15 (4 dias atrás)
     Entrou no servidor: 12/09/2025 14:20:30 (2 dias atrás)
     Cargos: Membro, Novato
     Avatar: https://cdn.discordapp.com/avatars/...

002. OutroUsuario#5678 [BOT]
     ID: 987654321098765432
     Nome no servidor: Bot Helper
     Conta criada: 01/09/2025 10:15:00 (13 dias atrás)
     Entrou no servidor: 13/09/2025 09:45:20 (1 dias atrás)
     Cargos: Bots
     Avatar: https://cdn.discordapp.com/avatars/...

================================================================================
Fim do relatório - Total: 15 usuários
================================================================================
```

## 🔒 Permissões Necessárias

### Para o Bot:
- **Ver Log de Auditoria** - Para acessar informações detalhadas dos membros
- **Enviar Mensagens** - Para responder ao comando
- **Anexar Arquivos** - Para enviar o arquivo TXT

### Para o Usuário:
- **Moderar Membros** - Permissão necessária para executar o comando

## ⚠️ Limitações e Considerações

### Limitações:
- **Data de entrada:** Pode não estar disponível para membros muito antigos
- **Performance:** Em servidores muito grandes (10k+ membros), o comando pode demorar
- **Arquivo temporário:** É deletado automaticamente após 30 segundos

### Considerações de Segurança:
- Use com responsabilidade para não violar a privacidade dos usuários
- O arquivo contém IDs únicos - mantenha seguro se necessário
- Informações são baseadas em dados públicos do Discord

## 🎯 Casos de Uso Práticos

### 1. Detecção de Raids
```
/contas-recentes filtro:joined dias:1
```
Identifica usuários que entraram nas últimas 24h para detectar possíveis raids.

### 2. Contas Alternativas
```
/contas-recentes filtro:account dias:7
```
Encontra contas muito novas que podem ser alts de usuários banidos.

### 3. Análise de Crescimento
```
/contas-recentes filtro:joined dias:30
```
Analisa o crescimento do servidor no último mês.

### 4. Auditoria Completa
```
/contas-recentes filtro:both dias:14 incluir-bots:true
```
Análise completa de toda atividade recente incluindo bots.

## 🛡️ Dicas para Moderadores

1. **Execute regularmente** para monitorar padrões suspeitos
2. **Compare com logs do servidor** para contexto adicional  
3. **Use diferentes períodos** (1, 3, 7, 14, 30 dias) conforme necessário
4. **Salve arquivos importantes** antes que sejam deletados automaticamente
5. **Combine com outros comandos** de moderação para investigação completa

---

Este comando é uma ferramenta essencial para manter a segurança e organização do seu servidor Discord! 🚀
