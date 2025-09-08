class ReadyEvent {
  constructor() {
    this.name = 'ready';
    this.once = true;
    this.type = 'discord';
    this.description = 'Executado quando o bot está pronto e online';
  }

  async execute(client) {
    try {
      console.log(`🤖 ${client.user.tag} está online!`);
      
      if (client.guilds && client.guilds.cache) {
        console.log(`📊 Conectado a ${client.guilds.cache.size} servidores`);
      }
      
      if (client.users && client.users.cache) {
        console.log(`👥 Servindo ${client.users.cache.size} usuários`);
      }

      // Definir status do bot
      if (client.user && client.user.setActivity) {
        await client.user.setActivity('Monitorando o servidor', { 
          type: 'WATCHING' 
        });
      }

      // Log de inicialização completa
      console.log('✅ Bot totalmente inicializado e pronto para uso!');
      console.log(`📅 Iniciado em: ${new Date().toLocaleString('pt-BR')}`);

      // Emitir evento customizado para outros módulos
      if (client.emit) {
        client.emit('botReady', {
          timestamp: new Date(),
          guilds: client.guilds?.cache.size || 0,
          users: client.users?.cache.size || 0
        });
      }

    } catch (error) {
      console.error('Erro no evento ready:', error);
    }
  }
}

module.exports = ReadyEvent;
