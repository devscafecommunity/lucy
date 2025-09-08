const ReadyEvent = require('../../src/events/ready');

describe('ReadyEvent', () => {
  let readyEvent;
  let mockClient;

  beforeEach(() => {
    readyEvent = new ReadyEvent();
    
    mockClient = {
      user: { 
        tag: 'TestBot#1234',
        username: 'TestBot'
      },
      guilds: {
        cache: {
          size: 5
        }
      },
      users: {
        cache: {
          size: 100
        }
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should create ReadyEvent with correct properties', () => {
    expect(readyEvent.name).toBe('ready');
    expect(readyEvent.once).toBe(true);
    expect(readyEvent.type).toBe('discord');
    expect(typeof readyEvent.execute).toBe('function');
  });

  test('should execute ready event successfully', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await readyEvent.execute(mockClient);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('TestBot#1234 está online!')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Conectado a 5 servidores')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Servindo 100 usuários')
    );

    consoleSpy.mockRestore();
  });

  test('should handle missing client data gracefully', async () => {
    const incompleteClient = {
      user: { tag: 'TestBot#1234' }
    };

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await readyEvent.execute(incompleteClient);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('TestBot#1234 está online!')
    );

    consoleSpy.mockRestore();
  });
});
