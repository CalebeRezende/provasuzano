// ============================================================
//  ESTUDA SUZANO · configuração do login com Google (Firebase)
//  Siga o passo a passo do arquivo CONFIGURAR-LOGIN.md.
//  Este arquivo pode ser editado direto no GitHub (não precisa recompilar).
// ============================================================

// 1) Cole aqui o objeto "firebaseConfig" do seu projeto Firebase
//    (Console do Firebase > Configurações do projeto > Seus apps > App da Web).
window.FIREBASE_CONFIG = {
  apiKey: 'COLE_AQUI',
  authDomain: 'SEU-PROJETO.firebaseapp.com',
  projectId: 'SEU-PROJETO',
  storageBucket: 'SEU-PROJETO.appspot.com',
  messagingSenderId: '000000000000',
  appId: 'COLE_AQUI',
};

// 2) E-mail(s) Google de quem administra o site (libera ou bloqueia acessos).
//    Use exatamente os mesmos e-mails no arquivo firestore.rules.
window.ADMIN_EMAILS = ['seu-email-de-admin@gmail.com'];

// 3) Contato exibido para quem ainda não tem acesso completo (WhatsApp, e-mail...).
//    Deixe vazio ('') para mostrar apenas "converse com o administrador".
window.ADMIN_CONTATO = '';
