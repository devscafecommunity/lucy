const PingCommand = require('../../src/commands/ping');

describe('PingCommand', () => {
  let pingCommand;
  let mockInteraction;

  beforeEach(() => {
    pingCommand = new PingCommand();
    
    mockInteraction = {
      deferReply: jest.fn(),
      editReply: jest.fn(),
      reply: jest.fn(),
      user: { 
        username: 'testuser',
        displayAvatarURL: jest.fn().mockReturnValue('https://example.com/avatar.png')
      },
      client: {
        ws: { ping: 50 }
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should create PingCommand with correct properties', () => {
    expect(pingCommand.name).toBe('ping');
    expect(pingCommand.description).toBe('Mostra o ping do bot');
    expect(pingCommand.category).toBe('utility');
    expect(typeof pingCommand.execute).toBe('function');
  });

  test('should execute ping command successfully', async () => {
    await pingCommand.execute(mockInteraction);

    expect(mockInteraction.deferReply).toHaveBeenCalled();
    expect(mockInteraction.editReply).toHaveBeenCalledWith({
      embeds: [expect.any(Object)]
    });
  });

  test('should handle execution error gracefully', async () => {
    mockInteraction.deferReply.mockRejectedValue(new Error('Network error'));
    
    await pingCommand.execute(mockInteraction);

    expect(mockInteraction.reply).toHaveBeenCalledWith({
      content: '🏓 Pong! (modo simples)',
      ephemeral: false
    });
  });

  test('should include correct status emoji for different ping values', () => {
    expect(pingCommand._getStatusEmoji(50)).toBe('🟢 Excelente');
    expect(pingCommand._getStatusEmoji(150)).toBe('🟡 Bom');
    expect(pingCommand._getStatusEmoji(250)).toBe('🟠 Regular');
    expect(pingCommand._getStatusEmoji(350)).toBe('🔴 Ruim');
  });
});
