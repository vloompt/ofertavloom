// Perguntas do onboarding de clientes do programa de aquisição Vloom.
// Refeito a 11/11/2026 a partir do guia do formulário original (Manus, junho/2026) e dos
// emails antigos de onboarding do GHL: entrevistas, motivações, ofertas, bónus de presença,
// materiais, bases de dados, Vloomni, afiliação e as 46 perguntas do AI Business Context.
// Usado pelo formulário (/onboarding/) e pela ficha da equipa (/onboarding/ficha/).
window.ONB = (function () {
  const MOTIVACOES = [
    { v: 'realizacao', t: 'Realização', d: 'Sentir-se bem-sucedido e orgulhoso por superar obstáculos. Procura ferramentas que o ajudem a ter êxito.', ex: 'Nike' },
    { v: 'autonomia', t: 'Autonomia', d: 'Sentir-se único e independente. Procura liberdade para personalizar a experiência nos seus próprios termos.', ex: 'LEGO' },
    { v: 'pertenca', t: 'Pertença', d: 'Sentir-se aceite e ligado aos outros. Procura fazer parte de uma tribo.', ex: 'Harley-Davidson' },
    { v: 'competencia', t: 'Competência', d: 'Sentir-se capaz e preparado. Procura ficar mais habilidoso quando precisa de agir.', ex: 'Microsoft' },
    { v: 'empoderamento', t: 'Empoderamento', d: 'Sentir-se no controlo e equipado para agir sobre as escolhas que deseja.', ex: 'Samsung' },
    { v: 'envolvimento', t: 'Envolvimento', d: 'Sentir-se cativado e animado. Procura marcas que envolvam os sentidos e o libertem da rotina.', ex: 'Disney, IKEA' },
    { v: 'estima', t: 'Estima', d: 'Sentir-se aprovado, respeitado e admirado pelos outros.', ex: 'BMW, Chanel' },
    { v: 'cuidado', t: 'Cuidado', d: 'Sentir-se amado e cuidado ou ter a capacidade de cuidar de quem gosta.', ex: 'Gerber' },
    { v: 'seguranca', t: 'Segurança', d: 'Sentir-se protegido contra ameaças físicas ou emocionais.', ex: 'Seguros de vida' },
  ];

  const RAZOES = ['Qualidade', 'Preço', 'Confiança na marca', 'Recomendação de alguém', 'Proximidade', 'Rapidez', 'Atendimento', 'Especialização', 'Resultados comprovados', 'Garantia', 'Estatuto e exclusividade', 'Novidade e inovação'];

  // Encorajamento: aparece ao ENTRAR no passo, fica 6 s.
  const PASSOS = [
    { id: 'boas-vindas', tipo: 'inicio' },

    { id: 'empresa', sec: 'A empresa', titulo: 'Comecemos pelo essencial.', sub: 'Quem é a empresa e quem está a preencher.',
      campos: [
        { k: 'companyName', l: 'Nome da empresa', req: true, curto: true },
        { k: 'sector', l: 'Setor de atividade', req: true, curto: true, ph: 'Ex.: clínica dentária, imobiliária, contabilidade' },
        { k: 'website', l: 'Website', curto: true, ph: 'www.' },
        { k: 'numEmployees', l: 'Número de colaboradores', tipo: 'pills', ops: ['1 a 5', '6 a 10', '11 a 50', '51 a 200', 'Mais de 200'] },
        { k: 'annualRevenue', l: 'Faturação anual', tipo: 'pills', ops: ['Até 100 mil €', '100 a 500 mil €', '500 mil a 1 M€', '1 a 5 M€', 'Mais de 5 M€'] },
        { k: 'respName', l: 'O seu nome', req: true, curto: true },
        { k: 'respEmail', l: 'O seu email', req: true, curto: true, tipoInput: 'email' },
        { k: 'respPhone', l: 'O seu telemóvel', req: true, curto: true, tipoInput: 'tel' },
      ] },

    { id: 'entrevistas', sec: 'Entrevistas', titulo: 'Quem são os clientes que vamos entrevistar?', sub: 'Precisamos do contacto de 10 ou mais clientes que já usaram o produto ou serviço que vamos promover.',
      info: [
        'Vamos ligar a estas pessoas para uma conversa gravada por Zoom de cerca de 30 minutos, com perguntas simples como "que rede social usa mais?" ou "onde ouviu falar da marca pela primeira vez?".',
        'O objetivo é traçar um perfil no fim de todas as entrevistas. As respostas nunca ficam associadas a nomes.',
        '<b>Importante:</b> avise estas pessoas de que vão ser contactadas. Quem não está avisado raramente atende ou acaba por faltar à reunião.',
      ],
      enc: 'Esta é a fase mais crítica de todo o processo. Obrigado por ajudar!',
      campos: [{ k: 'interviewContacts', l: 'Clientes para entrevista', tipo: 'contactos', min: 10 }] },

    { id: 'motivacoes', sec: 'Motivações', titulo: 'O que move o seu cliente, lá no fundo?', sub: 'As entrevistas mostram-nos o lado racional. Aqui olhamos para o subconsciente: escolha até 2 motivações que mais têm que ver com o seu cliente.',
      enc: 'Só um entendimento profundo dos dois planos nos permite comunicar bem.',
      campos: [{ k: 'motivations', l: 'Motivações (máximo 2)', tipo: 'cartoes', ops: MOTIVACOES, max: 2 }] },

    { id: 'psicologia', sec: 'Psicologia de compra', titulo: 'Porque é que lhe compram a si?', sub: 'O que pesa na decisão de quem compra.',
      campos: [
        { k: 'buyingReasons', l: 'As 3 razões que mais pesam na decisão de compra', tipo: 'multi', ops: RAZOES, max: 3 },
        { k: 'topProblems', l: 'Os 3 problemas que levam um cliente a procurá-lo', h: 'Nas palavras do cliente, se possível.' },
        { k: 'topQuestions', l: 'As 3 perguntas que os clientes fazem mais antes de comprar' },
        { k: 'topBlockers', l: 'O que os impede de avançar', h: 'Medos, dúvidas ou desculpas que ouve mais vezes.' },
      ] },

    { id: 'ofertas', sec: 'Ofertas', titulo: 'Que ofertas podemos testar?', sub: 'A oferta é o centro do marketing de resposta direta. Quem poupa na oferta paga mais por cada lead.',
      info: ['Por oferta entenda-se coisas como "pague 1 leve 2", desconto de X%, a primeira sessão grátis ou pagamento em X vezes. Tudo o que faça o cliente pensar: "com esta marca recebo mais valor por menos esforço."'],
      enc: 'As melhores ofertas fazem o cliente achar que se enganou a ler. 😉',
      campos: [
        { k: 'currentOffers', l: 'Que ofertas costumam ter (que possamos usar)?' },
        { k: 'seasonalOffers', l: 'Há ofertas que lançam em datas especiais?', h: 'Natal, Dia da Mãe, regresso às aulas, aniversário da marca…' },
        { k: 'competitorOffers', l: 'Alguma oferta da concorrência que gostassem de experimentar?' },
        { k: 'bonusShowUp', l: 'Que bónus podemos oferecer a quem comparecer à marcação?', h: 'Os lembretes automáticos prometem um bónus a quem aparece. É a melhor arma contra as faltas. Indique o valor de cada um.' },
      ] },

    // ---- AI Business Context: 10 blocos, 46 perguntas ----
    { id: 'ia-fundador', sec: 'Contexto da marca', titulo: 'Fundador e objetivos', sub: 'Estas respostas são o contexto que vai alimentar a inteligência artificial que trabalha para a sua marca.',
      info: ['Sem contexto, a IA dá respostas genéricas iguais a todas as outras. Com contexto, escreve como se conhecesse a empresa por dentro.', 'Se não souber um número exato, dê uma estimativa e escreva "estimativa". Vale mais do que deixar em branco.'],
      enc: 'Entrámos na parte que torna a sua marca impossível de copiar.',
      campos: [
        { k: 'longTermPlan', l: 'Qual é o plano a longo prazo?', h: 'Vender, manter, fazer crescer, passar a outra geração…' },
        { k: 'revenueGoals', l: 'Metas de faturação, lucro e rendimento pessoal a 3 anos' },
        { k: 'whyThisBusiness', l: 'Porquê este negócio?' },
        { k: 'weeklyHours', l: 'Quantas horas por semana trabalha e em quê?' },
        { k: 'notWillingTo', l: 'O que não está disposto a fazer ou a mudar?' },
      ] },
    { id: 'ia-resumo', sec: 'Contexto da marca', titulo: 'O negócio em resumo', sub: 'A visão de helicóptero.',
      campos: [
        { k: 'businessOneLiner', l: 'O que faz o negócio, numa frase?' },
        { k: 'idealClient', l: 'Quem é o cliente principal?' },
        { k: 'operatesWhere', l: 'Onde opera?' },
        { k: 'currentFinancials', l: 'Situação financeira atual', h: 'Faturação, lucro, caixa e dívida.' },
        { k: 'growthRate', l: 'Quanto cresceu nos últimos 12 meses?' },
      ] },
    { id: 'ia-financeiro', sec: 'Contexto da marca', titulo: 'Modelo financeiro', sub: 'Os números que decidem quanto podemos investir por cliente.',
      enc: 'Já vai a meio. Os números são a parte mais difícil: depois disto fica mais leve.',
      campos: [
        { k: 'revenueSources', l: 'Principais fontes de receita e preços' },
        { k: 'revenueBreakdown', l: 'Que parte da receita vem de clientes novos, de renovações e de vendas adicionais?', h: 'Em percentagem.' },
        { k: 'grossMargin', l: 'Margem bruta por oferta' },
        { k: 'avgOrderLtv', l: 'Valor médio por venda e valor total de um cliente ao longo do tempo' },
        { k: 'cacPayback', l: 'Quanto custa conquistar um cliente, por canal, e em quanto tempo esse custo se paga?' },
        { k: 'billingTerms', l: 'Condições de faturação', h: 'Pagamento imediato, prestações, mensalidade…' },
      ] },
    { id: 'ia-oferta', sec: 'Contexto da marca', titulo: 'Oferta e cliente ideal', sub: 'O que vende, a quem e porque o escolhem.',
      campos: [
        { k: 'centralProblem', l: 'Problema central que resolve e resultado que promete' },
        { k: 'whyChooseYou', l: 'Porque o escolhem a si e não à concorrência?' },
        { k: 'topObjections', l: 'As 3 principais objeções de quem ainda não comprou' },
        { k: 'offerLadder', l: 'Escada de ofertas com preços', h: 'Entrada (baixo valor), principal e premium.' },
        { k: 'guarantees', l: 'Garantias ou compromissos de serviço que oferece' },
      ] },
    { id: 'ia-procura', sec: 'Contexto da marca', titulo: 'Marketing e entrada de leads', sub: 'De onde vêm os contactos hoje.',
      campos: [
        { k: 'leadsPerMonth', l: 'Quantos contactos recebe por mês e por canal?', h: 'Últimos 90 dias.' },
        { k: 'topChannels', l: 'Os 3 melhores canais e os que estão a morrer' },
        { k: 'leadTracking', l: 'Sabe de onde vem cada contacto e quanto custou?' },
        { k: 'funnelSteps', l: 'O caminho completo: de desconhecido a cliente', h: 'Ex.: anúncio → formulário → chamada → reunião → proposta → cliente.' },
        { k: 'contentInvestment', l: 'Quanto investe por semana em conteúdo, prospeção e anúncios?' },
      ] },
    { id: 'ia-vendas', sec: 'Contexto da marca', titulo: 'Vendas', sub: 'Como um contacto se transforma em cliente.',
      enc: 'Estamos a montar uma máquina de angariação para durar uma vida inteira. Falta pouco!',
      campos: [
        { k: 'salesCallsPerMonth', l: 'Quantas chamadas ou reuniões de venda por mês e quantas fecham?' },
        { k: 'closeRateByOffer', l: 'Taxa de fecho por oferta e por origem do contacto' },
        { k: 'whoSells', l: 'Quem vende?' },
        { k: 'salesScript', l: 'Há um guião de vendas? As chamadas são gravadas e revistas?' },
        { k: 'salesCycleLength', l: 'Quanto tempo passa, em média, entre o primeiro contacto e a venda?' },
      ] },
    { id: 'ia-entrega', sec: 'Contexto da marca', titulo: 'Entrega e operações', sub: 'O que acontece depois da venda.',
      campos: [
        { k: 'activeClients', l: 'Quantos clientes ativos tem neste momento, por oferta?' },
        { k: 'deliveryProcess', l: 'Processo de entrega, passo a passo' },
        { k: 'qualityBreaks', l: 'Onde é que a qualidade falha quando cresce?' },
        { k: 'churnRate', l: 'Taxa de abandono e de reembolsos nos últimos 12 meses' },
        { k: 'topComplaints', l: 'Principais queixas dos clientes' },
      ] },
    { id: 'ia-equipa', sec: 'Contexto da marca', titulo: 'Equipa e organização', sub: 'Quem faz o quê.',
      campos: [
        { k: 'teamStructure', l: 'Quantas pessoas tem, por função?' },
        { k: 'keyPeople', l: 'As 3 pessoas insubstituíveis hoje' },
        { k: 'kpis', l: 'Principais indicadores de cada cargo' },
        { k: 'meetingCadence', l: 'Com que frequência reúne a equipa e para quê?' },
      ] },
    { id: 'ia-sistemas', sec: 'Contexto da marca', titulo: 'Sistemas e dados', sub: 'As ferramentas e os números que acompanha.',
      enc: 'Mais dois passos e o contexto fica completo.',
      campos: [
        { k: 'toolsUsed', l: 'Que ferramentas usa?', h: 'CRM, analítica, faturação, gestão de projetos…' },
        { k: 'weeklyMetrics', l: 'Que números revê todas as semanas e todos os meses?' },
        { k: 'unknownMetrics', l: 'Que números importantes não conhece mas gostava de conhecer?' },
      ] },
    { id: 'ia-riscos', sec: 'Contexto da marca', titulo: 'Limitações e riscos', sub: 'O que trava o crescimento.',
      campos: [
        { k: 'limitedBy', l: 'O que o limita mais: falta de clientes ou falta de capacidade para os servir?' },
        { k: 'mainGrowthBlocker', l: 'A única coisa que está a travar o crescimento' },
        { k: 'topRisks', l: 'Os 3 maiores riscos nos próximos 12 meses' },
      ] },

    { id: 'operacional', sec: 'Arranque', titulo: 'Últimos detalhes para arrancar.', sub: 'O que precisamos para os lembretes, as integrações e a Vloomni.',
      info: ['Assim que um lead marca, a Vloom envia lembretes por SMS para garantir que não falta: na marcação, 1 dia antes, 12 horas antes e 3 horas antes. Estes dados entram nessas mensagens.'],
      campos: [
        { k: 'tipoMomento', l: 'Que momento comercial vamos marcar com os leads?', tipo: 'pills', ops: ['Reunião', 'Consulta', 'Visita', 'Avaliação', 'Demonstração', 'Outro'] },
        { k: 'especialista', l: 'Quem recebe o lead nesse momento?', curto: true, h: 'Nome do especialista que aparece nos lembretes.' },
        { k: 'morada', l: 'Morada onde acontece', curto: true, h: 'Ou "online", se for por videochamada.' },
        { k: 'certidaoPermanente', l: 'Código da certidão permanente', curto: true, h: 'Para registarmos o nome da empresa como remetente dos SMS.' },
        { k: 'contactoInformatico', l: 'Contacto do responsável pelo website, Google Analytics ou informática', h: 'Nome, email e telefone. O Ângelo (angelobelchior@vloom.pt) vai pedir os acessos e fazer as integrações.' },
        { k: 'contasVloomni', l: 'Quem precisa de conta na Vloomni?', h: 'Nome e email de cada comercial. Cada um deve ter a sua conta.' },
        { k: 'afiliacao', l: 'Quer integrar o programa de afiliação da Vloom?', tipo: 'pills', ops: ['Sim', 'Talvez', 'Agora não'], h: 'Propomos parcerias com negócios vizinhos: eles melhoram a oferta deles sem custos e a sua empresa ganha um canal de leads novo.' },
        { k: 'incentivoAfiliado', l: 'Se sim, que incentivo daria aos clientes de um parceiro?', h: 'Ex.: primeira sessão grátis ou 15% de desconto.' },
      ] },

    { id: 'ficheiros', sec: 'Materiais', titulo: 'Agora os ficheiros.', sub: 'Na dúvida, envie. Ajuda sempre ter um ponto de partida, mesmo que seja para nos afastarmos dele.',
      enc: 'As respostas já estão guardadas do nosso lado. Falta só isto!',
      zonas: [
        { k: 'brand_manual', l: 'Manual de normas e logótipos', h: 'Manual da marca, logótipos, cores e fontes.' },
        { k: 'ads', l: 'Anúncios, flyers ou outdoors do passado' },
        { k: 'team_photos', l: 'Retratos da equipa' },
        { k: 'database', l: 'Bases de dados de clientes', h: 'Emails e telefones de clientes ativos, antigos ou outros. É opcional mas acelera 3 vezes o caminho até aos resultados.' },
        { k: 'outros', l: 'Outros materiais úteis' },
      ] },

    { id: 'fim', tipo: 'fim' },
  ];

  return { PASSOS, MOTIVACOES, RAZOES };
})();
