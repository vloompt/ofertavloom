# Gera as páginas de destino dos links «é este o meu caso» (email #1 da sequência
# 🤝 Compareceu Sem Pedir Proposta, GHL Vloom 8b4d36b2) e do «parar» do email #5.
# Linguagem visual = a da LP /10reunioes/ (base.css é cópia do CSS dela).
# Cada motivo = um cliente REAL que disse aquilo em vídeo (transcrições conferidas
# a 10/11/2026; o vídeo arranca no segundo em que ele o diz).
# Corre: python3 motivo/gerar.py
import pathlib
AQUI = pathlib.Path(__file__).parent
A = "/10reunioes/assets/"
MARCAR = "https://marketing.vloom.pt/marcar-reuniao/?utm_source=email&utm_medium=email&utm_campaign=vloom-motivos"
V = "?v=5"

SETA = '<svg width="24" height="17" viewBox="0 0 22 16" fill="none" aria-hidden="true"><path d="M1 8h19M14 1.5 20.5 8 14 14.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
PLAY = '<svg width="22" height="26" viewBox="0 0 26 30" fill="none"><path d="M3 2.5 23.5 15 3 27.5V2.5Z" fill="currentColor" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"/></svg>'
CHECK = '<svg width="15" height="12" viewBox="0 0 15 12" fill="none" aria-hidden="true"><path d="m1.5 6 4 4.5L13.5 1.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'

# testemunhos curtos (os mesmos da LP /10reunioes/)
DEP = {
  "anita":   ("817572683", "anita-poster.jpg", "Anita Santos Rubin,", "Escola de Dança", "Hoje a minha principal fonte de renda são as aulas online, graças ao marketing digital da Vloom.", "De 75 para mais de 200 alunas online"),
  "joao":    ("817572943", "joao-poster.jpg", "João Matos,", "Formação Profissional", "Com a Vloom posso dizer que aumentei as vendas que tinha em pelo menos 200 a 300%.", "Vendas a subir entre 200% e 300%"),
  "thierry": ("817389061", "thierry-poster.jpg", "Thierry Henrot,", "Marriott International", "Trabalhar com a Vloom é diferente de trabalhar com outras agências: funciona maravilhosamente bem.", "Engajamento a dobrar e 3,6 milhões de pessoas alcançadas"),
  "ines":    ("817578525", "ines-poster.jpg", "Inês Gonçalves,", "Vestuário Motard", "Acho que o resultado tem sido muito positivo, não trocaríamos de agência.", "Quatro anos connosco, sem trocar de agência"),
}

PAGINAS = {
  "e-caro": dict(
    motivo="É caro",
    eyebrow="O Dr. Bernardo Caria também achou caro. Veja o que mudou.",
    h1="Custa muito dinheiro. <em>Mas não é caro.</em>",
    linha="<b>Caro é pagar por algo que não sabe se lhe traz clientes.</b> Ele sabe exatamente quanto entrou por causa do serviço que paga.",
    vimeo="1155016610", t="1m44s", poster="cab-poster.jpg",
    nome="Dr. Bernardo Caria", quem="Clínica CAB, Barcelos",
    res=["+100 leads no 1.º mês", "Investimento pago com os primeiros clientes"],
    citacao="Rapidamente percebemos que é uma coisa que custa muito dinheiro, mas não é caro, porque conseguíamos ir buscar o dinheiro que estávamos a investir.",
    pontos_h2="O que <em>muda a conta</em>",
    pontos=[
      "No primeiro mês, a clínica recebeu <b>mais de 100 leads</b>.",
      "Fechou <b>dois ou três tratamentos</b> e isso chegou para pagar o investimento inicial.",
      "Cada paciente tem <b>origem conhecida</b>: sabe-se que veio daqui e quanto custou.",
    ],
    outros=["joao", "ines"]),
  "nao-e-a-altura": dict(
    motivo="Agora não é a melhor altura",
    eyebrow="A Anita começou connosco em plena quarentena.",
    h1="Começou na pior altura possível. <em>Foi o que mudou tudo.</em>",
    linha="<b>A altura certa nunca chega.</b> Quando há tempo, falta urgência. Quando há urgência, falta tempo.",
    vimeo="817572683", t="", poster="anita-poster.jpg",
    nome="Anita Santos Rubin", quem="Seis vezes campeã do mundo de salsa",
    res=["As aulas online são hoje a principal fonte de rendimento", "De 75 para mais de 200 alunas online"],
    citacao="Pude começar a dar as minhas aulas online no momento em que eu mais precisava, na quarentena.",
    pontos_h2="Porque é que <em>ocupado é a melhor altura</em>",
    pontos=[
      "O Sheraton Lisboa também nos procurou <b>no fim da pandemia</b>, um dos piores períodos de sempre para a hotelaria.",
      "Um sistema que só funciona quando tem tempo para o alimentar <b>não serve</b>.",
      "O nosso trabalho é pô-lo a funcionar <b>enquanto está ocupado</b> com o resto.",
    ],
    outros=["thierry", "joao"]),
  "ja-tentamos": dict(
    motivo="Já tentámos e não resultou",
    eyebrow="O Sheraton Lisboa já tinha trabalhado com agências.",
    h1="Não queriam mais uma agência <em>que só executa o brief.</em>",
    linha="<b>A diferença raramente está no esforço.</b> Está em haver um sistema por trás: saber de onde vem cada cliente e quanto custou.",
    vimeo="825008560", t="3m56s", poster="thierry-poster.jpg",
    nome="Thierry Henrot", quem="Diretor-geral, Sheraton Lisboa",
    res=["Alcance +300% em 5 meses", "Engajamento a dobrar no 1.º mês"],
    citacao="Trabalhar com a Vloom é um pouco diferente de outras agências. Funciona maravilhosamente bem.",
    pontos_h2="Se já tentou, <em>não está sozinho</em>",
    pontos=[
      "Muitos dos nossos clientes chegaram <b>depois de uma experiência que correu mal</b>.",
      "O João Matos também andava a investir nas redes <b>sem ver retorno</b>. Hoje recebe mais de 1.000 leads por mês.",
      "É como no amor: <b>raramente se casa com a primeira namorada</b>.",
    ],
    outros=["ines", "joao"]),
  "alguem-interno": dict(
    motivo="Temos alguém interno a tratar disso",
    eyebrow="A clínica do Dr. Bernardo Caria já fazia redes sociais.",
    h1="Publicar nas redes é importante. <em>Mas sabe quanto lhe rende?</em>",
    linha="<b>Publicar e trazer clientes são trabalhos diferentes.</b> Não substituímos ninguém: juntamo-nos ao que já tem.",
    vimeo="1155016610", t="1m10s", poster="cab-poster.jpg",
    nome="Dr. Bernardo Caria", quem="Clínica CAB, Barcelos",
    res=["+100 leads no 1.º mês", "Cada paciente com origem conhecida"],
    citacao="As redes sociais são um investimento a longo prazo que eu nem sei medir. Agora, quando um paciente vem daqui, sabemos: este dinheiro entrou por causa deste serviço.",
    pontos_h2="O que a sua equipa <em>continua a fazer</em>",
    pontos=[
      "Publicar dá <b>credibilidade</b> e deve continuar. A pessoa da sua equipa provavelmente faz bem o trabalho.",
      "O que falta é o <b>sistema</b>: anúncios, seguimento das leads e a conta de quanto custa cada cliente.",
      "Na Casa das Peles, <b>a própria equipa aparece nos conteúdos</b>. Trabalhamos com quem lá está.",
    ],
    outros=["ines", "thierry"]),
}

def cabeca(titulo, selo, preload=""):
    return f"""<!DOCTYPE html>
<html lang="pt-PT">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vloom · {titulo}</title>
<meta name="robots" content="noindex">
<link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
{preload}<link rel="stylesheet" href="/motivo/base.css{V}">
<link rel="stylesheet" href="/motivo/motivo.css{V}">
</head>
<body>
<header>
  <div class="wrap hd">
    <img class="lg" src="{A}logo-branco.svg" alt="Vloom">
    <span class="selo-topo">{selo}</span>
    <a class="mini" href="{MARCAR}">Marcar 15 minutos</a>
  </div>
</header>
"""

def dep(k):
    vid, poster, nome, quem, cit, res = DEP[k]
    return f"""<div class="dep" data-vimeo="{vid}">
        <button class="tv-play" style="--pt:url('{A}caras/{poster}')" type="button" aria-label="Ver o testemunho de {nome.rstrip(',')}">
          <img src="{A}caras/{poster}" alt="{nome.rstrip(',')}, {quem}" loading="lazy">
          <span class="tv-bt">{PLAY}</span>
        </button>
        <div class="nome"><b>{nome}</b><b>{quem}</b></div>
        <p class="cit">{cit}</p>
        <div class="res">{res}</div>
      </div>"""

TICKER = """<div class="ticker">
  <div class="rot">Marcas que já confiaram o crescimento delas à Vloom</div>
  <div class="pista"><div class="ticker-inner" id="pista"></div></div>
</div>"""

def rodape():
    return f"""<footer>
  <div class="wrap">
    <div class="fg">
      <div><img src="{A}logo-branco.svg" alt="Vloom"><p>Agência de Marketing e Publicidade Digital.<br>Atraia clientes sem risco.</p></div>
      <div><b>Contactos</b><p><a href="tel:+351914310656">(+351) 914 310 656</a><br><span style="font-size:11.5px;opacity:.7">Chamada para rede móvel nacional</span><br><a href="https://vloom.pt" target="_blank" rel="noopener">vloom.pt</a></p></div>
      <div><b>Legal</b><p><a href="https://vloom.pt/politica-de-privacidade/" target="_blank" rel="noopener">Política de Privacidade</a></p></div>
    </div>
    <div class="legal"><span>© 2026 Vloom, Agência de Marketing e Publicidade Digital, Lda.</span><span>Design by Vloom</span></div>
  </div>
</footer>
<script>
(function(){{
  document.querySelectorAll('.dep,.destaque').forEach(function(fig){{
    var bt=fig.querySelector('.tv-play'); if(!bt) return;
    bt.addEventListener('click',function(){{
      var t=fig.getAttribute('data-t');
      var f=document.createElement('iframe');
      f.src='https://player.vimeo.com/video/'+fig.getAttribute('data-vimeo')+'?autoplay=1&title=0&byline=0&portrait=0'+(t?'#t='+t:'');
      f.allow='autoplay; fullscreen; picture-in-picture'; f.setAttribute('allowfullscreen','');
      f.title='Testemunho de cliente da Vloom'; bt.replaceWith(f);
    }});
  }});
}})();
(function(){{
  var m=[["sheraton1","Marriott International"],["weleda1","Weleda"],["sktechers1","Skechers"],["allianz1","Allianz"],["seg1","Segurança Máxima"],["try1","Try Moto"],["nortecar","Nortecar"],["cas1","Casa das Peles"],["euro1","Eurofirms"],["ca1","CA"],["meusuper","Meu Super"],["calve","Calvé"],["hellmans","Hellmann's"],["tedbx","TEDx"],["bdrfinan","BDR"],["exs1","Exs"],["smil1","Smile Bath"]];
  var p=document.getElementById("pista"); if(!p) return; var h="";
  for(var v=0;v<2;v++) m.forEach(function(x){{ h+='<span class="lg"><img src="{A}logos-uni/'+x[0]+'.png" alt="'+x[1]+'" loading="lazy"></span>'; }});
  p.innerHTML=h;
}})();
{open(AQUI / "bob.js").read()}
</script>
</body>
</html>
"""

def bob(txt="Quero ver os números do meu caso"):
    return f'<a class="bob" href="{MARCAR}">{txt}{SETA}</a>'

def primeiro_nome(n):
    return n.split()[1] if n.startswith("Dr.") else n.split()[0]

def pagina(p):
    res = "".join(f"<li>{CHECK}<span>{r}</span></li>" for r in p["res"])
    pontos = "".join(f'<div class="dor"><span class="aspas">0{i}</span><p>{x}</p></div>' for i, x in enumerate(p["pontos"], 1))
    outros = "".join(dep(k) for k in p["outros"])
    return cabeca(p["motivo"], f'Escolheu: “{p["motivo"]}”', f'<link rel="preload" as="image" href="{A}caras/{p["poster"]}">\n') + f"""
<section class="hero">
  <div class="wrap">
    <div class="centro estreito">
      <p class="eyebrow">{p['eyebrow']}</p>
      <h1>{p['h1']}</h1>
      <div class="garantia-linha">{p['linha']}</div>
    </div>

    <figure class="destaque" data-vimeo="{p['vimeo']}" data-t="{p['t']}">
      <button class="tv-play" type="button" aria-label="Ver o testemunho de {p['nome']}">
        <img src="{A}caras/{p['poster']}" alt="{p['nome']}, {p['quem']}" width="1280" height="720">
        <span class="tv-bt">{PLAY}</span>
        <span class="tv-tag">Ver o testemunho</span>
      </button>
      <figcaption>
        <div class="quem-d"><b>{p['nome']}</b><span>{p['quem']}</span></div>
        <ul class="res-d">{res}</ul>
      </figcaption>
    </figure>

    <div class="prova-hero cit-d">
      <div>
        <span class="st">★★★★★</span>
        <p>“{p['citacao']}”</p>
        <span class="quem">{p['nome']} · {p['quem']}</span>
      </div>
    </div>

    <div class="certs-hero">
      <span class="c"><img src="{A}cert/meta-media-buying.png" alt="Meta Certified Media Buying Professional" loading="lazy"></span>
      <span class="c"><img src="{A}cert/google-search.png" alt="Google Ads Search Certified" loading="lazy"></span>
      <span class="txt">Certificados pela <b>Meta</b> e pela <b>Google</b>.</span>
    </div>
  </div>
</section>

{TICKER}

<section class="banda">
  <div class="wrap">
    <div class="centro estreito">
      <h2>{p['pontos_h2']}</h2>
    </div>
    <div class="dores-grid tres">{pontos}</div>
    <div class="cta">
      {bob()}
      <p class="rgpd">Quinze minutos, com os números do seu negócio. Já não recebe os emails sobre os outros motivos.</p>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="centro estreito">
      <span class="kicker">Testemunhos</span>
      <span class="estrelas">★★★★★</span>
      <h2>Não é só {'o' if p['nome'] != 'Anita Santos Rubin' else 'a'} {primeiro_nome(p['nome'])}. <em>Ouça quem trabalha connosco.</em></h2>
    </div>
    <div class="deps">
      {outros}
    </div>
  </div>
</section>

<section class="last">
  <div class="wrap lastg">
    <figure class="last-fig">
      <picture><source media="(max-width:899px)" srcset="{A}tiago-convite-mobile.png" width="760" height="1390"><img src="{A}tiago-convite.png" alt="Tiago Severino, fundador da Vloom" width="900" height="1043" loading="lazy"></picture>
      <figcaption><b>Tiago Severino</b><span>Fundador da Vloom</span></figcaption>
    </figure>
    <div class="last-txt">
      <h2>Quer ver os números <em>para o seu caso?</em></h2>
      <p class="lede">Quinze minutos. Faço a conta com os números do seu negócio: quanto lhe custaria cada cliente novo. Se não fizer sentido, digo-lhe.</p>
      <ul class="last-lista">
        <li>{CHECK}<span>Uma conversa de <b>15 minutos</b>, sem compromisso.</span></li>
        <li>{CHECK}<span>Sai com a conta de <b>quanto lhe custaria cada cliente</b>.</span></li>
        <li>{CHECK}<span>Certificado pela <b>Meta</b> e pelo <b>Google</b>.</span></li>
      </ul>
      <div class="cta cta-esq">
        {bob("Marcar 15 minutos")}
      </div>
    </div>
  </div>
</section>

{rodape()}
<div class="sticky">{bob("Marcar 15 minutos")}</div>
"""

for pasta, p in PAGINAS.items():
    d = AQUI / pasta; d.mkdir(exist_ok=True)
    (d / "index.html").write_text(pagina(p))

# «parar» (email #5): sem vídeo e sem venda. Só confirma.
d = AQUI / "parar"; d.mkdir(exist_ok=True)
(d / "index.html").write_text(cabeca("Combinado", "Pedido recebido").replace(f'<a class="mini" href="{MARCAR}">Marcar 15 minutos</a>', "") + f"""
<section class="hero parar">
  <div class="wrap">
    <div class="centro estreito">
      <div class="ok-ic">{CHECK}</div>
      <p class="eyebrow">Pedido recebido</p>
      <h1>Combinado. <em>Eu paro aqui.</em></h1>
      <div class="garantia-linha">Não lhe volto a escrever sobre isto. <b>Amigos como dantes.</b></div>
      <p class="lede">Se um dia mudar de ideias, basta responder a qualquer email meu. Leio todos.</p>
      <p class="assina"><b>Tiago Severino</b><span>Fundador da Vloom</span></p>
    </div>
  </div>
</section>
{TICKER}
""" + rodape())
print("ok")
