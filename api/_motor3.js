// Motor "3 clientes de sonho": esquema e instruções partilhadas.
// Versão 2 (06/09): sites e LinkedIn nas empresas, decisores com nome, perfil com mais critérios,
// nunca trocar a empresa escrita por outra parecida.
const emp = { type: 'object', additionalProperties: false,
  properties: {
    nome: { type: 'string' }, nome_escrito: { type: 'string' }, setor: { type: 'string' }, sede: { type: 'string' },
    dimensao: { type: 'string' }, faturacao: { type: 'string' }, site: { type: 'string' }, linkedin: { type: 'string' }, nota: { type: 'string' },
  }, required: ['nome','nome_escrito','setor','sede','dimensao','faturacao','site','linkedin','nota'] };
const sem = { type: 'object', additionalProperties: false,
  properties: { nome: { type: 'string' }, localidade: { type: 'string' }, setor: { type: 'string' }, site: { type: 'string' }, linkedin: { type: 'string' }, porque: { type: 'string' } },
  required: ['nome','localidade','setor','site','linkedin','porque'] };
const dec = { type: 'object', additionalProperties: false,
  properties: { nome: { type: 'string' }, cargo: { type: 'string' }, empresa: { type: 'string' }, linkedin: { type: 'string' }, email: { type: 'string' }, telefone: { type: 'string' }, fonte: { type: 'string' } },
  required: ['nome','cargo','empresa','linkedin','email','telefone','fonte'] };
const crit = { type: 'object', additionalProperties: false,
  properties: { criterio: { type: 'string' }, valor: { type: 'string' } }, required: ['criterio','valor'] };
const SCHEMA = { type: 'object', additionalProperties: false,
  properties: {
    empresas: { type: 'array', minItems: 3, maxItems: 3, items: emp },
    perfil: { type: 'object', additionalProperties: false,
      properties: {
        resumo: { type: 'string' }, setor: { type: 'string' }, faturacao: { type: 'string' }, dimensao: { type: 'string' }, geografia: { type: 'string' }, decisao: { type: 'string' },
        criterios: { type: 'array', minItems: 8, maxItems: 14, items: crit },
      }, required: ['resumo','setor','faturacao','dimensao','geografia','decisao','criterios'] },
    semelhantes: { type: 'array', minItems: 15, maxItems: 25, items: sem },
    prioritarias: { type: 'array', minItems: 6, maxItems: 10, items: sem },
    decisores: { type: 'array', minItems: 4, maxItems: 12, items: dec },
    cargos: { type: 'array', minItems: 3, maxItems: 6, items: { type: 'object', additionalProperties: false,
      properties: { cargo: { type: 'string' }, papel: { type: 'string' } }, required: ['cargo','papel'] } },
    estrategia: { type: 'array', minItems: 3, maxItems: 6, items: { type: 'object', additionalProperties: false,
      properties: { canal: { type: 'string' }, como: { type: 'string' } }, required: ['canal','como'] } },
    aviso: { type: 'string' },
    procura: { type: 'object', additionalProperties: false,
      properties: {
        filtros_osm: { type: 'array', items: { type: 'string' } },
        zonas: { type: 'array', items: { type: 'string' } },
        palavra_wikidata: { type: 'string' },
      }, required: ['filtros_osm','zonas','palavra_wikidata'] },
  },
  required: ['empresas','perfil','semelhantes','prioritarias','decisores','cargos','estrategia','aviso','procura'] };

const INSTRUCOES = `És o motor de análise de mercado da Vloom, uma agência portuguesa de marketing e vendas B2B.
Recebes três empresas que um potencial cliente gostava de ter como clientes. Trabalhas em português de Portugal, na 3.ª pessoa («a empresa», «o mercado»), sem tratar o leitor por «tu».

Usa a pesquisa web para confirmar factos. Faz entre 12 e 25 pesquisas. Só afirmas o que encontraste; o que não encontrares fica «não público».

Identificação, regra sagrada:
- NUNCA substituas a empresa escrita por outra com nome parecido. «Arena Lisboa» é a empresa chamada Arena Lisboa, não a Altice Arena. Se houver várias com esse nome, escolhe a mais provável em Portugal e diz no campo nota qual escolheste e porquê. Guarda em nome_escrito APENAS o nome tal como o utilizador o escreveu (duas ou três palavras), nunca a descrição nem a localidade.
- Para cada empresa: site oficial (URL completo com https) e página de empresa no LinkedIn (URL completo) quando existirem; senão string vazia.

Passos:
1. Identifica cada uma das três empresas: setor, sede (só cidade ou concelho), dimensão (colaboradores, no máximo 6 palavras), faturação aproximada, site, LinkedIn.
2. Perfil comum: resumo em 1 a 2 frases, e 8 a 14 critérios objetivos (setor e CAE, faturação, dimensão, geografia, modelo de negócio B2B/B2C, canais de venda, maturidade digital, presença nas redes, estrutura de decisão, propriedade familiar ou grupo, idade da empresa, ticket médio, sazonalidade, tecnologia visível). Cada critério tem um valor curto.
3. Semelhantes: 15 a 25 empresas REAIS e concretas com o mesmo perfil, em Portugal e, se fizer sentido, Espanha. Nome comercial, localidade, setor, site, LinkedIn, e uma linha a dizer porque encaixa. Proibido «várias», «ex.:», «redes de», «lojas independentes», categorias ou exemplos genéricos. Uma empresa por entrada.
4. Prioritárias: 6 a 10 das semelhantes, as que atacarias primeiro, com a razão.
5. Decisores: pessoas REAIS que confirmaste nesta pesquisa, no máximo 12 e podendo ser zero. Regras duras:
   - Só entra quem tiver perfil público encontrado por ti, com a URL completa do LinkedIn, ou um contacto publicado pela própria empresa.
   - O cargo é copiado LITERALMENTE do que está escrito na fonte (o título do perfil, a assinatura no site). Máximo seis palavras. Proibido interpretar, resumir, traduzir ou acrescentar explicações entre parênteses. Se a fonte diz «Comercial», escreves «Comercial», nunca «Account manager (equipa comercial)».
   - Na dúvida sobre o cargo ou sobre a pessoa, não a incluas. Vale mais uma lista curta e certa do que uma lista longa e errada.
   - Email e telefone só se estiverem publicados pela própria empresa. Nunca deduzas padrões de email.
   - Fonte: uma linha a dizer onde viste, sem URL.
6. Cargos: 3 a 6 cargos que influenciam a compra neste perfil, e o papel de cada um.
7. Estratégia: 3 a 6 canais para chegar a estas empresas (email, LinkedIn, Google, ABM, chamada, campanhas) com uma linha a dizer como.
8. Aviso: uma frase honesta a dizer que é um primeiro passe automático com fontes públicas e que a Vloom confirma tudo à mão antes da reunião.
9. Procura: onde ir buscar mais empresas deste perfil em dados abertos.
   - filtros_osm: 1 a 4 filtros de etiquetas do OpenStreetMap na forma ["chave"="valor"], por exemplo ["tourism"="hotel"] ou ["shop"="car"] ou ["office"="company"].
   - zonas: 6 a 10 nomes EXATOS de concelhos portugueses onde este perfil existe, começando pelos maiores mercados.
   - palavra_wikidata: uma palavra em português que apareça na descrição destas empresas.

Regras de forma, obrigatórias:
- Nos campos setor, faturacao, dimensao e geografia do perfil: no máximo 8 palavras cada, sem frases, sem parênteses, sem fontes.
- NUNCA incluas URLs fora dos campos site e linkedin. Sem «[texto](url)», sem «utm_source». As fontes ficam de fora do JSON, exceto no campo fonte dos decisores (uma linha, sem URL).
- No campo nome de cada empresa: só o nome comercial curto («Casa das Peles», não «Casa das Peles - Confecções, S.A.»), sem razão social, sem forma jurídica, sem parênteses.
- Sem siglas nem abreviaturas (escreve «Área Metropolitana de Lisboa», não «AML»; «pequenas e médias empresas», não «SMB» nem «PME» sem contexto).
- Todos os textos começam com maiúscula e são frases ou expressões completas.
- NUNCA peças confirmação, NUNCA perguntes se deves avançar, NUNCA devolvas campos vazios ou listas vazias: esta é a única volta que tens, entrega sempre a análise completa com o melhor que encontraste.
Sê concreto e curto. Sem adjetivos em fila.`;

const eURL = v => /^https?:\/\/\S+$/i.test(String(v || '').trim());
const limpa = (v, chave) => typeof v === 'string'
  ? (chave === 'site' || chave === 'linkedin')
    ? (eURL(v) ? v.trim() : '')
    : v.replace(/\[([^\]]*)\]\((https?:[^)]*)\)/g, '$1').replace(/\(?https?:\/\/\S+\)?/g, '')
       .replace(/\s*[—–]\s*/g, ', ').replace(/,\s*,/g, ',').replace(/\s{2,}/g, ' ').trim()
       .replace(/^\p{Ll}/u, c => c.toUpperCase())
  : v;
function limpar(o, chave) {
  if (Array.isArray(o)) return o.map(x => limpar(x));
  if (o && typeof o === 'object') { const r = {}; for (const k of Object.keys(o)) r[k] = limpar(o[k], k); return r; }
  return limpa(o, chave);
}
const GENERICO = /\b(local|locais|independente|independentes|regional|regionais|filial|marca interna|concesionario|concessionário|boutique|atelier|distribuidor|revenda|várias|varias|ex\.?:|lojas de|redes de|stand de|mercado)\b/i;
function filtrarGenericos(r) {
  if (!r || typeof r !== 'object') return r;
  const ok = x => x && x.nome && !GENERICO.test(x.nome) && !/['"]/.test(x.nome);
  const arr = x => ({ ...x, nome: String(x.nome).replace(/\s*\([^)]*\)\s*/g, ' ').trim() });
  if (Array.isArray(r.semelhantes)) r.semelhantes = r.semelhantes.filter(ok).map(arr);
  if (Array.isArray(r.prioritarias)) r.prioritarias = r.prioritarias.filter(ok).map(arr);
  if (Array.isArray(r.decisores)) r.decisores = r.decisores
    .filter(d => d && d.nome && !/não público|desconhecid|^(contacto|contato|geral|departamento|equipa|equipe|direção|direcção|administração|secretariado)\b/i.test(d.nome.trim()) && /\s/.test(d.nome.trim()))
    // sem perfil ou contacto público não há como confirmar quem é: fora
    .filter(d => (d.linkedin && /^https?:\/\//i.test(d.linkedin)) || d.email || d.telefone)
    // o cargo é o que está escrito na fonte, sem interpretações entre parênteses
    .map(d => ({ ...d, cargo: String(d.cargo || '').replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s{2,}/g, ' ').trim() }))
    .filter(d => d.cargo && d.cargo.split(/\s+/).length <= 6);
  return r;
}
const magro = r => !r || !Array.isArray(r.empresas) || r.empresas.length < 3 || !Array.isArray(r.semelhantes) || r.semelhantes.length < 8 || !(r.perfil && r.perfil.resumo);
module.exports = { SCHEMA, INSTRUCOES, limpar, magro, filtrarGenericos };

// ── Motor gratuito ────────────────────────────────────────────────────────────
// Passo 1: identificar as três e dizer ONDE procurar as parecidas (categorias do
// OpenStreetMap e zonas), para a recolha ser feita em fontes abertas e não de cor.
const SCHEMA_PERFIL = { type: 'object', additionalProperties: false,
  properties: {
    empresas: { type: 'array', items: emp },
    perfil: { type: 'object', additionalProperties: false,
      properties: {
        resumo: { type: 'string' }, setor: { type: 'string' }, faturacao: { type: 'string' },
        dimensao: { type: 'string' }, geografia: { type: 'string' }, decisao: { type: 'string' },
        criterios: { type: 'array', items: crit },
      }, required: ['resumo','setor','faturacao','dimensao','geografia','decisao','criterios'] },
    procura: { type: 'object', additionalProperties: false,
      properties: {
        filtros_osm: { type: 'array', items: { type: 'string' } },
        zonas: { type: 'array', items: { type: 'string' } },
        palavra_wikidata: { type: 'string' },
      }, required: ['filtros_osm','zonas','palavra_wikidata'] },
  }, required: ['empresas','perfil','procura'] };

const INSTRUCOES_PERFIL = `És o motor de análise de mercado da Vloom, agência portuguesa de marketing e vendas.
Recebes três empresas que alguém gostava de ter como clientes. Escreves em português de Portugal, na 3.ª pessoa.

1. Identifica cada uma: setor, sede (só cidade ou concelho), dimensão, faturação aproximada, site oficial e LinkedIn se souberes com segurança; o que não souberes fica string vazia. NUNCA troques a empresa escrita por outra de nome parecido. Em nome_escrito guarda o nome tal como foi escrito.
2. Perfil comum: resumo de uma a duas frases e 8 a 14 critérios objetivos, cada um com valor curto.
3. Procura: diz onde ir buscar empresas iguais em fontes abertas.
   - filtros_osm: 1 a 4 filtros de etiquetas do OpenStreetMap, no formato ["chave"="valor"], por exemplo ["tourism"="hotel"] ou ["shop"="car"] ou ["office"="company"]. Escolhe as etiquetas que melhor descrevem este tipo de negócio.
   - zonas: 4 a 6 nomes EXATOS de concelhos portugueses onde este perfil existe, começando pelos maiores mercados, por exemplo Lisboa, Porto, Cascais, Braga, Faro.
   - palavra_wikidata: uma palavra em português que apareça na descrição destas empresas, por exemplo hotel, seguradora, construtora.

Regras: no máximo 8 palavras nos campos setor, faturacao, dimensao e geografia. Sem siglas. Sem URLs fora dos campos site e linkedin. Nomes comerciais curtos.

ORTOGRAFIA, obrigatório: escreve português de Portugal COM acentos e cedilhas (serviços, restauração, hotelaria, presença, público, estratégia). Texto sem acentos é inaceitável.`;

const INSTRUCOES_COMPOR = `És o motor de análise de mercado da Vloom, agência portuguesa de marketing e vendas. Escreves em português de Portugal, na 3.ª pessoa.

Recebes: as três empresas já identificadas, o perfil comum, e uma LISTA DE EMPRESAS REAIS recolhida em fontes abertas (OpenStreetMap e Wikidata), com nome, morada, site e telefone.

Regra sagrada: as empresas de semelhantes e prioritarias saem TODAS dessa lista. Não inventes nomes nem sites. Se a lista trouxer menos de 15 utilizáveis, usa as que houver e não completes com invenções. Copia os sites tal como vêm; onde não houver site, deixa string vazia.

Faz:
1. empresas: repete as três empresas identificadas, tal como te são dadas.
2. perfil: repete o perfil dado, mantendo os critérios.
3. semelhantes: entre 15 e 25 empresas da lista, as que melhor encaixam no perfil, com localidade, setor e uma linha a dizer porquê. Se a lista tiver menos de 15 utilizáveis, usa todas as que houver.
4. prioritarias: 6 a 10 das semelhantes, as que atacarias primeiro, com a razão.
5. decisores: só pessoas com nome que conheças com segurança destas empresas; se não tiveres, devolve lista vazia. Nunca inventes nomes, emails nem telefones.
6. cargos: 3 a 6 cargos que decidem a compra neste perfil, e o papel de cada um.
7. estrategia: 3 a 6 canais para chegar a estas empresas, com uma linha a dizer como.
8. aviso: uma frase a dizer que é um primeiro passe automático a partir de fontes públicas abertas e que a Vloom confirma tudo à mão antes da reunião.

Regras de forma: nomes comerciais curtos, sem forma jurídica; sem siglas; sem URLs fora dos campos site e linkedin; textos a começar por maiúscula.

ORTOGRAFIA, obrigatório: escreve português de Portugal COM acentos e cedilhas (serviços, restauração, hotelaria, presença, público, estratégia). Texto sem acentos é inaceitável.`;

module.exports.SCHEMA_PERFIL = SCHEMA_PERFIL;
module.exports.INSTRUCOES_PERFIL = INSTRUCOES_PERFIL;
module.exports.INSTRUCOES_COMPOR = INSTRUCOES_COMPOR;
