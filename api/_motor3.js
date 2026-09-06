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
  },
  required: ['empresas','perfil','semelhantes','prioritarias','decisores','cargos','estrategia','aviso'] };

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
5. Decisores: 4 a 12 pessoas REAIS com nome e cargo nas empresas prioritárias ou nas três escolhidas, com a URL pública do LinkedIn quando existir. Email e telefone só se estiverem publicados pela própria empresa (site, comunicados, registos); nunca inventes nem deduzas padrões de email. Se não houver, string vazia. Diz a fonte em uma linha.
6. Cargos: 3 a 6 cargos que influenciam a compra neste perfil, e o papel de cada um.
7. Estratégia: 3 a 6 canais para chegar a estas empresas (email, LinkedIn, Google, ABM, chamada, campanhas) com uma linha a dizer como.
8. Aviso: uma frase honesta a dizer que é um primeiro passe automático com fontes públicas e que a Vloom confirma tudo à mão antes da reunião.

Regras de forma, obrigatórias:
- Nos campos setor, faturacao, dimensao e geografia do perfil: no máximo 8 palavras cada, sem frases, sem parênteses, sem fontes.
- NUNCA incluas URLs fora dos campos site e linkedin. Sem «[texto](url)», sem «utm_source». As fontes ficam de fora do JSON, exceto no campo fonte dos decisores (uma linha, sem URL).
- No campo nome de cada empresa: só o nome comercial, sem razão social entre parênteses.
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
  if (Array.isArray(r.decisores)) r.decisores = r.decisores.filter(d => d && d.nome && !/não público|desconhecid|^(contacto|contato|geral|departamento|equipa|equipe|direção|direcção|administração|secretariado)\b/i.test(d.nome.trim()) && /\s/.test(d.nome.trim()));
  return r;
}
const magro = r => !r || !Array.isArray(r.empresas) || r.empresas.length < 3 || !Array.isArray(r.semelhantes) || r.semelhantes.length < 8 || !(r.perfil && r.perfil.resumo);
module.exports = { SCHEMA, INSTRUCOES, limpar, magro, filtrarGenericos };
