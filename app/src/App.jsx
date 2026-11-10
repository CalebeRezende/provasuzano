import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import * as api from './backend.js';
import conteudo from './data/conteudo.json';
import { disciplinas, todosItens } from './data/videoaulas.js';
import { Icon, GoogleLogo, Ring, Bar, LockedNotice, LockedOverlay, Empty, PromoCard, PromoFloat } from './ui.jsx';
import { estudoPara } from './data/estudo.js';

const { bank, groups, exams, sources } = conteudo;
const LETTERS = 'ABCDE';
const NATURAL = [0, 1, 2, 3, 4];
const SIM_SIZE = { 'Português': 8, 'Matemática': 8, 'Legislação': 8, 'Específicos': 10 };
const SIM_TOTAL = 34;
// Amostra gratuita de questões: os mesmos temas liberados nas videoaulas.
const FREE_Q = (q) => (q.group === 'Português' && q.topic === 'Interpretação') || (q.group === 'Legislação' && q.topic === 'Constituição');
const groupColor = { 'Português': 'violet', 'Matemática': 'blue', 'Legislação': 'amber', 'Específicos': 'green' };

const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const firstName = (n) => (n || '').trim().split(/\s+/)[0] || 'estudante';
const pageFromHash = () => (location.hash.replace('#/', '') || 'inicio');

export default function App() {
  const [session, setSession] = useState({ loading: true, user: null, profile: null });
  useEffect(() => api.watchSession(({ user, profile }) => setSession({ loading: false, user, profile })), []);

  if (api.mode === 'setup') return <SetupScreen />;
  if (session.loading) return <Splash />;
  if (!session.user) return <LoginScreen />;
  return <Shell user={session.user} profile={session.profile || { status: 'pending' }} />;
}

/* ================================================================== */
/* Telas de entrada                                                    */
/* ================================================================== */
function Splash() {
  return <div className="splash"><div className="spinner" /><p>Carregando…</p></div>;
}

function LoginScreen() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const go = async () => {
    setBusy(true); setError('');
    try { await api.login(); } catch (e) { setError(e?.code === 'auth/unauthorized-domain' ? 'Este domínio ainda não foi autorizado no Firebase (Authentication > Configurações > Domínios autorizados).' : 'Não foi possível entrar. Tente novamente.'); }
    setBusy(false);
  };
  return (
    <div className="login">
      <div className="login-bg" aria-hidden="true"><span /><span /><span /></div>
      <main className="login-card">
        <div className="brand-mark big"><Icon name="book" size={26} /></div>
        <p className="eyebrow">Concurso público · Edital 02/2026 · Nosso Rumo</p>
        <h1>Estuda Suzano</h1>
        <p className="lead">Professor de Educação Básica I · Cargo 314. Videoaulas do edital, {bank.length} questões comentadas e simulados — com seu progresso salvo na nuvem.</p>
        <ul className="login-features">
          <li><Icon name="play" size={16} /> {todosItens.length} temas do edital com videoaulas selecionadas</li>
          <li><Icon name="list" size={16} /> Banco de questões com gabarito comentado</li>
          <li><Icon name="timer" size={16} /> Simulados de {SIM_TOTAL} questões no formato da prova</li>
          <li><Icon name="cloud" size={16} /> Progresso salvo na sua conta, em qualquer aparelho</li>
        </ul>
        <button className="btn google" onClick={go} disabled={busy}>
          <GoogleLogo size={20} /> {busy ? 'Abrindo o Google…' : 'Entrar com Google'}
        </button>
        {error && <p className="form-error">{error}</p>}
        {api.mode === 'demo' && (
          <div className="demo-box">
            <strong>Modo demonstração (localhost)</strong>
            <p>O Firebase ainda não foi configurado. Entre como um perfil de teste:</p>
            <div className="row">
              <button className="btn ghost sm" onClick={() => api.demoLoginAs('admin')}>Admin</button>
              <button className="btn ghost sm" onClick={() => api.demoLoginAs('joao')}>Aluno liberado</button>
              <button className="btn ghost sm" onClick={() => api.demoLoginAs('maria')}>Aluno pendente</button>
            </div>
          </div>
        )}
        <p className="fine">Ao entrar, seu cadastro fica pendente até o administrador liberar o acesso completo. Antes disso, você pode ver uma amostra do conteúdo.</p>
        <p className="fine">Quer o acesso completo? <a href={api.compraUrl} target="_blank" rel="noreferrer">Faça a compra aqui</a>.</p>
      </main>
    </div>
  );
}

function SetupScreen() {
  return (
    <div className="login">
      <div className="login-bg" aria-hidden="true"><span /><span /><span /></div>
      <main className="login-card">
        <div className="brand-mark big"><Icon name="shield" size={26} /></div>
        <h1>Quase lá</h1>
        <p className="lead">O login com Google ainda não foi configurado neste site.</p>
        <p>Se você é o administrador, preencha o arquivo <code>firebase-config.js</code> no repositório seguindo o guia <code>CONFIGURAR-LOGIN.md</code>. Depois de salvar, aguarde um ou dois minutos e recarregue esta página.</p>
      </main>
    </div>
  );
}

/* ================================================================== */
/* Estrutura principal                                                 */
/* ================================================================== */
function useProgress(uid) {
  const [progress, setProgress] = useState(null);
  const [saveState, setSaveState] = useState('idle');
  const timer = useRef();
  const latest = useRef();

  useEffect(() => {
    let alive = true;
    api.loadProgress(uid).then((p) => alive && setProgress(p)).catch(() => alive && setProgress(api.emptyProgress()));
    return () => { alive = false; };
  }, [uid]);

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (!latest.current) return;
    const data = latest.current; latest.current = null;
    setSaveState('saving');
    try { await api.saveProgress(uid, data); setSaveState(latest.current ? 'saving' : 'saved'); }
    catch (e) { console.error(e); setSaveState('error'); }
  }, [uid]);

  const update = useCallback((fn) => {
    setProgress((prev) => {
      const next = fn(structuredClone(prev));
      latest.current = next;
      clearTimeout(timer.current);
      setSaveState('pending');
      timer.current = setTimeout(flush, 900);
      return next;
    });
  }, [flush]);

  useEffect(() => {
    const onHide = () => { if (latest.current) flush(); };
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onHide);
    return () => { window.removeEventListener('pagehide', onHide); document.removeEventListener('visibilitychange', onHide); };
  }, [flush]);

  return [progress, update, saveState];
}

function Shell({ user, profile }) {
  const [page, setPage] = useState(pageFromHash);
  const [progress, update, saveState] = useProgress(user.uid);
  const full = profile.isAdmin || profile.status === 'approved';
  const status = profile.isAdmin ? 'approved' : profile.status;

  useEffect(() => {
    const on = () => { setPage(pageFromHash()); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const go = (p) => { location.hash = '#/' + p; };

  const tabs = [
    ['inicio', 'Início', 'home'],
    ['videoaulas', 'Videoaulas', 'play'],
    ['questoes', 'Questões', 'list'],
    ['simulado', 'Simulado', 'timer'],
    ['provas', 'Provas e fontes', 'book'],
    ...(profile.isAdmin ? [['admin', 'Admin', 'shield']] : []),
  ];
  const current = tabs.some((t) => t[0] === page) ? page : 'inicio';

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#/inicio">
            <span className="brand-mark"><Icon name="book" size={18} /></span>
            <span><strong>Estuda Suzano</strong><small>PEB I · Cargo 314</small></span>
          </a>
          <nav className="tabs" aria-label="Seções">
            {tabs.map(([id, label, icon]) => (
              <a key={id} href={'#/' + id} className={'tab' + (current === id ? ' active' : '')} aria-current={current === id ? 'page' : undefined}>
                <Icon name={icon} size={17} /><span>{label}</span>
              </a>
            ))}
          </nav>
          <UserMenu user={user} profile={profile} saveState={saveState} />
        </div>
      </header>
      {!full && (
        <div className="access-banner">
          <Icon name="lock" size={18} />
          <span><b>Acesso de amostra.</b> Para continuar, converse com o administrador para liberar o acesso completo.{api.adminContato && <> Contato: <b>{api.adminContato}</b></>}</span>
        </div>
      )}
      <main className="page">
        {!progress ? <Splash /> : (
          <>
            {current === 'inicio' && <Home user={user} profile={profile} progress={progress} full={full} go={go} />}
            {current === 'videoaulas' && <Videoaulas progress={progress} update={update} full={full} status={status} />}
            {current === 'questoes' && <Questoes progress={progress} update={update} full={full} status={status} />}
            {current === 'simulado' && (full ? <Simulado progress={progress} update={update} /> : <SimuladoLocked status={status} />)}
            {current === 'provas' && <Provas full={full} status={status} />}
            {current === 'admin' && profile.isAdmin && <Admin me={user} />}
          </>
        )}
      </main>
      {!full && status !== 'blocked' && current !== 'inicio' && <PromoFloat />}
      <footer className="footer">
        Estuda Suzano · material de estudo independente, sem vínculo com a Prefeitura de Suzano ou o Instituto Nosso Rumo. Confira sempre o edital oficial.
      </footer>
    </div>
  );
}

function UserMenu({ user, profile, saveState }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);
  const label = { idle: 'Sincronizado', pending: 'Salvando…', saving: 'Salvando…', saved: 'Progresso salvo', error: 'Erro ao salvar' }[saveState];
  return (
    <div className="user-menu" ref={ref}>
      <span className={'save-dot s-' + saveState} title={label} aria-label={label} />
      <button className="avatar-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Conta">
        {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : <span className="avatar-fallback">{firstName(user.displayName)[0]}</span>}
      </button>
      {open && (
        <div className="menu-pop">
          <strong>{user.displayName}</strong>
          <small>{user.email}</small>
          <span className={'pill status-' + (profile.isAdmin ? 'admin' : profile.status)}>
            {profile.isAdmin ? 'Administrador' : { approved: 'Acesso completo', pending: 'Aguardando liberação', blocked: 'Acesso suspenso' }[profile.status] || 'Aguardando liberação'}
          </span>
          <small className="muted">{label}</small>
          <button className="btn ghost sm" onClick={() => api.logout()}><Icon name="logout" size={16} /> Sair</button>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/* Início                                                              */
/* ================================================================== */
function useStats(progress) {
  return useMemo(() => {
    const done = todosItens.filter((i) => progress.checks?.[i.id]).length;
    const answered = bank.filter((q) => progress.answers?.[q.id] !== undefined);
    const hits = answered.filter((q) => progress.answers[q.id] === q.answer).length;
    const lastSim = (progress.simHistory || []).slice(-1)[0];
    const best = (progress.simHistory || []).reduce((m, s) => Math.max(m, s.hits), 0);
    return { done, total: todosItens.length, answered: answered.length, hits, lastSim, best };
  }, [progress]);
}

function Home({ user, profile, progress, full, go }) {
  const s = useStats(progress);
  const next = todosItens.find((i) => !progress.checks?.[i.id] && (full || i.free));
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  return (
    <div className="stack">
      <section className="hero">
        <div>
          <p className="eyebrow light">Edital 02/2026 · Professor de Educação Básica I</p>
          <h1>{hello}, {firstName(user.displayName)}!</h1>
          <p>Siga as pendências do edital, assista às aulas e treine com questões comentadas. Tudo fica salvo na sua conta.</p>
          <div className="row">
            <button className="btn light" onClick={() => go('videoaulas')}><Icon name="play" size={16} /> {next ? 'Continuar estudando' : 'Ver videoaulas'}</button>
            <button className="btn outline-light" onClick={() => go('questoes')}>Treinar questões</button>
          </div>
        </div>
        <div className="hero-rings">
          <Ring value={s.done} max={s.total} label="do edital" tone="light" size={120} />
        </div>
      </section>

      {!full && (profile.status === 'blocked' ? <LockedNotice status={profile.status} /> : <PromoCard />)}

      <section className="stat-grid">
        <div className="stat"><span className="stat-ico violet"><Icon name="play" /></span><div><strong>{s.done}<small> / {s.total}</small></strong><span>Temas concluídos</span></div></div>
        <div className="stat"><span className="stat-ico blue"><Icon name="list" /></span><div><strong>{s.answered}<small> / {bank.length}</small></strong><span>Questões respondidas</span></div></div>
        <div className="stat"><span className="stat-ico green"><Icon name="check" /></span><div><strong>{s.answered ? Math.round((100 * s.hits) / s.answered) + '%' : '—'}</strong><span>Aproveitamento</span></div></div>
        <div className="stat"><span className="stat-ico amber"><Icon name="trophy" /></span><div><strong>{s.best ? s.best + '/' + SIM_TOTAL : '—'}</strong><span>Melhor simulado</span></div></div>
      </section>

      <div className="two-col">
        <section className="card">
          <h2 className="card-title">Progresso por disciplina</h2>
          <div className="disc-list">
            {disciplinas.map((d) => {
              const done = d.itens.filter((i) => progress.checks?.[i.id]).length;
              return (
                <div key={d.id} className="disc-row">
                  <div className="disc-head"><span className={'dot ' + d.cor} /> <span>{d.nome}</span><small>{done}/{d.itens.length}</small></div>
                  <Bar value={done} max={d.itens.length} tone={d.cor} />
                </div>
              );
            })}
          </div>
        </section>
        <section className="card next-card">
          <h2 className="card-title">Próxima pendência</h2>
          {next ? (
            <>
              <span className={'chip ' + next.cor}>{next.disciplinaNome}</span>
              <h3>{next.titulo}</h3>
              <p className="muted">{next.edital}</p>
              <button className="btn primary" onClick={() => { sessionStorage.setItem('open-item', next.id); go('videoaulas'); }}>
                Abrir aula <Icon name="arrow" size={16} />
              </button>
            </>
          ) : full ? (
            <Empty>Você concluiu todos os temas do edital. Hora de fazer simulados! 🎉</Empty>
          ) : (
            <Empty>Você concluiu os temas de amostra. Converse com o administrador para liberar o restante.</Empty>
          )}
        </section>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Videoaulas                                                          */
/* ================================================================== */
function Videoaulas({ progress, update, full, status }) {
  const [disc, setDisc] = useState('');
  const [openId, setOpenId] = useState(() => { const v = sessionStorage.getItem('open-item'); sessionStorage.removeItem('open-item'); return v; });
  const [filter, setFilter] = useState(() => (openId ? 'todas' : 'pendentes'));
  const checks = progress.checks || {};
  const done = todosItens.filter((i) => checks[i.id]).length;

  const toggle = (id) => update((p) => { p.checks = p.checks || {}; if (p.checks[id]) delete p.checks[id]; else p.checks[id] = Date.now(); return p; });
  const markWatched = (id, vid) => update((p) => { p.watched = p.watched || {}; p.watched[id] = vid; return p; });

  const visible = disciplinas.filter((d) => !disc || d.id === disc);
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Videoaulas do edital</h1>
          <p className="muted">Cada tema do conteúdo programático virou uma pendência. Assista, revise e marque como estudado.</p>
        </div>
        <div className="head-progress">
          <Ring value={done} max={todosItens.length} size={76} />
          <div><strong>{done} de {todosItens.length}</strong><small>temas concluídos</small></div>
        </div>
      </div>

      {!full && <LockedNotice status={status} compact />}

      <div className="toolbar">
        <div className="chips" role="tablist">
          <button className={'chip-btn' + (!disc ? ' on' : '')} onClick={() => setDisc('')}>Todas</button>
          {disciplinas.map((d) => (
            <button key={d.id} className={'chip-btn ' + d.cor + (disc === d.id ? ' on' : '')} onClick={() => setDisc(d.id)}>{d.nome}</button>
          ))}
        </div>
        <div className="seg">
          {[['pendentes', 'Pendentes'], ['concluidas', 'Concluídas'], ['todas', 'Todas']].map(([k, l]) => (
            <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
      </div>

      {visible.map((d) => {
        const items = d.itens.filter((i) => filter === 'todas' || (filter === 'pendentes' ? !checks[i.id] : checks[i.id]));
        const dDone = d.itens.filter((i) => checks[i.id]).length;
        return (
          <section key={d.id} className="disc-section">
            <div className="disc-title">
              <span className={'dot lg ' + d.cor} />
              <h2>{d.nome}</h2>
              <small>{dDone}/{d.itens.length}</small>
              <div className="disc-bar"><Bar value={dDone} max={d.itens.length} tone={d.cor} /></div>
            </div>
            {items.length === 0 ? <Empty>{filter === 'pendentes' ? 'Nenhuma pendência aqui. Muito bem!' : 'Nada por aqui ainda.'}</Empty> : (
              <div className="lesson-list">
                {items.map((item) => (
                  <Lesson key={item.id} item={{ ...item, cor: d.cor }} done={!!checks[item.id]} locked={!full && !item.free}
                    open={openId === item.id} setOpen={(o) => setOpenId(o ? item.id : null)}
                    watched={progress.watched?.[item.id]} onToggle={() => toggle(item.id)} onWatch={(vid) => markWatched(item.id, vid)} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function Lesson({ item, done, locked, open, setOpen, watched, onToggle, onWatch }) {
  const [playing, setPlaying] = useState(null);
  const ref = useRef();
  useEffect(() => { if (open && ref.current) ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [open]);
  const search = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(item.busca);
  return (
    <article ref={ref} className={'lesson' + (done ? ' done' : '') + (locked ? ' locked' : '') + (open ? ' open' : '')}>
      <div className="lesson-head">
        <button className={'check-btn' + (done ? ' on' : '')} onClick={onToggle} disabled={locked}
          aria-pressed={done} aria-label={done ? 'Desmarcar ' + item.titulo : 'Marcar ' + item.titulo + ' como estudado'}>
          {locked ? <Icon name="lock" size={15} /> : <Icon name="check" size={16} stroke={3} />}
        </button>
        <button className="lesson-toggle" onClick={() => !locked && setOpen(!open)} aria-expanded={open} disabled={locked}>
          <span className="lesson-title">{item.titulo}{item.free && <span className="free-tag">Amostra grátis</span>}</span>
          <span className="lesson-sub">{locked ? 'Conteúdo bloqueado · converse com o administrador para liberar' : `${item.videos.length} ${item.videos.length === 1 ? 'vídeo' : 'vídeos'}${watched ? ' · assistido' : ''}`}</span>
        </button>
        {!locked && <span className={'chev' + (open ? ' up' : '')} aria-hidden="true">›</span>}
      </div>
      {open && !locked && (
        <div className="lesson-body">
          <p className="edital"><b>No edital:</b> {item.edital}</p>
          <div className="video-grid">
            {item.videos.map((vd) => (
              <div key={vd.id} className="video">
                {playing === vd.id ? (
                  <iframe src={`https://www.youtube-nocookie.com/embed/${vd.id}?autoplay=1&rel=0`} title={vd.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                ) : (
                  <button className="thumb" onClick={() => { setPlaying(vd.id); onWatch(vd.id); }} aria-label={'Assistir: ' + vd.title}>
                    <img src={`https://i.ytimg.com/vi/${vd.id}/hqdefault.jpg`} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                    <span className="play"><Icon name="play" size={22} /></span>
                  </button>
                )}
                <div className="video-meta">
                  <span>{vd.title}</span>
                  <a href={'https://www.youtube.com/watch?v=' + vd.id} target="_blank" rel="noreferrer" title="Abrir no YouTube"><Icon name="ext" size={15} /></a>
                </div>
              </div>
            ))}
          </div>
          <div className="row between">
            <a className="btn ghost sm" href={search} target="_blank" rel="noreferrer"><Icon name="search" size={15} /> Buscar mais vídeos sobre o tema</a>
            <button className={'btn sm ' + (done ? 'ghost' : 'primary')} onClick={onToggle}>
              <Icon name={done ? 'x' : 'check'} size={15} /> {done ? 'Marcar como pendente' : 'Marcar como estudado'}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

/* ================================================================== */
/* Questões                                                            */
/* ================================================================== */
function QuestionCard({ q, selected, reveal, order = NATURAL, onPick, onSubmit, submitLabel }) {
  const [choice, setChoice] = useState(selected);
  useEffect(() => setChoice(selected), [q.id, selected]);
  const right = selected === q.answer;
  return (
    <form className="card question" onSubmit={(e) => { e.preventDefault(); if (choice !== undefined) onSubmit?.(choice); }}>
      <div className="q-meta">
        <span className={'chip ' + groupColor[q.group]}>{q.group}</span>
        <span className="chip plain">{q.topic}</span>
        {q.advanced && <span className="chip plain hot">Avançada</span>}
        <span className="muted">#{q.id}</span>
      </div>
      <fieldset>
        <legend>{q.prompt}</legend>
        {order.map((i, pos) => {
          const state = reveal ? (i === q.answer ? ' right' : i === selected ? ' wrong' : '') : '';
          return (
            <label key={i} className={'option' + (choice === i ? ' chosen' : '') + state}>
              <input type="radio" name={'q' + q.id} value={i} checked={choice === i} disabled={reveal}
                onChange={() => { setChoice(i); onPick?.(i); }} />
              <span className="opt-letter">{LETTERS[pos]}</span>
              <span>{q.options[i]}</span>
            </label>
          );
        })}
      </fieldset>
      {reveal ? (
        <>
          <div className={'feedback' + (right ? ' ok' : ' err')} role="status">
            <strong>{right ? '✓ Correto!' : `Gabarito: ${LETTERS[order.indexOf(q.answer)]}`}</strong>
            <p>{q.comment}</p>
          </div>
          {!right && <StudyTip q={q} />}
        </>
      ) : onSubmit && (
        <button className="btn primary" type="submit" disabled={choice === undefined}>{submitLabel}</button>
      )}
    </form>
  );
}

function Pager({ index, total, onGo }) {
  return (
    <div className="pager">
      <button className="btn ghost sm" disabled={index === 0} onClick={() => onGo(index - 1)}><Icon name="back" size={15} /> Anterior</button>
      <label className="muted">
        <select value={index} onChange={(e) => onGo(+e.target.value)} aria-label="Ir para a questão">
          {Array.from({ length: total }, (_, i) => <option key={i} value={i}>{i + 1}</option>)}
        </select> de {total}
      </label>
      <button className="btn ghost sm" disabled={index >= total - 1} onClick={() => onGo(index + 1)}>Próxima <Icon name="arrow" size={15} /></button>
    </div>
  );
}

function Questoes({ progress, update, full, status }) {
  const [group, setGroup] = useState('');
  const [level, setLevel] = useState('');
  const [show, setShow] = useState('');
  const [index, setIndex] = useState(0);
  const answers = progress.answers || {};
  const base = full ? bank : bank.filter(FREE_Q);
  const pool = base.filter((q) =>
    (!group || q.group === group) && (!level || q.advanced) &&
    (!show || (show === 'pendentes' ? answers[q.id] === undefined : answers[q.id] !== undefined && answers[q.id] !== q.answer)));
  const i = Math.min(index, Math.max(0, pool.length - 1));
  const q = pool[i];
  const answeredN = base.filter((x) => answers[x.id] !== undefined).length;
  const hits = base.filter((x) => answers[x.id] === x.answer).length;

  const reset = (fn) => (e) => { fn(e.target.value); setIndex(0); };
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Banco de questões</h1>
          <p className="muted">{full ? `${bank.length} questões com gabarito comentado.` : `Amostra: ${base.length} de ${bank.length} questões.`} Escolha uma alternativa e veja a explicação.</p>
        </div>
        <div className="head-progress">
          <Ring value={hits} max={answeredN || 1} size={76} tone="green" />
          <div><strong>{answeredN} respondidas</strong><small>{hits} acertos</small></div>
        </div>
      </div>
      {!full && <LockedNotice status={status} compact />}
      <div className="toolbar">
        <div className="filters">
          <label>Disciplina<select value={group} onChange={reset(setGroup)}><option value="">Todas</option>{groups.map((g) => <option key={g}>{g}</option>)}</select></label>
          <label>Nível<select value={level} onChange={reset(setLevel)}><option value="">Todos</option><option value="advanced">Avançadas</option></select></label>
          <label>Mostrar<select value={show} onChange={reset(setShow)}><option value="">Todas</option><option value="pendentes">Pendentes</option><option value="erros">Erros</option></select></label>
        </div>
      </div>
      {q ? (
        <>
          <QuestionCard q={q} selected={answers[q.id]} reveal={answers[q.id] !== undefined} submitLabel="Corrigir resposta"
            onSubmit={(c) => update((p) => { p.answers = p.answers || {}; p.answers[q.id] = c; return p; })} />
          <Pager index={i} total={pool.length} onGo={setIndex} />
          {answers[q.id] !== undefined && (
            <div className="row center">
              <button className="btn ghost sm" onClick={() => update((p) => { delete p.answers[q.id]; return p; })}>Refazer esta questão</button>
            </div>
          )}
        </>
      ) : <Empty>Nenhuma questão corresponde a esses filtros.</Empty>}
    </div>
  );
}

/* ================================================================== */
/* Simulado                                                            */
/* ================================================================== */
function SimuladoLocked({ status }) {
  return (
    <div className="stack">
      <div className="page-head"><div><h1>Simulado</h1><p className="muted">{SIM_TOTAL} questões no formato da prova, com correção comentada.</p></div></div>
      <LockedOverlay status={status}>
        <section className="card sim-start">
          <h2>Simulado de {SIM_TOTAL} questões</h2>
          <p>8 de Português, 8 de Matemática, 8 de Legislação e 10 de Conhecimentos Específicos.</p>
          <button className="btn primary">Iniciar simulado</button>
        </section>
      </LockedOverlay>
    </div>
  );
}

function Simulado({ progress, update }) {
  const sim = progress.sim;
  const [lvl, setLvl] = useState('');
  const byId = (id) => bank[id - 1];

  const start = () => update((p) => {
    const pool = lvl === 'advanced' ? bank.filter((q) => q.advanced) : bank;
    const seen = new Set(p.lastSimIds || []);
    const ids = shuffle(groups.flatMap((g) => {
      const c = shuffle(pool.filter((q) => q.group === g));
      return [...c.filter((q) => !seen.has(q.id)), ...c.filter((q) => seen.has(q.id))].slice(0, SIM_SIZE[g]).map((q) => q.id);
    }));
    p.lastSimIds = ids;
    p.sim = { ids, orders: Object.fromEntries(ids.map((id) => [id, shuffle(NATURAL)])), picks: {}, at: 0, done: false, startedAt: Date.now() };
    return p;
  });

  if (!sim) {
    const hist = progress.simHistory || [];
    return (
      <div className="stack">
        <div className="page-head"><div><h1>Simulado</h1><p className="muted">A ordem das questões e das alternativas muda a cada simulado, priorizando questões que você ainda não viu.</p></div></div>
        <section className="card sim-start">
          <div className="sim-composition">
            {groups.map((g) => <div key={g} className={'comp ' + groupColor[g]}><strong>{SIM_SIZE[g]}</strong><span>{g}</span></div>)}
          </div>
          <div className="row">
            <label className="filters"><span>Nível</span><select value={lvl} onChange={(e) => setLvl(e.target.value)}><option value="">Todos os níveis</option><option value="advanced">Só avançadas</option></select></label>
            <button className="btn primary" onClick={start}><Icon name="timer" size={16} /> Iniciar simulado</button>
          </div>
        </section>
        {hist.length > 0 && (
          <section className="card">
            <h2 className="card-title">Histórico</h2>
            <div className="history">
              {hist.slice(-10).reverse().map((h, k) => (
                <div key={k} className="hist-row"><span>{new Date(h.at).toLocaleDateString('pt-BR')}</span><Bar value={h.hits} max={h.total} tone="green" /><strong>{h.hits}/{h.total}</strong></div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  const items = sim.ids.map(byId);
  if (sim.done) {
    const hits = items.filter((q) => sim.picks[q.id] === q.answer).length;
    return (
      <div className="stack">
        <section className="hero result">
          <div>
            <p className="eyebrow light">Resultado do simulado</p>
            <h1>{hits} de {items.length} acertos</h1>
            <p>{Object.keys(sim.picks).length} respondidas · questões em branco valem zero.</p>
            <button className="btn light" onClick={() => update((p) => { p.sim = null; return p; })}>Montar outro simulado</button>
          </div>
          <Ring value={hits} max={items.length} tone="light" size={120} />
        </section>
        <StudyPlan questions={items.filter((q) => sim.picks[q.id] !== q.answer)} />
        <section className="stat-grid">
          {groups.map((g) => {
            const gi = items.filter((q) => q.group === g);
            const gh = gi.filter((q) => sim.picks[q.id] === q.answer).length;
            return <div key={g} className="stat"><span className={'stat-ico ' + groupColor[g]}><Icon name="flag" /></span><div><strong>{gh}<small> / {gi.length}</small></strong><span>{g}</span></div></div>;
          })}
        </section>
        {items.map((q, k) => {
          const order = sim.orders?.[q.id] || NATURAL;
          const pick = sim.picks[q.id];
          return (
            <details key={q.id} className={'card review ' + (pick === q.answer ? 'ok' : pick === undefined ? 'blank' : 'err')}>
              <summary><span className="rv-n">{k + 1}</span> {q.topic} <em>{pick === q.answer ? 'Correta' : pick === undefined ? 'Em branco' : 'Rever'}</em></summary>
              <p>{q.prompt}</p>
              <p><b>{LETTERS[order.indexOf(q.answer)]}. {q.options[q.answer]}</b></p>
              <p className="muted">{q.comment}</p>
              {pick !== q.answer && <StudyTip q={q} />}
            </details>
          );
        })}
      </div>
    );
  }

  const q = byId(sim.ids[sim.at]);
  const nAns = Object.keys(sim.picks).length;
  const finish = () => {
    const blank = items.length - nAns;
    if (blank && !confirm(`Há ${blank} questões em branco. Finalizar agora?`)) return;
    update((p) => {
      const hits = p.sim.ids.filter((id) => p.sim.picks[id] === byId(id).answer).length;
      p.sim.done = true;
      p.simHistory = [...(p.simHistory || []), { at: Date.now(), hits, total: p.sim.ids.length }].slice(-30);
      return p;
    });
  };
  const goTo = (n) => update((p) => { p.sim.at = n; return p; });
  return (
    <div className="stack">
      <div className="page-head">
        <div><h1>Simulado em andamento</h1><p className="muted">{nAns} de {items.length} respondidas · cada clique é salvo.</p></div>
        <button className="btn primary" onClick={finish}>Finalizar e corrigir</button>
      </div>
      <div className="sim-map">
        {sim.ids.map((id, k) => (
          <button key={id} className={(k === sim.at ? 'cur ' : '') + (sim.picks[id] !== undefined ? 'ans' : '')} onClick={() => goTo(k)} aria-label={'Questão ' + (k + 1)}>{k + 1}</button>
        ))}
      </div>
      <QuestionCard q={q} selected={sim.picks[q.id]} reveal={false} order={sim.orders?.[q.id]}
        onPick={(c) => update((p) => { p.sim.picks[q.id] = c; return p; })}
        onSubmit={() => sim.at < items.length - 1 && goTo(sim.at + 1)} submitLabel={sim.at < items.length - 1 ? 'Salvar e avançar' : 'Resposta salva'} />
      <Pager index={sim.at} total={items.length} onGo={goTo} />
    </div>
  );
}

/* ================================================================== */
/* Provas e fontes                                                     */
/* ================================================================== */
function Provas({ full, status }) {
  const examList = (
    <section className="card">
      <h2 className="card-title">Provas anteriores · Instituto Nosso Rumo</h2>
      <ul className="links">
        {exams.map((x) => <li key={x.url}><a href={x.url} target="_blank" rel="noreferrer">{x.title} <Icon name="ext" size={14} /></a><small>{x.detail}</small></li>)}
      </ul>
      <div className="row">
        <a className="btn ghost sm" href="Questoes-para-imprimir.html" target="_blank">Caderno de questões para imprimir</a>
        <a className="btn ghost sm" href="Gabarito-comentado.html" target="_blank">Gabarito comentado</a>
      </div>
    </section>
  );
  return (
    <div className="stack">
      <div className="page-head"><div><h1>Provas e fontes</h1><p className="muted">Provas anteriores da banca, edital oficial e textos das leis cobradas.</p></div></div>
      {full ? examList : <LockedOverlay status={status}>{examList}</LockedOverlay>}
      <section className="card">
        <h2 className="card-title">Edital, normas e referências</h2>
        <ul className="links">
          {sources.map((x) => <li key={x.url}><a href={x.url} target="_blank" rel="noreferrer">{x.title} <Icon name="ext" size={14} /></a></li>)}
        </ul>
        <p className="muted small">O edital menciona a PNA de 2019. O Decreto 11.556/2023 revogou o ato que a instituiu; o material distingue a referência histórica do Compromisso Nacional Criança Alfabetizada.</p>
      </section>
    </div>
  );
}

/* ================================================================== */
/* Admin                                                               */
/* ================================================================== */
function Admin({ me }) {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('pending');
  const [q, setQ] = useState('');
  const [stats, setStats] = useState({});
  useEffect(() => api.watchUsers(setUsers, (e) => setError(e.code === 'permission-denied'
    ? 'Sem permissão para ler os usuários. Confira se o seu e-mail está em firestore.rules e se as regras foram publicadas.'
    : 'Erro ao carregar usuários: ' + e.message)), []);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, blocked: 0 };
    (users || []).forEach((u) => { c[u.status || 'pending'] = (c[u.status || 'pending'] || 0) + 1; });
    return c;
  }, [users]);

  const list = (users || [])
    .filter((u) => (tab === 'all' || (u.status || 'pending') === tab))
    .filter((u) => !q || (u.name + ' ' + u.email).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));

  const loadStats = async (uid) => {
    setStats((s) => ({ ...s, [uid]: 'loading' }));
    const p = await api.loadUserProgress(uid);
    const done = p ? todosItens.filter((i) => p.checks?.[i.id]).length : 0;
    const answered = p ? Object.keys(p.answers || {}).length : 0;
    const sims = p?.simHistory?.length || 0;
    setStats((s) => ({ ...s, [uid]: { done, answered, sims } }));
  };

  const setStatus = async (uid, status) => {
    try { await api.setUserStatus(uid, status); } catch (e) { alert('Não foi possível alterar: ' + (e.code || e.message)); }
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div><h1>Administração</h1><p className="muted">Libere o acesso completo de quem entrou com Google. A mudança vale na hora para a pessoa.</p></div>
      </div>
      <section className="stat-grid three">
        <button className={'stat clickable' + (tab === 'pending' ? ' sel' : '')} onClick={() => setTab('pending')}><span className="stat-ico amber"><Icon name="timer" /></span><div><strong>{counts.pending}</strong><span>Aguardando</span></div></button>
        <button className={'stat clickable' + (tab === 'approved' ? ' sel' : '')} onClick={() => setTab('approved')}><span className="stat-ico green"><Icon name="check" /></span><div><strong>{counts.approved}</strong><span>Liberados</span></div></button>
        <button className={'stat clickable' + (tab === 'blocked' ? ' sel' : '')} onClick={() => setTab('blocked')}><span className="stat-ico red"><Icon name="lock" /></span><div><strong>{counts.blocked}</strong><span>Bloqueados</span></div></button>
      </section>
      <div className="toolbar">
        <div className="seg">
          {[['pending', 'Aguardando'], ['approved', 'Liberados'], ['blocked', 'Bloqueados'], ['all', 'Todos']].map(([k, l]) => (
            <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        <label className="search"><Icon name="search" size={16} /><input type="search" placeholder="Buscar nome ou e-mail" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      </div>
      {error && <div className="feedback err">{error}</div>}
      {!users && !error && <Splash />}
      {users && list.length === 0 && <Empty>{tab === 'pending' ? 'Ninguém aguardando liberação.' : 'Nenhum usuário nesta lista.'}</Empty>}
      <div className="user-list">
        {list.map((u) => {
          const st = u.status || 'pending';
          const isMe = u.uid === me.uid;
          const s = stats[u.uid];
          return (
            <div key={u.uid} className="user-row card">
              <div className="user-id">
                {u.photo ? <img src={u.photo} alt="" referrerPolicy="no-referrer" /> : <span className="avatar-fallback">{(u.name || u.email || '?')[0]}</span>}
                <div>
                  <strong>{u.name || '(sem nome)'} {isMe && <span className="pill status-admin">você</span>}</strong>
                  <small>{u.email}</small>
                  <small className="muted">Entrou em {fmtDate(u.createdAt)}{u.lastSeen ? ' · último acesso ' + fmtDate(u.lastSeen) : ''}</small>
                </div>
              </div>
              <div className="user-stats">
                {s && s !== 'loading' ? (
                  <span className="muted small">{s.done}/{todosItens.length} temas · {s.answered} questões · {s.sims} simulados</span>
                ) : (
                  <button className="link-btn" onClick={() => loadStats(u.uid)}>{s === 'loading' ? 'Carregando…' : 'Ver progresso'}</button>
                )}
              </div>
              <div className="user-actions">
                <span className={'pill status-' + st}>{{ pending: 'Aguardando', approved: 'Liberado', blocked: 'Bloqueado' }[st]}</span>
                {st !== 'approved' && <button className="btn primary sm" onClick={() => setStatus(u.uid, 'approved')}><Icon name="check" size={15} /> Liberar acesso</button>}
                {st === 'approved' && !isMe && <button className="btn ghost sm" onClick={() => setStatus(u.uid, 'pending')}>Voltar para amostra</button>}
                {st !== 'blocked' && !isMe && <button className="btn danger sm" onClick={() => setStatus(u.uid, 'blocked')}>Bloquear</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function toMs(t) { if (!t) return 0; if (typeof t === 'number') return t; if (t.toMillis) return t.toMillis(); if (t.seconds) return t.seconds * 1000; return 0; }
function fmtDate(t) { const ms = toMs(t); return ms ? new Date(ms).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'; }

/* ================================================================== */
/* Sugestões de estudo para questões erradas                           */
/* ================================================================== */
function openLesson(id) {
  sessionStorage.setItem('open-item', id);
  if (location.hash === '#/videoaulas') window.dispatchEvent(new HashChangeEvent('hashchange'));
  location.hash = '#/videoaulas';
}

function StudyTip({ q }) {
  const { item, leituras } = estudoPara(q);
  const video = item.videos[0];
  return (
    <div className="study-tip">
      <div className="study-tip-head"><Icon name="bulb" size={18} /> <strong>Para acertar da próxima vez</strong></div>
      <p>Revise o tema <b>{item.titulo}</b> ({item.disciplinaNome}).</p>
      <div className="study-links">
        {video && (
          <a className="study-link video" href={'https://www.youtube.com/watch?v=' + video.id} target="_blank" rel="noreferrer">
            <Icon name="play" size={14} /> <span>Assistir: {video.title}</span>
          </a>
        )}
        {leituras.map((l) => (
          <a key={l.titulo} className="study-link read" href={l.url} target="_blank" rel="noreferrer">
            <Icon name="book" size={14} /> <span>Ler: {l.titulo}</span>
          </a>
        ))}
        <button type="button" className="study-link open" onClick={() => openLesson(item.id)}>
          <Icon name="arrow" size={14} /> <span>Abrir o tema nas videoaulas</span>
        </button>
      </div>
    </div>
  );
}

function StudyPlan({ questions }) {
  const temas = [];
  const seen = new Map();
  questions.forEach((q) => {
    const e = estudoPara(q);
    if (seen.has(e.item.id)) seen.get(e.item.id).n += 1;
    else { const t = { ...e, n: 1 }; seen.set(e.item.id, t); temas.push(t); }
  });
  if (!temas.length) return null;
  temas.sort((a, b) => b.n - a.n);
  return (
    <section className="card study-plan">
      <h2 className="card-title"><Icon name="bulb" size={18} /> O que estudar a partir deste simulado</h2>
      <p className="muted small">Temas das questões que você errou ou deixou em branco, do que mais apareceu para o que menos apareceu.</p>
      <div className="plan-list">
        {temas.map(({ item, leituras, n }) => (
          <div key={item.id} className="plan-row">
            <div className="plan-info">
              <span className={'chip ' + item.cor}>{item.disciplinaNome}</span>
              <strong>{item.titulo}</strong>
              <small className="muted">{n} {n === 1 ? 'questão' : 'questões'} para rever</small>
            </div>
            <div className="plan-actions">
              {item.videos[0] && <a className="btn ghost sm" href={'https://www.youtube.com/watch?v=' + item.videos[0].id} target="_blank" rel="noreferrer"><Icon name="play" size={14} /> Vídeo</a>}
              <a className="btn ghost sm" href={leituras[0].url} target="_blank" rel="noreferrer"><Icon name="book" size={14} /> Leitura</a>
              <button className="btn primary sm" onClick={() => openLesson(item.id)}>Estudar tema</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
