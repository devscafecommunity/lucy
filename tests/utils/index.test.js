const { formatDuration, validateUser, createEmbed, handleError } = require('../../src/utils');

// Mock do discord.js
jest.mock('discord.js', () => ({
  EmbedBuilder: jest.fn().mockImplementation(() => ({
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setColor: jest.fn().mockReturnThis(),
    setThumbnail: jest.fn().mockReturnThis(),
    setImage: jest.fn().mockReturnThis(),
    setAuthor: jest.fn().mockReturnThis(),
    setFooter: jest.fn().mockReturnThis(),
    setTimestamp: jest.fn().mockReturnThis(),
    setURL: jest.fn().mockReturnThis(),
    addFields: jest.fn().mockReturnThis(),
    data: {
      title: undefined,
      description: undefined,
      color: undefined,
      fields: [],
      timestamp: undefined
    }
  }))
}));

describe('Utilities', () => {
  describe('formatDuration', () => {
    test('should format minutes correctly', () => {
      expect(formatDuration(1)).toBe('1 minuto');
      expect(formatDuration(30)).toBe('30 minutos');
      expect(formatDuration(59)).toBe('59 minutos');
    });

    test('should format hours correctly', () => {
      expect(formatDuration(60)).toBe('1 hora');
      expect(formatDuration(120)).toBe('2 horas');
      expect(formatDuration(90)).toBe('1 hora e 30 minutos');
    });

    test('should format days correctly', () => {
      expect(formatDuration(1440)).toBe('1 dia');
      expect(formatDuration(2880)).toBe('2 dias');
      expect(formatDuration(1500)).toBe('1 dia e 1 hora');
    });

    test('should handle edge cases', () => {
      expect(formatDuration(0)).toBe('0 minutos');
      expect(formatDuration(-5)).toBe('0 minutos');
    });
  });

  describe('validateUser', () => {
    let mockInteraction;
    let mockTargetUser;
    let mockMember;

    beforeEach(() => {
      mockMember = {
        id: '999999999',
        roles: {
          highest: { position: 1 }
        }
      };

      mockTargetUser = {
        id: '888888888',
        bot: false
      };

      mockInteraction = {
        user: { id: '111111111' },
        member: {
          id: '111111111',
          roles: {
            highest: { position: 5 }
          }
        },
        guild: {
          ownerId: '222222222',
          members: {
            me: {
              roles: {
                highest: { position: 10 }
              }
            }
          }
        }
      };
    });

    test('should prevent self-targeting', () => {
      mockTargetUser.id = mockInteraction.user.id;
      
      const result = validateUser(mockInteraction, mockTargetUser, mockMember);
      
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('si mesmo');
    });

    test('should prevent targeting bots', () => {
      mockTargetUser.bot = true;
      
      const result = validateUser(mockInteraction, mockTargetUser, mockMember);
      
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('bot');
    });

    test('should prevent targeting server owner', () => {
      mockTargetUser.id = mockInteraction.guild.ownerId;
      
      const result = validateUser(mockInteraction, mockTargetUser, mockMember);
      
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('dono do servidor');
    });

    test('should prevent targeting higher role users', () => {
      mockMember.roles.highest.position = 10; // Higher than executor's role
      
      const result = validateUser(mockInteraction, mockTargetUser, mockMember);
      
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('cargo igual ou superior');
    });

    test('should allow valid targets', () => {
      const result = validateUser(mockInteraction, mockTargetUser, mockMember);
      
      expect(result.valid).toBe(true);
    });
  });

  describe('createEmbed', () => {
    test('should create basic embed', () => {
      const embed = createEmbed({
        title: 'Test Title',
        description: 'Test Description',
        color: 'success'
      });

      expect(embed.setTitle).toHaveBeenCalledWith('Test Title');
      expect(embed.setDescription).toHaveBeenCalledWith('Test Description');
      expect(embed.setColor).toHaveBeenCalledWith(0x00ff00);
    });

    test('should handle different colors', () => {
      const successEmbed = createEmbed({ color: 'success' });
      const errorEmbed = createEmbed({ color: 'error' });
      const warningEmbed = createEmbed({ color: 'warning' });
      const infoEmbed = createEmbed({ color: 'info' });

      expect(successEmbed.setColor).toHaveBeenCalledWith(0x00ff00);
      expect(errorEmbed.setColor).toHaveBeenCalledWith(0xff0000);
      expect(warningEmbed.setColor).toHaveBeenCalledWith(0xff9900);
      expect(infoEmbed.setColor).toHaveBeenCalledWith(0x00aaff);
    });

    test('should add timestamp when specified', () => {
      const embed = createEmbed({ title: 'Test', timestamp: true });
      
      expect(embed.setTimestamp).toHaveBeenCalled();
    });

    test('should add fields correctly', () => {
      const embed = createEmbed({
        title: 'Test',
        fields: [
          { name: 'Field 1', value: 'Value 1', inline: true },
          { name: 'Field 2', value: 'Value 2', inline: false }
        ]
      });

      expect(embed.addFields).toHaveBeenCalledWith({
        name: 'Field 1',
        value: 'Value 1',
        inline: true
      });
    });
  });

  describe('handleError', () => {
    let mockInteraction;
    let consoleSpy;

    beforeEach(() => {
      mockInteraction = {
        reply: jest.fn(),
        editReply: jest.fn(),
        followUp: jest.fn(),
        replied: false,
        deferred: false
      };

      consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    test('should reply with error message when not replied', async () => {
      const error = new Error('Test error');
      
      await handleError(error, mockInteraction, 'test-command');

      expect(mockInteraction.reply).toHaveBeenCalledWith({
        content: expect.stringContaining('erro'),
        ephemeral: true
      });
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('should followUp when already replied', async () => {
      mockInteraction.replied = true;
      const error = new Error('Test error');
      
      await handleError(error, mockInteraction, 'test-command');

      expect(mockInteraction.followUp).toHaveBeenCalledWith({
        content: expect.stringContaining('erro'),
        ephemeral: true
      });
    });

    test('should editReply when deferred', async () => {
      mockInteraction.deferred = true;
      const error = new Error('Test error');
      
      await handleError(error, mockInteraction, 'test-command');

      expect(mockInteraction.editReply).toHaveBeenCalledWith({
        content: expect.stringContaining('erro'),
        ephemeral: true
      });
    });

    test('should handle custom error message', async () => {
      const error = new Error('Test error');
      
      await handleError(error, mockInteraction, 'test-command', 'Custom error message');

      expect(mockInteraction.reply).toHaveBeenCalledWith({
        content: 'Custom error message',
        ephemeral: true
      });
    });
  });
});
