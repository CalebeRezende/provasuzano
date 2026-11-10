// Camada de dados: login com Google + cadastro + progresso.
// Modo "firebase": produção (GitHub Pages) com Firebase Auth + Firestore.
// Modo "demo": só em localhost, sem Firebase, para testar o visual (dados no navegador).
// Modo "setup": Firebase ainda não configurado no site publicado.

import { initializeApp } from 'firebase/app';
import {
  getAuth, onAuthStateChanged, signInWithPopup, signInWithRedirect, GoogleAuthProvider, signOut,
} from 'firebase/auth';
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, collection, serverTimestamp,
} from 'firebase/firestore';

const cfg = window.FIREBASE_CONFIG || {};
const configured = Boolean(cfg.apiKey && !/COLE_AQUI/.test(cfg.apiKey) && cfg.projectId && !/SEU-PROJETO/.test(cfg.projectId));
const isLocal = ['localhost', '127.0.0.1', ''].includes(location.hostname) || location.protocol === 'file:';

export const mode = configured ? 'firebase' : isLocal ? 'demo' : 'setup';
export const adminEmails = (window.ADMIN_EMAILS || []).map((e) => String(e).trim().toLowerCase()).filter((e) => e && !e.startsWith('seu-email'));
export const adminContato = window.ADMIN_CONTATO || '';

export const emptyProgress = () => ({ checks: {}, watched: {}, answers: {}, sim: null, lastSimIds: [], simHistory: [] });

/* ------------------------------------------------------------------ */
/* Firebase                                                            */
/* ------------------------------------------------------------------ */
let fb = null;
function firebase() {
  if (!fb) {
    const app = initializeApp(cfg);
    fb = { auth: getAuth(app), db: getFirestore(app) };
  }
  return fb;
}

const isAdminEmail = (email) => Boolean(email) && adminEmails.includes(String(email).toLowerCase());

/** Observa a sessão. Chama cb({user, profile}) — profile traz status e isAdmin. */
export function watchSession(cb) {
  if (mode === 'demo') return demo.watchSession(cb);
  if (mode !== 'firebase') { cb({ user: null, profile: null }); return () => {}; }
  const { auth, db } = firebase();
  let stopProfile = () => {};
  const stopAuth = onAuthStateChanged(auth, async (user) => {
    stopProfile();
    if (!user) { cb({ user: null, profile: null }); return; }
    const ref = doc(db, 'users', user.uid);
    const base = { name: user.displayName || '', email: user.email || '', photo: user.photoURL || '', lastSeen: serverTimestamp() };
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) await updateDoc(ref, base);
      else await setDoc(ref, { ...base, status: 'pending', createdAt: serverTimestamp() });
    } catch (e) {
      console.error('Falha ao registrar usuário', e);
    }
    stopProfile = onSnapshot(ref, (s) => {
      const data = s.data() || { status: 'pending' };
      cb({ user, profile: { ...data, uid: user.uid, isAdmin: isAdminEmail(user.email) } });
    }, (e) => {
      console.error(e);
      cb({ user, profile: { status: 'pending', uid: user.uid, isAdmin: isAdminEmail(user.email), error: e.code } });
    });
  });
  return () => { stopProfile(); stopAuth(); };
}

export async function login() {
  if (mode === 'demo') return demo.login();
  const { auth } = firebase();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider);
    } else if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
      throw e;
    }
  }
}

export async function logout() {
  if (mode === 'demo') return demo.logout();
  await signOut(firebase().auth);
}

export async function loadProgress(uid) {
  if (mode === 'demo') return demo.loadProgress(uid);
  const snap = await getDoc(doc(firebase().db, 'progress', uid));
  const { updatedAt, ...data } = snap.exists() ? snap.data() : {};
  return { ...emptyProgress(), ...data };
}

export async function saveProgress(uid, progress) {
  if (mode === 'demo') return demo.saveProgress(uid, progress);
  const { updatedAt, ...rest } = progress;
  await setDoc(doc(firebase().db, 'progress', uid), { ...JSON.parse(JSON.stringify(rest)), updatedAt: serverTimestamp() });
}

/** Admin: lista de usuários em tempo real. */
export function watchUsers(cb, onError) {
  if (mode === 'demo') return demo.watchUsers(cb);
  return onSnapshot(collection(firebase().db, 'users'), (s) => {
    cb(s.docs.map((d) => ({ uid: d.id, ...d.data() })));
  }, onError);
}

export async function setUserStatus(uid, status) {
  if (mode === 'demo') return demo.setUserStatus(uid, status);
  await updateDoc(doc(firebase().db, 'users', uid), { status, reviewedAt: serverTimestamp() });
}

export async function loadUserProgress(uid) {
  if (mode === 'demo') return demo.loadProgress(uid);
  try {
    const snap = await getDoc(doc(firebase().db, 'progress', uid));
    return snap.exists() ? snap.data() : null;
  } catch { return null; }
}

/* ------------------------------------------------------------------ */
/* Demonstração local (sem Firebase)                                    */
/* ------------------------------------------------------------------ */
const demo = (() => {
  const K = 'estuda-suzano-demo';
  const read = () => { try { return JSON.parse(localStorage.getItem(K)) || {}; } catch { return {}; } };
  const write = (v) => { try { localStorage.setItem(K, JSON.stringify(v)); } catch { /* sem armazenamento */ } };
  const listeners = new Set();
  const userListeners = new Set();
  const seed = () => {
    const s = read();
    if (!s.users) {
      s.users = {
        admin: { name: 'Admin (demonstração)', email: 'admin@demo.local', status: 'approved', role: 'admin', createdAt: Date.now() - 864e5 * 3 },
        maria: { name: 'Maria Souza', email: 'maria@demo.local', status: 'pending', createdAt: Date.now() - 36e5 },
        joao: { name: 'João Lima', email: 'joao@demo.local', status: 'approved', createdAt: Date.now() - 864e5 },
      };
      s.progress = {};
      write(s);
    }
    return s;
  };
  const emit = () => {
    const s = seed();
    const uid = s.session;
    const u = uid && s.users[uid];
    const payload = u
      ? { user: { uid, displayName: u.name, email: u.email, photoURL: '' }, profile: { ...u, uid, isAdmin: u.role === 'admin' } }
      : { user: null, profile: null };
    listeners.forEach((cb) => cb(payload));
    const list = Object.entries(s.users).map(([id, x]) => ({ uid: id, ...x }));
    userListeners.forEach((cb) => cb(list));
  };
  return {
    watchSession(cb) { listeners.add(cb); setTimeout(emit, 150); return () => listeners.delete(cb); },
    async login(as) {
      const s = seed();
      s.session = as || new URLSearchParams(location.search).get('como') || 'admin';
      write(s); emit();
    },
    async logout() { const s = seed(); delete s.session; write(s); emit(); },
    async loadProgress(uid) { return { ...emptyProgress(), ...(seed().progress?.[uid] || {}) }; },
    async saveProgress(uid, p) { const s = seed(); s.progress[uid] = p; write(s); },
    watchUsers(cb) { userListeners.add(cb); setTimeout(emit, 50); return () => userListeners.delete(cb); },
    async setUserStatus(uid, status) { const s = seed(); s.users[uid].status = status; write(s); emit(); },
    loginAs(uid) { return this.login(uid); },
  };
})();

export const demoLoginAs = (uid) => demo.loginAs(uid);
