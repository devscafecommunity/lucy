const KickCommand = require("../../../src/commands/moderation/kick");

describe('KickCommand', () => {
  let kickCommand;

  beforeEach(() => {
    kickCommand = new KickCommand();
  });

  test('should exist', () => {
    expect(KickCommand).toBeDefined();
  });

  test('should have correct properties', () => {
    expect(kickCommand.name).toBe('kick');
    expect(kickCommand.description).toBe('Expulsa um membro do servidor');
    expect(kickCommand.category).toBe('moderation');
    expect(kickCommand.data).toBeDefined();
    expect(kickCommand.permissions).toEqual(['KickMembers']);
    expect(kickCommand.cooldown).toBe(5000);
  });
});
