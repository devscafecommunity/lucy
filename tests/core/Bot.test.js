
// Mock completo do discord.js
const mockClient = {
  login: jest.fn(),
  on: jest.fn(),
  user: { tag: 'TestBot#1234' },
  destroy: jest.fn()
};

const { Client } = jest.mock('discord.js', () => ({
  Client: jest.fn(() => mockClient),
  GatewayIntentBits: {
    Guilds: 1,
    GuildMessages: 2,
    MessageContent: 4,
    GuildMembers: 8
  }
}));

const Bot = require('../../src/core/Bot');
const { Client: MockedClient } = require('discord.js');

describe('Bot Core', () => {
  let bot;

  beforeEach(() => {
    jest.clearAllMocks();
    bot = new Bot();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should create bot instance with client', () => {
    expect(bot).toBeDefined();
    expect(bot.client).toBeDefined();
    expect(MockedClient).toHaveBeenCalled();
  });

  test('should start bot successfully', async () => {
    mockClient.login.mockResolvedValue('token');
    
    await bot.start('fake-token');
    
    expect(mockClient.login).toHaveBeenCalledWith('fake-token');
  });

  test('should handle login error', async () => {
    const error = new Error('Invalid token');
    mockClient.login.mockRejectedValue(error);
    
    await expect(bot.start('invalid-token')).rejects.toThrow('Invalid token');
  });

  test('should stop bot successfully', async () => {
    mockClient.destroy.mockResolvedValue();
    
    await bot.stop();
    
    expect(mockClient.destroy).toHaveBeenCalled();
  });

  test('should register event listeners', () => {
    const eventHandler = jest.fn();
    bot.on('ready', eventHandler);
    
    expect(mockClient.on).toHaveBeenCalledWith('ready', expect.any(Function));
  });
});
