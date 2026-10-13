// =====================================================================
// AGENDA DA PIB BARCELOS — fonte única
// Para mudar a agenda, edita SÓ esta lista. Ela alimenta:
//   - o calendário mês a mês (eventos.html)
//   - o selo "Próximo evento" no canto do vídeo (eventos.html)
//   - os 3 cartões "Próximos eventos" (index.html)
// Formato: data "AAAA-MM-DD", titulo. Opcional: tag (ex.: "Comunhão")
// e texto (frase curta para o cartão da página inicial).
// Avisos sem dia certo vão em AGENDA_NOTAS (mes "AAAA-MM").
// Eventos passados saem sozinhos do selo e da página inicial.
// =====================================================================
const AGENDA = [
  { data: "2026-01-10", titulo: "Pequeno-Almoço de Ano Novo" },
  { data: "2026-02-14", titulo: "Encontro de Casais" },
  { data: "2026-02-20", titulo: "Assembleia Geral Ordinária" },
  { data: "2026-02-21", titulo: "Ceia do Senhor" },
  { data: "2026-03-04", titulo: "Evangelismo" },
  { data: "2026-03-21", titulo: "Pequeno-Almoço dos Homens" },
  { data: "2026-03-21", titulo: "Encontro das Senhoras" },
  { data: "2026-03-22", titulo: "Homenagem aos Pais" },
  { data: "2026-04-03", titulo: "Evangelismo" },
  { data: "2026-04-05", titulo: "Pequeno-Almoço na Igreja" },
  { data: "2026-04-05", titulo: "Ceia do Senhor" },
  { data: "2026-04-25", titulo: "Evangelismo" },
  { data: "2026-05-01", titulo: "Limpeza de Primavera" },
  { data: "2026-05-10", titulo: "Homenagem às Mães" },
  { data: "2026-06-04", titulo: "Evangelismo" },
  { data: "2026-06-07", titulo: "Reunião dos Portugueses" },
  { data: "2026-07-05", titulo: "Início do Palavra Fest" },
  { data: "2026-07-19", titulo: "Conclusão do Palavra Fest" },
  { data: "2026-07-25", titulo: "Churrasco da Igreja" },
  { data: "2026-08-08", titulo: "Encontro de Casais" },
  { data: "2026-08-15", titulo: "Piquenique da Igreja" },
  { data: "2026-08-23", titulo: "Ceia do Senhor" },
  { data: "2026-09-13", titulo: "Dia Mundial da EBD", tag: "Escola Bíblica", texto: "Celebramos juntos o Dia Mundial da Escola Bíblica Dominical." },
  { data: "2026-09-26", titulo: "Pequeno-Almoço dos Homens", tag: "Comunhão", texto: "Manhã de mesa posta e conversa — e, no mesmo dia, o Encontro das Senhoras." },
  { data: "2026-09-26", titulo: "Encontro das Senhoras" },
  { data: "2026-09-27", titulo: "Reunião Amarela", tag: "Comunidade", texto: "Um domingo dedicado ao cuidado e à esperança, com a família toda reunida." },
  { data: "2026-10-05", titulo: "Evangelismo" },
  { data: "2026-10-11", titulo: "Homenagem às Crianças" },
  { data: "2026-10-18", titulo: "Ceia do Senhor" },
  { data: "2026-10-24", titulo: "Encontro de Casais" },
  { data: "2026-10-31", titulo: "Primeiro Ensaio do Coro de Natal" },
  { data: "2026-11-02", titulo: "Evangelismo Pessoal" },
  { data: "2026-11-08", titulo: "Aniversário de 14 Anos da PIBB · Pequeno-Almoço na Igreja" },
  { data: "2026-11-21", titulo: "Assembleia Geral Ordinária" },
  { data: "2026-11-28", titulo: "Jantar de Ação de Graças" },
  { data: "2026-11-29", titulo: "Reunião Missionária" },
  { data: "2026-12-01", titulo: "Decoração da Igreja" },
  { data: "2026-12-07", titulo: "Vigília de Oração" },
  { data: "2026-12-20", titulo: "Programa de Natal" },
  { data: "2026-12-27", titulo: "Ceia do Senhor" },
];

const AGENDA_NOTAS = [
  { mes: "2026-06", texto: "Visita do Pastor Michael · datas a anunciar" },
];

(function () {
  const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const MES_CURTO = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const DIAS = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const agora = new Date();
  const hoje = agora.getFullYear() + '-' + pad(agora.getMonth() + 1) + '-' + pad(agora.getDate());
  const parte = (iso) => { const [y, m, d] = iso.split('-').map(Number); return { y, m, d, dt: new Date(y, m - 1, d) }; };
  const curta = (iso) => { const p = parte(iso); return p.d + ' ' + MES_CURTO[p.m - 1]; };

  const eventos = AGENDA.slice().sort((a, b) => a.data.localeCompare(b.data));
  const proximos = eventos.filter((e) => e.data >= hoje);

  // ---- selo "Próximo evento" (eventos.html) ----
  const selo = document.getElementById('proxEvento');
  if (selo) {
    if (!proximos.length) selo.remove();
    else {
      const e = proximos[0];
      selo.querySelector('b').textContent = e.data === hoje ? 'Hoje' : curta(e.data);
      selo.querySelector('span').textContent = e.data === hoje ? e.titulo : 'Próximo evento';
      selo.title = e.titulo;
    }
  }

  // ---- cartões "Próximos eventos" (index.html) ----
  const cards = document.getElementById('evGrid');
  if (cards) {
    const tres = proximos.slice(0, 3);
    if (!tres.length) {
      cards.outerHTML = '<p class="reveal" style="color:var(--muted)">A agenda do próximo ano será publicada em breve.</p>';
    } else {
      cards.innerHTML = tres.map((e, i) => {
        const p = parte(e.data);
        const etiqueta = e.data === hoje ? 'Hoje' : curta(e.data);
        const sub = e.tag || DIAS[p.dt.getDay()];
        return '<article class="ev-card reveal ' + (i ? 'd' + i : '') + '">' +
          '<div class="ev-info"><div class="tag">' + esc(etiqueta + ' · ' + sub) + '</div>' +
          '<h3>' + esc(e.titulo) + '</h3>' + (e.texto ? '<p>' + esc(e.texto) + '</p>' : '') + '</div></article>';
      }).join('');
    }
  }

  // ---- calendário mês a mês (eventos.html) ----
  const grelha = document.getElementById('agendaGrid');
  if (grelha) {
    const meses = {};
    eventos.forEach((e) => { const k = e.data.slice(0, 7); (meses[k] = meses[k] || { ev: [], notas: [] }).ev.push(e); });
    AGENDA_NOTAS.forEach((n) => { (meses[n.mes] = meses[n.mes] || { ev: [], notas: [] }).notas.push(n.texto); });
    grelha.innerHTML = Object.keys(meses).sort().map((k, i) => {
      const [y, m] = k.split('-').map(Number);
      const linhas = meses[k].ev.map((e) =>
        '<div class="month-row' + (e.data < hoje ? ' past' : '') + '"><b>' + pad(parte(e.data).d) + '</b><span>' + esc(e.titulo) + '</span></div>').join('') +
        meses[k].notas.map((t) => '<div class="month-row note">' + esc(t) + '</div>').join('');
      return '<div class="month-card reveal ' + (i % 3 ? 'd' + (i % 3) : '') + '"><h3>' + MESES[m - 1] + ' <em>' + y + '</em></h3>' + linhas + '</div>';
    }).join('');
  }
})();
