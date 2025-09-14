const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { createEmbed, handleError } = require('../../utils');

class RecentAccountsCommand {
  constructor() {
    this.name = 'contas-recentes';
    this.description = 'Lista usuários com contas criadas ou que entraram no servidor recentemente (menos de 1 mês)';
    this.category = 'moderation';
    this.permissions = ['ModerateMembers'];
    this.cooldown = 30000; // 30 segundos

    this.data = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption(option =>
        option
          .setName('filtro')
          .setDescription('Tipo de filtro para aplicar')
          .setRequired(false)
          .addChoices(
            { name: 'Conta criada recentemente', value: 'account' },
            { name: 'Entrou no servidor recentemente', value: 'joined' },
            { name: 'Ambos (padrão)', value: 'both' }
          )
      )
      .addIntegerOption(option =>
        option
          .setName('dias')
          .setDescription('Número de dias para considerar "recente" (padrão: 30)')
          .setMinValue(1)
          .setMaxValue(90)
          .setRequired(false)
      )
      .addBooleanOption(option =>
        option
          .setName('incluir-bots')
          .setDescription('Incluir bots na análise (padrão: não)')
          .setRequired(false)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);
  }

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const filtro = interaction.options.getString('filtro') || 'both';
      const dias = interaction.options.getInteger('dias') || 30;
      const incluirBots = interaction.options.getBoolean('incluir-bots') || false;

      console.log(`Comando contas-recentes executado por ${interaction.user.tag} em ${interaction.guild.name}`);

      // Verificar se o bot tem as permissões necessárias
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
        return await interaction.editReply({
          embeds: [createEmbed({
            title: '❌ Permissões Insuficientes',
            description: 'Preciso da permissão **Ver Log de Auditoria** para executar este comando.',
            color: 'Red'
          })]
        });
      }

      // Buscar todos os membros do servidor
      await interaction.guild.members.fetch();
      const members = interaction.guild.members.cache;

      console.log(`Total de membros carregados: ${members.size}`);

      // Data limite (X dias atrás)
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - dias);

      // Analisar membros
      const resultados = await this.analisarMembros(members, filtro, dataLimite, incluirBots);

      if (resultados.length === 0) {
        return await interaction.editReply({
          embeds: [createEmbed({
            title: '📋 Nenhuma Conta Encontrada',
            description: `Nenhum usuário encontrado com os critérios especificados nos últimos ${dias} dias.`,
            color: 'Yellow'
          })]
        });
      }

      // Gerar arquivo TXT
      const arquivo = await this.gerarArquivoTXT(resultados, filtro, dias, interaction.guild.name);

      // Criar embed com resumo
      const resumoEmbed = createEmbed({
        title: '🔍 Análise de Contas Recentes',
        description: `Encontradas **${resultados.length} contas** que atendem aos critérios.`,
        fields: [
          {
            name: '📊 Filtros Aplicados',
            value: [
              `**Tipo:** ${this.getTipoFiltroNome(filtro)}`,
              `**Período:** Últimos ${dias} dias`,
              `**Bots:** ${incluirBots ? 'Incluídos' : 'Excluídos'}`,
              `**Total encontrado:** ${resultados.length} usuários`
            ].join('\n'),
            inline: false
          },
          {
            name: '📁 Arquivo Gerado',
            value: 'O arquivo com a lista completa foi anexado a esta mensagem.',
            inline: false
          }
        ],
        color: 'Blue',
        timestamp: true
      });

      // Anexar arquivo e enviar resposta
      const attachment = new AttachmentBuilder(arquivo.caminho, { name: arquivo.nome });

      await interaction.editReply({
        embeds: [resumoEmbed],
        files: [attachment]
      });

      // Limpar arquivo temporário após 30 segundos
      setTimeout(async () => {
        try {
          await fs.unlink(arquivo.caminho);
        } catch (error) {
          console.warn('Erro ao limpar arquivo temporário:', error.message);
        }
      }, 30000);

    } catch (error) {
      console.error('Erro no comando contas-recentes:', error);
      await handleError(error, interaction, 'contas-recentes', 
        'Erro ao analisar contas recentes. Tente novamente em alguns instantes.');
    }
  }

  /**
   * Analisa os membros do servidor baseado nos critérios
   */
  async analisarMembros(members, filtro, dataLimite, incluirBots) {
    const resultados = [];
    const agora = new Date();

    for (const [memberId, member] of members) {
      try {
        // Pular bots se não incluir
        if (member.user.bot && !incluirBots) continue;

        const user = member.user;
        const contaCriada = user.createdAt;
        const entradaServidor = member.joinedAt;

        // Verificar critérios baseado no filtro
        let atendeCriterios = false;

        if (filtro === 'account' || filtro === 'both') {
          if (contaCriada >= dataLimite) {
            atendeCriterios = true;
          }
        }

        if (filtro === 'joined' || filtro === 'both') {
          if (entradaServidor && entradaServidor >= dataLimite) {
            atendeCriterios = true;
          }
        }

        if (atendeCriterios) {
          // Calcular dias desde a criação da conta e entrada no servidor
          const diasConta = Math.floor((agora - contaCriada) / (1000 * 60 * 60 * 24));
          const diasServidor = entradaServidor ? 
            Math.floor((agora - entradaServidor) / (1000 * 60 * 60 * 24)) : null;

          resultados.push({
            id: user.id,
            username: user.username,
            displayName: member.displayName,
            discriminator: user.discriminator || '0000',
            tag: user.tag,
            bot: user.bot,
            contaCriada: contaCriada,
            entradaServidor: entradaServidor,
            diasConta: diasConta,
            diasServidor: diasServidor,
            avatar: user.displayAvatarURL(),
            roles: member.roles.cache
              .filter(role => role.id !== member.guild.id) // Remove @everyone
              .map(role => role.name)
              .join(', ') || 'Nenhum cargo'
          });
        }
      } catch (error) {
        console.warn(`Erro ao analisar membro ${memberId}:`, error.message);
        continue;
      }
    }

    // Ordenar por data de criação da conta (mais recente primeiro)
    resultados.sort((a, b) => b.contaCriada - a.contaCriada);

    return resultados;
  }

  /**
   * Gera arquivo TXT com os resultados
   */
  async gerarArquivoTXT(resultados, filtro, dias, nomeServidor) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const nomeArquivo = `contas-recentes-${timestamp}.txt`;
    const caminhoArquivo = path.join(process.cwd(), 'temp', nomeArquivo);

    // Criar diretório temp se não existir
    await fs.mkdir(path.dirname(caminhoArquivo), { recursive: true });

    // Gerar conteúdo do arquivo
    const linhas = [
      '='.repeat(80),
      `RELATÓRIO DE CONTAS RECENTES - ${nomeServidor.toUpperCase()}`,
      '='.repeat(80),
      `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
      `Filtro aplicado: ${this.getTipoFiltroNome(filtro)}`,
      `Período analisado: Últimos ${dias} dias`,
      `Total de usuários encontrados: ${resultados.length}`,
      '='.repeat(80),
      ''
    ];

    for (let i = 0; i < resultados.length; i++) {
      const usuario = resultados[i];
      const numero = (i + 1).toString().padStart(3, '0');

      linhas.push(`${numero}. ${usuario.tag}${usuario.bot ? ' [BOT]' : ''}`);
      linhas.push(`     ID: ${usuario.id}`);
      linhas.push(`     Nome no servidor: ${usuario.displayName}`);
      linhas.push(`     Conta criada: ${usuario.contaCriada.toLocaleString('pt-BR')} (${usuario.diasConta} dias atrás)`);
      
      if (usuario.entradaServidor) {
        linhas.push(`     Entrou no servidor: ${usuario.entradaServidor.toLocaleString('pt-BR')} (${usuario.diasServidor} dias atrás)`);
      } else {
        linhas.push(`     Entrou no servidor: Data não disponível`);
      }
      
      linhas.push(`     Cargos: ${usuario.roles}`);
      linhas.push(`     Avatar: ${usuario.avatar}`);
      linhas.push('');
    }

    linhas.push('='.repeat(80));
    linhas.push(`Fim do relatório - Total: ${resultados.length} usuários`);
    linhas.push('='.repeat(80));

    // Escrever arquivo
    const conteudo = linhas.join('\n');
    await fs.writeFile(caminhoArquivo, conteudo, 'utf8');

    return {
      caminho: caminhoArquivo,
      nome: nomeArquivo
    };
  }

  /**
   * Retorna o nome amigável do tipo de filtro
   */
  getTipoFiltroNome(filtro) {
    switch (filtro) {
      case 'account': return 'Conta criada recentemente';
      case 'joined': return 'Entrou no servidor recentemente';
      case 'both': return 'Conta criada OU entrou no servidor recentemente';
      default: return 'Desconhecido';
    }
  }
}

// module.exports = RecentAccountsCommand;
