# Configurar o login com Google e a liberação pelo admin

O site é estático (GitHub Pages). O login com Google, a lista de quem pediu acesso e o
progresso de cada pessoa ficam no **Firebase** (plano gratuito "Spark" é suficiente).
Leva uns 10 minutos e só precisa ser feito uma vez.

## 1. Criar o projeto no Firebase

1. Acesse <https://console.firebase.google.com> com a sua conta Google e clique em **Adicionar projeto**
   (pode desativar o Google Analytics).
2. No menu **Build › Authentication**, clique em **Vamos começar** › aba **Método de login** ›
   **Google** › ative e salve.
3. Ainda em Authentication › **Configurações › Domínios autorizados**, adicione o domínio do site,
   por exemplo `seu-usuario.github.io`.
4. No menu **Build › Firestore Database**, clique em **Criar banco de dados**
   (modo de produção, região `southamerica-east1` / São Paulo).

## 2. Ligar o site ao projeto

1. No Firebase, abra **Configurações do projeto** (engrenagem) › **Seus apps** › ícone **`</>`** (Web).
   Dê um nome (ex.: "Estuda Suzano") e copie o objeto `firebaseConfig`.
2. No GitHub, edite o arquivo **`firebase-config.js`** (na raiz do repositório):
   - cole os valores em `window.FIREBASE_CONFIG`;
   - coloque o seu e-mail Google em `window.ADMIN_EMAILS` (pode ter mais de um admin);
   - opcional: coloque um contato (WhatsApp/e-mail) em `window.ADMIN_CONTATO` — ele aparece
     na mensagem "para continuar, converse com o administrador".

   > Esses valores do `firebaseConfig` não são senha: eles identificam o projeto. Quem protege
   > os dados são as regras do passo 3.

## 3. Publicar as regras de segurança

1. Abra o arquivo **`firestore.rules`** deste repositório e troque `seu-email-de-admin@gmail.com`
   pelo **mesmo** e-mail usado em `ADMIN_EMAILS`.
2. No Firebase, vá em **Firestore Database › Regras**, apague o conteúdo, cole o arquivo inteiro
   e clique em **Publicar**.

As regras garantem que:
- cada pessoa só lê e grava o próprio progresso;
- ninguém consegue se autoaprovar (o campo `status` só muda pelo admin);
- só o admin vê a lista de usuários.

## 4. Pronto

Abra o site, clique em **Entrar com Google** com o e-mail de admin e veja a aba **Admin**.
Quando alguém entrar, aparece em **Aguardando** — clique em **Liberar acesso** e a pessoa
recebe o conteúdo completo na hora, sem recarregar.

| Situação | O que a pessoa vê |
| --- | --- |
| Não logada | Só a tela de entrada |
| Aguardando / bloqueada | 2 temas de amostra nas videoaulas, 10 questões de amostra e o aviso "para continuar, converse com o administrador" |
| Liberada | Tudo: 64 temas do edital, 250 questões, simulados e provas |

## Alterar o conteúdo ou o visual

O código-fonte (React + Vite) está em `app/`:

- `app/src/data/videoaulas.js` — temas do edital e vídeos de cada um (`free: true` = amostra grátis);
- `app/src/data/conteudo.json` — banco de questões, provas e fontes;
- `app/src/App.jsx` e `app/src/styles.css` — telas e estilo.

Para gerar o site depois de editar:

```bash
cd app
npm install
npm run build
```

O build escreve `index.html` e `assets/` na raiz do repositório. Faça commit dos dois e o GitHub
Pages publica. Para testar no computador sem Firebase: `npm run build && npx serve ..` e abra
`http://localhost:3000` — aparece um **modo demonstração** com perfis de admin e aluno.

## Limitação importante

O GitHub Pages serve arquivos públicos. O bloqueio de conteúdo é feito pelo aplicativo, então
alguém com conhecimento técnico ainda consegue abrir os arquivos do site e ler as questões.
O que fica realmente protegido pelo Firebase é o login, a lista de pessoas e o progresso de cada uma.
