// ============================================================
//  ESTUDA SUZANO · configuração do login com Google (Firebase)
//  Siga o passo a passo do arquivo CONFIGURAR-LOGIN.md.
//  Este arquivo pode ser editado direto no GitHub (não precisa recompilar).
// ============================================================

// 1) Cole aqui o objeto "firebaseConfig" do seu projeto Firebase
//    (Console do Firebase > Configurações do projeto > Seus apps > App da Web).
window.FIREBASE_CONFIG = {
  apiKey: 'AIzaSyChsfUHgcIf4g24MZdo9QyTBwIuTMBQf5c',
  authDomain: 'estuda-suzano.firebaseapp.com',
  projectId: 'estuda-suzano',
  storageBucket: 'estuda-suzano.firebasestorage.app',
  messagingSenderId: '333968024213',
  appId: '1:333968024213:web:cfe7538ad0b71f7e78b19c',
};

// 2) E-mail(s) Google de quem administra o site (libera ou bloqueia acessos).
//    Use exatamente os mesmos e-mails no arquivo firestore.rules.
window.ADMIN_EMAILS = ['calebemrnos@gmail.com'];

// 3) Contato exibido para quem ainda não tem acesso completo (WhatsApp, e-mail...).
//    Deixe vazio ('') para mostrar apenas "converse com o administrador".
window.ADMIN_CONTATO = '(11977991447';
