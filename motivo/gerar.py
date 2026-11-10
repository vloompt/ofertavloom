# Gera as páginas de destino dos links «é este o meu caso» (email #1 da sequência
# 🤝 Compareceu Sem Pedir Proposta, GHL Vloom 8b4d36b2) e do «parar» do email #5.
# Cada trigger link do GHL redireciona para a SUA página. Corre: python3 motivo/gerar.py
import pathlib
AQUI = pathlib.Path(__file__).parent
MARCAR = "https://marketing.vloom.pt/marcar-reuniao/?utm_source=email&utm_medium=email&utm_campaign=vloom-motivos"

HISTORIA_TENTAMOS = """
<p>Não lhe vou dizer que a pessoa da sua equipa é má. Provavelmente não é.</p>
<p>Mas há uma diferença entre publicar conteúdo e ter um sistema montado.</p>
<p>Publicar é fazer anúncios e esperar. Ter um sistema é <b>saber quanto custa cada cliente que entra pela porta</b>.</p>
<p>João Matos, o empresário de Guimarães que hoje recebe +1000 leads por mês, também já tinha tentado. Andava a atirar uns trocos às redes, a ver se alguém respondia.</p>
<p>O que mudou não foi o esforço: foi ter um <b>SISTEMA</b> por trás.</p>
<p>Se já tentou e não resultou, isso não é um argumento contra. É como no amor: raramente se casa com a primeira namorada.</p>
"""

PAGINAS = {
  "e-caro": dict(motivo="É caro", h1='"É caro."<br>É o mais <em>honesto</em> de todos.', corpo="""
<p>Deixo-lhe uma história em vez de um argumento.</p>
<p>O Dr. Bernardo comprou uma clínica em Barcelos. Tinha tudo a favor: boa localização, bons médicos e boas instalações. E as primeiras consultas a cair mês após mês.</p>
<p>Quando falámos, disse-me que o nosso serviço custava muito dinheiro. Tinha razão. Custa.</p>
<p>Avançou na mesma. Poucos meses depois: <b>mais de 100 leads por mês</b> e facturação de seis dígitos atribuída ao sistema.</p>
<blockquote>“Percebi rápido que a Vloom vende um serviço que custa muito dinheiro. Mas não é caro, porque volta em múltiplos.”<cite>Dr. Bernardo, Clínica Avenida Barcelos</cite></blockquote>
<p>Caro e custar dinheiro não é a mesma coisa. <b>Caro é pagar pouco por algo que não resolve NADA.</b></p>
"""),
  "nao-e-a-altura": dict(motivo="Agora não é a melhor altura", h1='"Agora não é a melhor altura."<br><em>Nunca é.</em>', corpo="""
<p>Posso ser direto? É sempre a mesma coisa. A decisão fica à espera de uma condição que nunca chega:</p>
<ul><li>“Quando tiver tempo, faço”;</li><li>“Quando as coisas acalmarem, trato disso”.</li></ul>
<p>É o mesmo que dizer “quando ficar saudável volto ao médico”. A lógica está ao contrário.</p>
<p>Uma perspetiva que talvez ajude: <b>quanto MAIS ocupado está, melhor é a altura</b>. Porque um sistema que só funciona quando tem tempo para o alimentar não presta.</p>
<p>O nosso trabalho é exatamente esse: fazer com que funcione enquanto está ocupado.</p>
"""),
  "ja-tentamos": dict(motivo="Já tentámos e não resultou", h1='"Já tentámos<br>e <em>não resultou</em>."', corpo=HISTORIA_TENTAMOS),
  "alguem-interno": dict(motivo="Temos alguém interno a tratar disso", h1='"Temos alguém interno<br>a <em>tratar disso</em>."', corpo=HISTORIA_TENTAMOS),
}

CSS = open(AQUI / "estilo.css").read() if (AQUI / "estilo.css").exists() else ""

def pagina(titulo, h1, lede, corpo, cta=True):
    bloco_cta = f"""
<section class="fim"><div class="wrap estreito">
  <h2>Quer ver os números para o seu caso?</h2>
  <p>Quinze minutos. Mostro-lhe quanto lhe custaria cada cliente e diz-me se faz sentido.</p>
  <a class="bt" href="{MARCAR}">Marcar 15 minutos</a>
</div></section>""" if cta else ""
    return f"""<!DOCTYPE html>
<html lang="pt-PT">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vloom · {titulo}</title>
<meta name="robots" content="noindex">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="/motivo/estilo.css">
</head>
<body>
<div class="topo"><div class="wrap estreito">
  <img class="lg" src="/10reunioes/assets/logo-branco.svg" alt="Vloom">
  <div class="tick"><svg width="30" height="24" viewBox="0 0 30 24" fill="none"><path d="M2.5 12.5 11 21 27.5 3" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
  <h1>{h1}</h1>
  <p class="lede">{lede}</p>
</div></div>
<section><div class="wrap estreito texto">{corpo}
  <p class="ass">Vou voltar ao trabalho,<br><b>Tiago Severino</b><br><span>Vloom · Head of Marketing</span></p>
</div></section>{bloco_cta}
<footer><div class="wrap legal">
  <span>© 2026 Vloom, Agência de Marketing e Publicidade Digital, Lda.</span>
  <span><a href="https://vloom.pt/politica-de-privacidade/" target="_blank" rel="noopener">Política de Privacidade</a></span>
</div></footer>
</body>
</html>
"""

for pasta, p in PAGINAS.items():
    d = AQUI / pasta; d.mkdir(exist_ok=True)
    lede = f'Escolheu <b>“{p["motivo"]}”</b>. Poupo-lhe os outros três: o email sobre este já seguiu para a sua caixa. Fica aqui também, para não ter de o procurar.'
    (d / "index.html").write_text(pagina(p["motivo"], p["h1"], lede, p["corpo"]))

d = AQUI / "parar"; d.mkdir(exist_ok=True)
(d / "index.html").write_text(pagina("Combinado",
    'Combinado.<br>Eu <em>paro aqui</em>.',
    'Não lhe volto a escrever sobre isto. Amigos como dantes.',
    '<p>Se um dia mudar de ideias, basta responder a qualquer email meu. Eu leio todos.</p>', cta=False))
print("ok")
