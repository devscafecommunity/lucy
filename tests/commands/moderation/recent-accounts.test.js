const RecentAccountsCommand = require('../../../src/commands/moderation/recent-accounts');

describe('RecentAccountsCommand', () => {
  let recentAccountsCommand;

  beforeEach(() => {
    recentAccountsCommand = new RecentAccountsCommand();
  });

  test('should exist', () => {
    expect(RecentAccountsCommand).toBeDefined();
  });

  test('should have correct properties', () => {
    expect(recentAccountsCommand.name).toBe('contas-recentes');
    expect(recentAccountsCommand.description).toBe('Lista usuários com contas criadas ou que entraram no servidor recentemente (menos de 1 mês)');
    expect(recentAccountsCommand.category).toBe('moderation');
    expect(recentAccountsCommand.permissions).toEqual(['ModerateMembers']);
    expect(recentAccountsCommand.cooldown).toBe(30000);
  });

  test('should have correct slash command structure', () => {
    expect(recentAccountsCommand.data).toBeDefined();
    expect(recentAccountsCommand.data.name).toBe('contas-recentes');
  });

  test('should have getTipoFiltroNome method', () => {
    expect(recentAccountsCommand.getTipoFiltroNome('account')).toBe('Conta criada recentemente');
    expect(recentAccountsCommand.getTipoFiltroNome('joined')).toBe('Entrou no servidor recentemente');
    expect(recentAccountsCommand.getTipoFiltroNome('both')).toBe('Conta criada OU entrou no servidor recentemente');
    expect(recentAccountsCommand.getTipoFiltroNome('unknown')).toBe('Desconhecido');
  });

  test('should have analisarMembros method', () => {
    expect(typeof recentAccountsCommand.analisarMembros).toBe('function');
  });

  test('should have gerarArquivoTXT method', () => {
    expect(typeof recentAccountsCommand.gerarArquivoTXT).toBe('function');
  });
});
