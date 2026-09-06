// Prompt e esquema do motor dos "3 clientes de sonho". Partilhado por motor-3clientes.js.
const SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    empresas: { type: 'array', items: { type: 'object', additionalProperties: false,
      properties: { nome:{type:'string'}, setor:{type:'string'}, sede:{type:'string'}, dimensao:{type:'string'}, faturacao:{type:'string'}, nota:{type:'string'} },
      required: ['nome','setor','sede','dimensao','faturacao','nota'] } },
    perfil: { type: 'object', additionalProperties: false,
      properties: { resumo:{type:'string'}, setor:{type:'string'}, faturacao:{type:'string'}, dimensao:{type:'string'}, geografia:{type:'string'}, decisao:{type:'string'} },
      required: ['resumo','setor','faturacao','dimensao','geografia','decisao'] },
    semelhantes: { type: 'array', items: { type: 'object', additionalProperties: false,
      properties: { nome:{type:'string'}, localidade:{type:'string'}, porque:{type:'string'} }, required: ['nome','localidade','porque'] } },
    prioritarias: { type: 'array', items: { type: 'object', additionalProperties: false,
      properties: { nome:{type:'string'}, porque:{type:'string'} }, required: ['nome','porque'] } },
    cargos: { type: 'array', items: { type: 'object', additionalProperties: false,
      properties: { cargo:{type:'string'}, papel:{type:'string'} }, required: ['cargo','papel'] } },
    estrategia: { type: 'array', items: { type: 'object', additionalProperties: false,
      properties: { canal:{type:'string'}, como:{type:'string'} }, required: ['canal','como'] } },
    aviso: { type: 'string' },
  },
  required: ['empresas','perfil','semelhantes','prioritarias','cargos','estrategia','aviso'],
};

const INSTRUCOES = `És analista de mercado B2B da Vloom, agência portuguesa. Recebes três empresas que um cliente gostava de ter como clientes.
Escreves em português de Portugal, norma ortográfica actual (direto, ação, contacto), tratamento «você» implícito. NUNCA uses travessões (— ou –): usa vírgula, dois pontos ou ponto final.
Tarefa, por esta ordem:
1) Identifica cada uma das três empresas com pesquisa web: setor, sede, dimensão (trabalhadores) e faturação aproximada. Se não tiveres a certeza de um número, escreve «aprox.» ou «não público». Nunca inventes números precisos.
2) Extrai o PERFIL COMUM: o que as três têm em comum (setor, faturação, dimensão, geografia, como se decide uma compra lá dentro).
3) Lista empresas SEMELHANTES REAIS que caibam nesse perfil, em Portugal e Espanha: entre 15 e 25, com localidade e uma razão curta cada. Só empresas que existem. Isto é obrigatório: NUNCA devolvas menos de 12. Se as três forem PME ou marcas pouco conhecidas, alarga o critério (mesmo setor e dimensão semelhante, mesma região ou regiões vizinhas, concorrentes diretos de cada uma, empresas listadas em diretórios e associações do setor) e pesquisa até as encontrares. Prefere empresas com sede em Portugal; completa com Espanha se faltar.
4) Escolhe 5 a 8 PRIORITÁRIAS de entre as semelhantes, com a razão. Obrigatório: nunca menos de 5.
5) Indica 4 a 6 CARGOS que influenciam a compra neste tipo de empresa e o papel de cada um.
6) Propõe 3 a 5 CANAIS de abordagem concretos para este perfil (email, LinkedIn, Google, ABM, chamada, campanhas), com uma frase de como.
No campo «aviso» escreve uma frase honesta: é um primeiro passe automático com fontes públicas, confirmado à mão antes da reunião.
Regras de forma, obrigatórias:
- Nos campos setor, faturacao, dimensao e geografia do perfil: no máximo 8 palavras cada, sem frases, sem parênteses, sem fontes.
- NUNCA incluas URLs, links, «[texto](url)» nem «utm_source» em campo nenhum. As fontes ficam de fora do JSON.
- Em semelhantes e prioritarias só entram NOMES DE EMPRESAS CONCRETAS. Proibido «várias», «ex.:», «redes de», «lojas independentes», categorias ou exemplos genéricos. Uma empresa por entrada.
- No campo nome de cada empresa: só o nome comercial, sem razão social entre parênteses.
- sede: só cidade ou concelho (ex.: «Trofa»), nunca a morada completa. dimensao: número aproximado de colaboradores, no máximo 6 palavras.
NUNCA peças confirmação, NUNCA perguntes se deves avançar, NUNCA devolvas campos vazios ou listas vazias: esta é a única volta que tens, entrega sempre a análise completa com o melhor que encontraste. Se um dado não existir, escreve «não público».
Sê concreto e curto. Sem adjetivos em fila.`;

// tira travessões que escapem ao modelo: a lista negra da casa não os deixa passar
const limpa = v => typeof v === 'string'
  ? v.replace(/\[([^\]]*)\]\((https?:[^)]*)\)/g, '$1')      // [texto](url) -> texto
     .replace(/\(?https?:\/\/\S+\)?/g, '')                  // urls soltos
     .replace(/\s*[—–]\s*/g, ', ').replace(/,\s*,/g, ',').replace(/\s{2,}/g, ' ').trim()
  : v;
function limpar(o) {
  if (Array.isArray(o)) return o.map(limpar);
  if (o && typeof o === 'object') { const r = {}; for (const k in o) r[k] = limpar(o[k]); return r; }
  return limpa(o);
}

// entradas genéricas que o modelo usa para encher a lista: fora
const GENERICO = /\b(local|locais|independente|independentes|regional|regionais|filial|marca interna|concesionario|concessionário|boutique|atelier|distribuidor|revenda|várias|varias|ex\.?:|lojas de|redes de|stand de|mercado)\b/i;
function filtrarGenericos(r) {
  if (!r || typeof r !== 'object') return r;
  const ok = x => x && x.nome && !GENERICO.test(x.nome) && !/[()'"]/.test(x.nome.replace(/\(([^)]*)\)/g, m => /portugal|espanha|spain|pt|es|grupo/i.test(m) ? '' : m));
  if (Array.isArray(r.semelhantes)) r.semelhantes = r.semelhantes.filter(ok).map(x => ({ ...x, nome: x.nome.replace(/\s*\([^)]*\)\s*/g, ' ').trim() }));
  if (Array.isArray(r.prioritarias)) r.prioritarias = r.prioritarias.filter(ok).map(x => ({ ...x, nome: x.nome.replace(/\s*\([^)]*\)\s*/g, ' ').trim() }));
  return r;
}

// resultado magro = o modelo fugiu ao trabalho; o motor volta a tentar com o modelo grande
const magro = r => !r || !Array.isArray(r.empresas) || r.empresas.length < 3 || !Array.isArray(r.semelhantes) || r.semelhantes.length < 8 || !(r.perfil && r.perfil.resumo);
module.exports = { SCHEMA, INSTRUCOES, limpar, magro, filtrarGenericos };
