# CPA Control

MicroSaaS para controle de operações em casas de apostas, inspirado nos fluxos e telas de referência documentados em `docs/`.

## Stack

- React + TypeScript
- Vite
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase Security Rules

## Como Rodar

1. Instale as dependências:

```bash
npm install
```

2. Configure o Firebase:

```bash
cp .env.example .env
```

Preencha as variáveis `VITE_FIREBASE_*` no `.env`.

3. Inicie o app:

```bash
npm run dev
```

O app fica disponível em `http://localhost:5173`.

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

## Funcionalidades Atuais

- Dashboard com lucro diário/mensal, ROI, depósitos e retornos.
- Gestão de casas de apostas.
- Operações com ciclos e comprovantes.
- Operadores com convite por link.
- Metas com progresso.
- Relatórios financeiros.
- Tema claro, escuro e sistema.
- Integração Firebase pronta para ambiente real.

## Firebase

Arquivos incluídos:

- `firebase.json`
- `firestore.rules`
- `storage.rules`
- `firestore.indexes.json`

Para deploy das regras e hosting, instale/configure o Firebase CLI e use o projeto `controle-cpa`.

## Documentação

- `docs/INSTRUCOES_PRINCIPAIS.md`
- `docs/ESPECIFICACAO_TECNICA.md`
- `docs/skills/`
- `docs/imagens/`
