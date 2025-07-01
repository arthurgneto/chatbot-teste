const { create } = require('@wppconnect-team/wppconnect');

const estados = new Map(); // Armazena estado dos contatos
const timeouts = new Map(); // Armazena timeouts por número

// Função para verificar se está no horário de atendimento
function emHorarioComercial() {
  const agora = new Date();
  const hora = agora.getHours();
  const dia = agora.getDay(); // 0 = domingo, 6 = sábado
  if (dia === 0) return false;
  if (dia === 6) return hora >= 8 && hora < 12;
  return hora >= 6 && hora < 21.5;
}

// Menu principal
const menu = `🏋️ *ACADEMIA TESTE* – Escolha uma opção:

1️⃣ Musculação
2️⃣ Hidroginástica
3️⃣ Natação Adulto
4️⃣ Funcional Kids
5️⃣ Natação Infantil
6️⃣ Natação Infantil + Funcional Kids
7️⃣ Serviços (Taxas)
8️⃣ Avaliações (Física e Nutricional)
9️⃣ Pilates Individual
🔟 Pilates em Grupo
1️⃣1️⃣ Pacotes de Avaliação
1️⃣2️⃣ Horários das Aulas
1️⃣3️⃣ Localização
1️⃣4️⃣ Falar com atendente`;

create({
  session: 'aquafitness',
  headless: false,
  useChrome: true,
  catchQR: (base64Qr, asciiQR) => {
    console.clear();
    console.log('📲 Escaneie o QR Code abaixo para conectar o WhatsApp:\n');
    console.log(asciiQR);
  },
})
  .then((client) => {
    console.log('🤖 Bot iniciado com sucesso!');

    client.onMessage(async (msg) => {
      const contato = msg.from;
      const texto = msg.body?.trim().toLowerCase();
      const estado = estados.get(contato) || {};

      // Se usuário digitar 'menu' a qualquer momento
      if (texto === 'menu') {
        estados.set(contato, { iniciado: true });
        return client.sendText(contato, `🔁 Atendimento reiniciado!\n\n${menu}`);
      }

      // Coleta de dados para atendente
      if (estado.coletandoDados) {
        if (!estado.nome) {
          estado.nome = msg.body;
          return client.sendText(contato, '✅ Agora, informe seu interesse (ex: musculação, pilates, avaliação.):');
        } else if (!estado.interesse) {
          estado.interesse = msg.body;
          return client.sendText(contato, '📞 Por fim, informe seu número com DDD::');
        } else if (!estado.telefone) {
          estado.telefone = msg.body;

          // Mensagem final para o usuário
          await client.sendText(contato, '✅ Obrigado! Seus dados foram enviados ao atendente. Entraremos em contato em breve. Caso queira reiniciar, digite *menu*.');

          // Mensagem para o atendente
          const msgFinal = `📥 *Novo Contato Academia teste*\n\n👤 Nome: ${estado.nome}\n🎯 Interesse: ${estado.interesse}\n📱 Telefone: ${estado.telefone}\n\n🕒 Captado via bot.`;

          try {
            const numero = '5514997777020@c.us'; // com DDI
            const status = await client.checkNumberStatus(numero);
            if (status.canReceiveMessage) {
              await client.sendText(numero, msgFinal);
            } else {
              console.warn('⚠️ Número não pode receber mensagens.');
            }
          } catch (err) {
            console.error('❌ Erro ao enviar para atendente:', err);
          }

          estados.delete(contato); // limpa estado após envio

          const timeout = setTimeout(() => {
            client.sendText(contato, '🔒 Atendimento automático encerrado. Para reiniciar, digite *menu*.');
            timeouts.delete(contato);
          }, 2 * 60 * 1000); // 2 minutos
          timeouts.set(contato, timeout);
        }

        estados.set(contato, estado);
        return;
      }

      // Primeira mensagem
      if (!estado.iniciado) {
        const saudacao = emHorarioComercial()
          ? '👋 Olá! Seja bem-vindo à *Academia teste*!'
          : '👋 Olá! No momento estamos fora do horário de atendimento humano.';
        await client.sendText(contato, `${saudacao}\n\n${menu}`);
        estados.set(contato, { iniciado: true });
        return;
      }

      // Respostas do menu
      switch (texto) {
        case '1':
          return client.sendText(contato, `🏋️ *Musculação*\n\nInclui Funcional + Fit Dance\n\n📆 *Mensal:* R$ 110,00\n📆 *Semestral:* R$ 85,00\n📆 *Anual:* R$ 80,00\n💳 *Avulso:* R$ 20,00`);
        case '2':
          return client.sendText(contato, `💧 *Hidroginástica*\n\nInclui Funcional + Fit Dance\n\n2x Semana - Mensal: R$ 165,00\n3x Semana - Mensal: R$ 205,00\n2x Semana - Semestral: R$ 145,00\n3x Semana - Semestral: R$ 185,00`);
        case '3':
          return client.sendText(contato, `🏊 *Natação Adulto*\n\nInclui Funcional + Fit Dance\n\n2x Mensal: R$ 175,00\n3x Mensal: R$ 215,00\n2x Semestral: R$ 155,00\n3x Semestral: R$ 195,00`);
        case '4':
          return client.sendText(contato, `👧 *Funcional Kids*\n\n2x Mensal: R$ 85,00\n2x Semestral: R$ 75,00\n🕒 Terça e Quinta às 18h10`);
        case '5':
          return client.sendText(contato, `🧒 *Natação Infantil*\n\n2x Mensal: R$ 175,00\n3x Mensal: R$ 225,00\n2x Semestral: R$ 155,00\n3x Semestral: R$ 205,00`);
        case '6':
          return client.sendText(contato, `👦 *Natação Infantil + Funcional Kids*\n\n2x Mensal: R$ 195,00\n3x Mensal: R$ 240,00\n2x Semestral: R$ 180,00\n3x Semestral: R$ 225,00`);
        case '7':
          return client.sendText(contato, `💼 *Serviços*\n\n📌 Taxa de Avaliação Inicial: R$ 35,00\n📌 Taxa de Matrícula: R$ 20,00`);
        case '8':
          return client.sendText(contato, `🧪 *Avaliações*\n\n📊 Avaliação Física: R$ 100,00\n🥗 Avaliação Nutricional: R$ 250,00`);
        case '9':
          return client.sendText(contato, `🧘 *Pilates Individual*\n\nMensal: 1x R$ 170,00 | 2x R$ 290,00 | 3x R$ 390,00\nSemestral: 1x R$ 150,00 | 2x R$ 250,00 | 3x R$ 345,00\nAvulso: R$ 50,00.`);
        case '10':
          return client.sendText(contato, `🧘‍♀️ *Pilates em Grupo (até 3 pessoas)*\n\nMensal: 1x R$ 130,00 | 2x R$ 200,00 | 3x R$ 280,00\nSemestral: 1x R$ 118,00 | 2x R$ 180,00 | 3x R$ 260,00\nAvulso: R$ 35,00`);
        case '11':
          return client.sendText(contato, `📊 *Pacotes Avaliação*\n\nBioimpedância: 12x R$ 9,90\nAdipômetro: 12x R$ 24,90`);
        case '12':
          return client.sendText(contato, `🕒 *Horários das Aulas*\n\n[Horários conforme enviado anteriormente]`);
        case '13':
          return client.sendText(contato, `📍 *Endereço:*\n105, Av. Nações Unidas, 25-25 - Jardim Brasil, Bauru - SP\n📞 (14) xxxx-xxxx\n🌐 Google Maps: https://www.google.com/maps/dir//105,+Av.+Na%C3%A7%C3%B5es+Unidas,+25-25+-+Jardim+Brasil,+Bauru+-+SP/@-22.3321273,-49.1411619,12z/data=!4m8!4m7!1m0!1m5!1m1!1s0x94bf6774419e6c45:0xabec9f24d25d7928!2m2!1d-49.0587603!2d-22.3321481?entry=ttu&g_ep=EgoyMDI1MDYyNi4wIKXMDSoASAFQAw%3D%3D`);
        case '14':
          estados.set(contato, { coletandoDados: true });
          return client.sendText(contato, '👋 Para te ajudar melhor, informe seu *nome completo*:');
        default:
          return client.sendText(contato, '❓ Opção inválida. Digite o número correspondente ou envie *menu* para ver novamente:\n\n' + menu);
      }
    });
  })
  .catch((erro) => {
    console.error('Erro ao iniciar o bot:', erro);
  });
