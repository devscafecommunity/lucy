const CommandHandler = require('../../src/core/CommandHandler');

// Mock do discord.js
jest.mock('discord.js', () => ({
  PermissionsBitField: {
    Flags: {
      Administrator: 'Administrator'
    }
  }
}));

describe('CommandHandler', () => {
  let commandHandler;
  let mockBot;
  let mockInteraction;

  beforeEach(() => {
    mockBot = {
      commands: new Map(),
      client: {
        user: { id: '123456789' }
      }
    };

    mockInteraction = {
      isCommand: () => true,
      commandName: 'test',
      user: { id: '987654321', username: 'testuser' },
      guild: { id: '111111111', name: 'Test Guild' },
      channel: { id: '222222222', name: 'test-channel' },
      reply: jest.fn(),
      editReply: jest.fn(),
      deferReply: jest.fn(),
      followUp: jest.fn()
    };

    commandHandler = new CommandHandler(mockBot);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should create CommandHandler instance', () => {
    expect(commandHandler).toBeDefined();
    expect(commandHandler.bot).toBe(mockBot);
  });

  test('should handle valid command', async () => {
    const mockCommand = {
      name: 'test',
      description: 'Test command',
      execute: jest.fn()
    };

    mockBot.commands.set('test', mockCommand);
    
    await commandHandler.handleInteraction(mockInteraction);

    expect(mockCommand.execute).toHaveBeenCalledWith(mockInteraction);
  });

  test('should handle unknown command', async () => {
    await commandHandler.handleInteraction(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith({
      content: 'Comando não encontrado!',
      ephemeral: true
    });
  });

  test('should handle command execution error', async () => {
    const mockCommand = {
      name: 'test',
      description: 'Test command',
      execute: jest.fn().mockRejectedValue(new Error('Test error'))
    };

    mockBot.commands.set('test', mockCommand);
    
    await commandHandler.handleInteraction(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith({
      content: 'Ocorreu um erro ao executar este comando!',
      ephemeral: true
    });
  });

  test('should check user permissions', () => {
    const mockCommand = {
      name: 'test',
        permissions: ['Administrator']
    };

    const mockMember = {
      permissions: {
        has: jest.fn().mockReturnValue(true)
      }
    };

    mockInteraction.member = mockMember;

    const hasPermission = commandHandler._checkPermissions(mockCommand, mockInteraction);

    expect(hasPermission).toBe(true);
      expect(mockMember.permissions.has).toHaveBeenCalledWith('Administrator');
  });

  test('should handle cooldown', () => {
    const mockCommand = {
      name: 'test',
      cooldown: 5000 // 5 seconds
    };

    const userId = '987654321';
    
    // First use - should not be on cooldown
    expect(commandHandler._checkCooldown(mockCommand, userId)).toBe(false);
    
    commandHandler._setCooldown(mockCommand, userId);
    
    // Second use immediately - should be on cooldown
    expect(commandHandler._checkCooldown(mockCommand, userId)).toBe(true);
  });

  test('should not handle non-command interaction', async () => {
    mockInteraction.isCommand = () => false;
    
    const result = await commandHandler.handleInteraction(mockInteraction);
    
    expect(result).toBe(false);
  });
});
