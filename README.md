# App Delivery

Aplicativo de delivery mobile-first construído com Next.js, Firebase e Capacitor.

## Tecnologias

- **Next.js 16** — App Router, `output: 'export'` para build estático
- **Firebase** — Auth, Firestore, Cloud Functions, Cloud Messaging (FCM)
- **Capacitor 8** — Deploy nativo Android com push notifications
- **Zustand** — Gerenciamento de estado do carrinho
- **Tailwind CSS v4** — Estilização com suporte a tema escuro

## Funcionalidades

- Catálogo de produtos com busca
- Carrinho com seleção de data/hora de entrega
- Autenticação (e-mail/senha e Google)
- Painel administrativo (gerenciar pedidos e produtos)
- Tema claro/escuro persistido
- Push notifications via FCM (status do pedido em tempo real)

## Estrutura do Projeto

```
app/
  (app)/          # Rotas autenticadas (catálogo, carrinho, perfil, admin)
  (auth)/         # Rotas públicas (login)
components/       # Componentes reutilizáveis (auth, cart, catalog, ui)
hooks/            # Custom hooks (useAuth, useCheckout, usePushNotifications)
lib/firebase/     # Configuração e helpers do Firebase
store/            # Zustand stores
types/            # Tipos TypeScript
functions/        # Firebase Cloud Functions
```

## Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar Firebase

Crie o arquivo `lib/firebase/firebaseConfig.ts` com as credenciais do seu projeto Firebase:

```ts
export const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

### 3. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Build para Android (Capacitor)

```bash
# Build estático do Next.js
npm run build

# Sincronizar com o projeto Android
npx cap sync android

# Abrir no Android Studio
npx cap open android
```

Coloque o arquivo `google-services.json` (baixado do Firebase Console) em `android/app/`.

## Deploy das Cloud Functions

> Requer plano **Blaze** no Firebase.

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

## Variáveis de Ambiente

Nenhuma variável de ambiente é necessária — as credenciais do Firebase são configuradas diretamente em `lib/firebase/firebaseConfig.ts`.

## Admin

O usuário administrador é definido pela constante `ADMIN_EMAIL` em `lib/firebase/auth.ts`. Apenas esse usuário tem acesso ao painel `/admin`.
