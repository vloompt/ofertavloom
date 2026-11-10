# Gera as páginas de destino dos links «é este o meu caso» (email #1 da sequência
# 🤝 Compareceu Sem Pedir Proposta, GHL Vloom 8b4d36b2) e do «parar» do email #5.
# Cada motivo = um cliente REAL que disse aquilo em vídeo (transcrições conferidas
# a 10/11/2026; o vídeo arranca no segundo em que ele o diz).
# Corre: python3 motivo/gerar.py
import pathlib
AQUI = pathlib.Path(__file__).parent
MARCAR = "https://marketing.vloom.pt/marcar-reuniao/?utm_source=email&utm_medium=email&utm_campaign=vloom-motivos"
CARAS = "/10reunioes/assets/caras/"

PAGINAS = {
  "e-caro": dict(
    motivo="É caro",
    h1="“Custa muito dinheiro.<br><em>Mas não é caro.</em>”",
    lede="Quem o diz é o Dr. Bernardo Caria, da Clínica CAB em Barcelos. Também achou o nosso serviço caro. O vídeo começa no momento em que ele explica porque mudou de ideias.",
    vimeo="1155016610", t="1m44s", poster="cab-poster.jpg",
    nome="Dr. Bernardo Caria", quem="Clínica CAB, Barcelos",
    chips=["+100 leads no 1.º mês", "Investimento pago no 1.º mês"],
    citacao="Logo a partir do primeiro mês tivemos mais de 100 leads. Conseguimos fechar logo dois ou três e foi o suficiente para pagar o investimento inicial.",
    corpo=[
      "Caro e custar dinheiro não é a mesma coisa.",
      "Caro é pagar todos os meses por algo que não sabe se lhe traz clientes.",
      "O Dr. Bernardo sabe exatamente quanto entrou por causa do serviço que paga. É por isso que, para ele, deixou de ser caro.",
      "Numa reunião de 15 minutos faço-lhe essa conta com os números do seu negócio: quanto lhe custaria cada cliente novo.",
    ]),
  "nao-e-a-altura": dict(
    motivo="Agora não é a melhor altura",
    h1="Começou na <em>pior altura</em> possível.<br>Foi o que mudou tudo.",
    lede="A Anita Santos Rubin, seis vezes campeã do mundo de salsa, começou a trabalhar connosco em plena quarentena.",
    vimeo="817572683", t="", poster="anita-poster.jpg",
    nome="Anita Santos Rubin", quem="Escola de dança",
    chips=["Aulas online são hoje a principal fonte de rendimento", "7× o investimento de volta"],
    citacao="Pude começar a dar as minhas aulas online no momento em que eu mais precisava, na quarentena.",
    corpo=[
      "A altura certa nunca chega. Quando há tempo, falta urgência. Quando há urgência, falta tempo.",
      "O Sheraton Lisboa também nos procurou no fim da pandemia, um dos períodos mais difíceis de sempre para a hotelaria.",
      "Um sistema que só funciona quando tem tempo para o alimentar não serve. O nosso trabalho é pô-lo a funcionar enquanto está ocupado com o resto.",
    ]),
  "ja-tentamos": dict(
    motivo="Já tentámos e não resultou",
    h1="“Não queremos uma agência<br>que só <em>executa o brief</em>.”",
    lede="Thierry Henrot, diretor-geral do Sheraton Lisboa, sabia bem o que não queria de uma agência. O vídeo começa no momento em que ele o explica.",
    vimeo="825008560", t="3m56s", poster="thierry-poster.jpg",
    nome="Thierry Henrot", quem="Diretor-geral, Sheraton Lisboa",
    chips=["Alcance +300% em 5 meses", "Engajamento a dobrar no 1.º mês"],
    citacao="Trabalhar com a Vloom é um pouco diferente de outras agências. Funciona maravilhosamente bem.",
    corpo=[
      "Se já tentou e não resultou, não está sozinho. Muitos dos nossos clientes chegaram depois de uma experiência que correu mal.",
      "A diferença raramente está no esforço. Está em haver um sistema por trás: saber de onde vem cada cliente e quanto custou.",
      "É como no amor: raramente se casa com a primeira namorada.",
    ]),
  "alguem-interno": dict(
    motivo="Temos alguém interno a tratar disso",
    h1="Publicar nas redes é importante.<br>Mas sabe <em>quanto lhe rende</em>?",
    lede="O Dr. Bernardo Caria já fazia redes sociais na clínica antes de trabalhar connosco. O vídeo começa no momento em que ele explica a diferença.",
    vimeo="1155016610", t="1m10s", poster="cab-poster.jpg",
    nome="Dr. Bernardo Caria", quem="Clínica CAB, Barcelos",
    chips=["+100 leads no 1.º mês", "Cada paciente com origem conhecida"],
    citacao="As redes sociais são um investimento a longo prazo que eu nem sei medir. Agora, quando um paciente vem por aqui, sabemos: este dinheiro entrou por causa deste serviço.",
    corpo=[
      "Não lhe vou dizer que a pessoa da sua equipa faz mal o trabalho. Provavelmente faz bem.",
      "Mas publicar conteúdo e ter um sistema que traz clientes são trabalhos diferentes. Publicar dá credibilidade e deve continuar.",
      "Um sistema diz-lhe quanto custa cada cliente que entra pela porta. Não substitui ninguém: junta-se ao que já tem.",
    ]),
}

PLAY = '<svg width="26" height="30" viewBox="0 0 26 30" fill="none"><path d="M3 2.5 23.5 15 3 27.5V2.5Z" fill="currentColor" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"/></svg>'

def cabeca(titulo):
    return f"""<!DOCTYPE html>
<html lang="pt-PT">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vloom · {titulo}</title>
<meta name="robots" content="noindex">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" as="image" href="{CARAS}{{poster}}">
<link rel="stylesheet" href="/motivo/estilo.css?v=3">
</head>
<body>
<header class="barra"><div class="wrap"><img src="/10reunioes/assets/logo-branco.svg" alt="Vloom"></div></header>
"""

RODAPE = """<footer><div class="wrap legal">
  <span>© 2026 Vloom, Agência de Marketing e Publicidade Digital, Lda.</span>
  <span><a href="https://vloom.pt/politica-de-privacidade/" target="_blank" rel="noopener">Política de Privacidade</a></span>
</div></footer>
<script>
document.querySelectorAll('.tv').forEach(function(b){
  b.addEventListener('click',function(){
    var f=document.createElement('iframe');
    f.src='https://player.vimeo.com/video/'+b.dataset.vimeo+'?autoplay=1&title=0&byline=0&portrait=0'+(b.dataset.t?'#t='+b.dataset.t:'');
    f.allow='autoplay; fullscreen; picture-in-picture'; f.title=b.getAttribute('aria-label');
    b.innerHTML=''; b.appendChild(f); b.classList.add('on');
  },{once:true});
});
</script>
</body>
</html>
"""

def pagina(p):
    chips = "".join(f"<li>{c}</li>" for c in p["chips"])
    corpo = "".join(f"<p>{x}</p>" for x in p["corpo"])
    return (cabeca(p["motivo"]).replace("{poster}", p["poster"]) + f"""
<main>
<section class="heroi"><div class="wrap grelha">
  <div class="txt">
    <span class="escolha">Escolheu <b>“{p['motivo']}”</b></span>
    <h1>{p['h1']}</h1>
    <p class="lede">{p['lede']}</p>
  </div>
  <figure class="video">
    <button class="tv" type="button" data-vimeo="{p['vimeo']}" data-t="{p['t']}" aria-label="Ver o testemunho de {p['nome']}">
      <img src="{CARAS}{p['poster']}" alt="{p['nome']}, {p['quem']}" width="1280" height="720">
      <span class="tv-bt">{PLAY}</span>
      <span class="tv-tag">Ver o testemunho</span>
    </button>
    <figcaption><b>{p['nome']}</b><span>{p['quem']}</span><ul class="chips">{chips}</ul></figcaption>
  </figure>
</div></section>

<section class="cit"><div class="wrap estreito">
  <blockquote>“{p['citacao']}”<cite>{p['nome']} · {p['quem']}</cite></blockquote>
  <div class="carta">{corpo}
    <p class="ass">Vou voltar ao trabalho,<br><b>Tiago Severino</b><span>Vloom · Head of Marketing</span></p>
  </div>
</div></section>

<section class="fim"><div class="wrap estreito">
  <h2>Quer ver os números para o seu caso?</h2>
  <p>Quinze minutos. Mostro-lhe quanto lhe custaria cada cliente novo e diz-me se faz sentido.</p>
  <a class="bt" href="{MARCAR}">Marcar 15 minutos</a>
  <small>Já não recebe os emails sobre os outros motivos.</small>
</div></section>
</main>
""" + RODAPE)

for pasta, p in PAGINAS.items():
    d = AQUI / pasta; d.mkdir(exist_ok=True)
    (d / "index.html").write_text(pagina(p))

# «parar» (email #5): sem vídeo, sem venda. Só confirma.
d = AQUI / "parar"; d.mkdir(exist_ok=True)
(d / "index.html").write_text(cabeca("Combinado").replace('<link rel="preload" as="image" href="/10reunioes/assets/caras/{poster}">\n', "") + """
<main>
<section class="heroi so"><div class="wrap estreito">
  <span class="escolha">Pedido recebido</span>
  <h1>Combinado.<br>Eu <em>paro aqui</em>.</h1>
  <p class="lede">Não lhe volto a escrever sobre isto. Amigos como dantes.</p>
  <p class="lede">Se um dia mudar de ideias, basta responder a qualquer email meu. Leio todos.</p>
  <p class="ass">Tiago Severino<span>Vloom · Head of Marketing</span></p>
</div></section>
</main>
""" + RODAPE)
print("ok")
