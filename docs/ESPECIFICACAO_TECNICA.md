# Sistema CPA - Especificação Técnica

## Stack Oficial

O sistema será desenvolvido em React/TypeScript e integrado aos serviços Firebase.

- React para aplicação web responsiva.
- TypeScript como linguagem principal.
- Vite como ferramenta recomendada para build e desenvolvimento.
- Firebase Authentication para login e identidade dos usuários.
- Cloud Firestore para dados em tempo real.
- Firebase Storage para imagens, fotos e prints dos ciclos.
- Firebase Security Rules para controle de acesso.
- Cloud Functions for Firebase quando houver necessidade de lógica administrativa segura no backend.
- Tema claro e tema escuro no React, com alternância manual e respeito à preferência do sistema.

## Modelo MicroSaaS

O sistema deve ser multi-tenant, com isolamento lógico por organização.

Entidades SaaS:

- `organizations`: clientes/empresas assinantes do microSaaS.
- `users`: usuários vinculados a uma organização.
- `invites`: convites por link gerados por controladores.
- Dados operacionais: casas, operações, ciclos, comprovantes e logs sempre vinculados a uma organização.

Regras de isolamento:

- Todo documento operacional deve ter `organizationId`.
- Usuários só podem ler/gravar dados da própria organização.
- Controladores administram apenas a própria organização.
- Operadores acessam apenas a própria organização e os próprios dados operacionais.
- Security Rules devem validar `organizationId` em todas as leituras e escritas.

## Arquitetura Geral

O app React será responsável pela interface, fluxo de navegação, validações de experiência e consumo dos serviços Firebase. As regras definitivas de permissão devem ficar no Firebase, principalmente em Firestore Rules e Storage Rules.

Estrutura recomendada no React:

- `src/app`: inicialização, providers, tema, rotas e configuração geral.
- `src/features/auth`: login, sessão e controle de papel.
- `src/features/operators`: gestão de operadores.
- `src/features/betting-houses`: casas de apostas.
- `src/features/operations`: operações.
- `src/features/cycles`: ciclos.
- `src/features/proofs`: captura e upload de comprovantes.
- `src/features/dashboard`: métricas e relatórios.
- `src/features/goals`: metas e acompanhamento de progresso.
- `src/features/audit`: logs de auditoria.
- `src/features/settings`: preferências do usuário, incluindo tema claro/escuro.
- `src/shared`: componentes, hooks, utilitários, validações e elementos comuns.
- `src/data`: modelos, repositórios e serviços Firebase.

## Referência de Layout e Usabilidade

O app deve usar `https://nexcpa.com.br/` e os prints em `docs/imagens` como referência principal de layout e usabilidade. Antes de implementar telas finais, revisar o sistema de referência e mapear:

- Navegação principal.
- Organização do dashboard.
- Padrão de listagens, filtros e detalhes.
- Fluxo de criação de operação.
- Fluxo de registro de ciclo.
- Padrões visuais de cards, tabelas, botões, menus e indicadores.
- Comportamento em mobile e desktop.

Prints locais de referência:

- `dashboard.jpeg`: visão principal e indicadores.
- `acompanhamento.jpeg`: acompanhamento geral.
- `acompanhamento_operacoes.jpeg`: acompanhamento de operações.
- `operadores.jpeg`: listagem/gestão de operadores.
- `operadores-equipe.jpeg`: operadores por equipe.
- `historico.jpeg`: histórico operacional.
- `timeline.jpeg`: linha do tempo de eventos.
- `folha-pagamento.jpeg`: visão financeira/pagamentos.
- `notificacao.jpeg`: notificações.
- `configuracoes.jpeg`: preferências e configuração.

Diretrizes:

- Inspirar-se na experiência operacional, não copiar identidade visual proprietária.
- Priorizar telas densas, objetivas e rápidas para uso diário.
- Colocar ações frequentes sempre visíveis ou com poucos toques.
- Usar dashboards com indicadores financeiros e status em tempo real.
- Evitar aparência de landing page; o app deve abrir direto na experiência operacional após login.
- Manter identidade própria para nomes, cores, ícones e componentes.

## Tema Light/Dark

O app deve possuir tema claro e tema escuro.

Requisitos:

- Usar tokens CSS, CSS variables ou configuração equivalente no sistema de estilos escolhido para light e dark.
- Respeitar a preferência do sistema por padrão.
- Permitir alternância manual em configurações.
- Persistir preferência do usuário localmente e, se útil, em `users/{uid}.settings.themeMode`.
- Garantir contraste adequado em textos, botões, cards, inputs e indicadores financeiros.
- Definir cores sem depender apenas de verde/vermelho para status; usar ícones e labels junto com cor.
- Testar todas as telas principais nos dois temas.

Estrutura sugerida:

```text
src/app/theme/theme.ts
src/app/theme/colors.ts
src/app/theme/tokens.css
src/app/theme/theme-provider.tsx
```

Modos aceitos:

- `system`
- `light`
- `dark`

## Firebase Authentication

O Firebase Authentication será a fonte de identidade.

Provedores iniciais:

- Email e senha.

Dados que ficam no Firebase Auth:

- `uid`
- `email`
- status básico de autenticação

Dados de perfil e autorização devem ficar no Firestore em `users/{uid}`.

Campos sugeridos em `users/{uid}`:

- `name`
- `email`
- `role`: `controller` ou `operator`
- `status`: `active` ou `inactive`
- `createdAt`
- `updatedAt`
- `createdBy`
- `organizationId`

Regras:

- Usuários inativos não devem acessar dados operacionais.
- O papel do usuário deve ser consultado em `users/{uid}`.
- A criação de operadores deve ser feita por link de convite gerado pelo controlador.
- Para maior segurança, usar Cloud Functions para gerar convites, validar tokens e finalizar entrada do usuário na organização.

## Convite de Usuários por Link

O controlador deve conseguir adicionar novos usuários por link.

Fluxo recomendado:

1. Controlador informa nome, email e papel do novo usuário.
2. App chama uma Cloud Function `createInvite`.
3. A função valida se o solicitante é controlador ativo da organização.
4. A função cria um documento em `invites` com token seguro, organização, email, papel, expiração e status.
5. O sistema gera um link como `/accept-invite?token={token}`.
6. O controlador envia o link ao usuário.
7. O usuário abre o link, cria conta ou faz login com Firebase Authentication.
8. App chama Cloud Function `acceptInvite`.
9. A função valida token, expiração, status e email, então cria/atualiza `users/{uid}` com `organizationId` e `role`.
10. Convite muda para `accepted`.

Campos sugeridos em `invites/{inviteId}`:

- `organizationId`: string
- `email`: string
- `role`: `controller` ou `operator`
- `tokenHash`: string
- `status`: `pending`, `accepted`, `expired` ou `revoked`
- `expiresAt`: timestamp
- `createdAt`: timestamp
- `createdBy`: string
- `acceptedAt`: timestamp ou null
- `acceptedBy`: string ou null

Regras:

- Não salvar token puro no Firestore; salvar hash do token.
- Convites devem expirar.
- Convites podem ser revogados pelo controlador.
- O link deve ser de uso único.
- Se o convite for para email específico, o email autenticado deve corresponder.
- Um controlador não pode criar convite para outra organização.

## Cloud Firestore

O Firestore será usado como banco principal em tempo real.

Coleções recomendadas:

```text
users/{userId}
organizations/{organizationId}
invites/{inviteId}
bettingHouses/{bettingHouseId}
operations/{operationId}
cycles/{cycleId}
cycleProofs/{proofId}
auditLogs/{auditLogId}
goals/{goalId}
```

### users

Representa controladores e operadores.

Campos:

- `name`: string
- `email`: string
- `role`: string
- `status`: string
- `organizationId`: string
- `createdAt`: timestamp
- `updatedAt`: timestamp
- `createdBy`: string ou null

### organizations

Representa o cliente/empresa assinante.

Campos:

- `name`: string
- `status`: `active`, `trialing`, `past_due`, `inactive`
- `plan`: string ou null
- `ownerUserId`: string
- `createdAt`: timestamp
- `updatedAt`: timestamp

### invites

Representa convite por link para entrada na organização.

Campos:

- `organizationId`: string
- `email`: string
- `role`: string
- `tokenHash`: string
- `status`: string
- `expiresAt`: timestamp
- `createdAt`: timestamp
- `createdBy`: string
- `acceptedAt`: timestamp ou null
- `acceptedBy`: string ou null

### bettingHouses

Representa casas de apostas. A gestão de casas deve ser uma área central do produto, com cadastro, edição, ativação/desativação, filtros, vínculo com operações e leitura de desempenho financeiro.

Campos:

- `name`: string
- `website`: string ou null
- `logoUrl`: string ou null
- `notes`: string ou null
- `status`: `active` ou `inactive`
- `organizationId`: string
- `createdAt`: timestamp
- `updatedAt`: timestamp
- `createdBy`: string

### operations

Representa uma operação criada por operador em uma casa de apostas.

Campos:

- `operatorId`: string
- `organizationId`: string
- `bettingHouseId`: string
- `initialBalance`: number
- `currentBalance`: number
- `depositAmount`: number
- `withdrawalAmount`: number
- `totalReturn`: number
- `profitLoss`: number
- `roi`: number
- `status`: `open`, `paused` ou `closed`
- `createdAt`: timestamp
- `updatedAt`: timestamp
- `closedAt`: timestamp ou null

Índices prováveis:

- `operatorId + status`
- `operatorId + createdAt`
- `bettingHouseId + status`

### cycles

Representa cada ciclo de aposta.

Campos:

- `operationId`: string
- `operatorId`: string
- `organizationId`: string
- `bettingHouseId`: string
- `cycleNumber`: number
- `betAmount`: number
- `expectedReturn`: number
- `resultAmount`: number ou null
- `profitLoss`: number ou null
- `roi`: number ou null
- `status`: `pending`, `under_review`, `won`, `lost` ou `canceled`
- `proofRequired`: boolean
- `proofCount`: number
- `notes`: string ou null
- `createdAt`: timestamp
- `updatedAt`: timestamp

Índices prováveis:

- `operationId + cycleNumber`
- `operatorId + createdAt`
- `status + createdAt`
- `bettingHouseId + createdAt`

### cycleProofs

Representa imagens vinculadas a ciclos.

Campos:

- `cycleId`: string
- `operationId`: string
- `operatorId`: string
- `organizationId`: string
- `storagePath`: string
- `downloadUrl`: string
- `fileName`: string
- `mimeType`: string
- `fileSize`: number
- `uploadedBy`: string
- `createdAt`: timestamp

### goals

Representa metas financeiras ou operacionais.

Campos:

- `organizationId`: string
- `scope`: `organization`, `operator` ou `betting_house`
- `operatorId`: string ou null
- `bettingHouseId`: string ou null
- `metric`: `profit`, `roi`, `deposit`, `return`, `cycles` ou `operations`
- `targetValue`: number
- `currentValue`: number
- `progressPercent`: number
- `periodStart`: timestamp
- `periodEnd`: timestamp
- `status`: `active`, `completed`, `missed` ou `canceled`
- `createdAt`: timestamp
- `updatedAt`: timestamp
- `createdBy`: string

### auditLogs

Representa alterações sensíveis.

Campos:

- `actorUserId`: string
- `organizationId`: string
- `entityType`: string
- `entityId`: string
- `action`: string
- `beforeData`: map ou null
- `afterData`: map ou null
- `createdAt`: timestamp

## Firebase Storage

O Firebase Storage armazenará fotos, prints e imagens de comprovante.

Estrutura recomendada:

```text
cycle-proofs/{operatorId}/{operationId}/{cycleId}/{proofId}.{ext}
```

Regras:

- Operador pode enviar comprovante apenas para ciclo próprio.
- Controlador pode visualizar todos os comprovantes.
- Arquivos devem ser imagens.
- Definir limite inicial de tamanho, por exemplo 10 MB.
- Salvar metadados no Firestore após upload concluído.

## Regras de Segurança

As permissões devem ser aplicadas no Firestore e no Storage.

Princípios:

- Usuário não autenticado não acessa dados privados.
- Usuário autenticado só acessa documentos da própria `organizationId`.
- Operador acessa apenas documentos com `operatorId == request.auth.uid`.
- Controlador acessa todos os dados da própria organização.
- Apenas controlador gerencia operadores e casas de apostas.
- Ciclos sem comprovante não devem avançar para status final.
- Logs de auditoria são somente leitura para controlador e escrita controlada pelo sistema.

## Fluxo Técnico de Ciclo com Comprovante

1. Operador abre uma operação própria.
2. App cria ou prepara um ciclo com status `pending`.
3. Operador informa valores e anexa imagem.
4. App envia a imagem para Firebase Storage.
5. App grava metadados em `cycleProofs`.
6. App atualiza `proofCount` do ciclo.
7. App permite enviar ciclo para `under_review` apenas se `proofCount > 0`.
8. Controlador revisa o ciclo.
9. Resultado final atualiza `profitLoss` e `currentBalance` da operação.

## Métricas Financeiras e Metas

O sistema deve priorizar acompanhamento financeiro por período.

Métricas obrigatórias:

- Lucro diário.
- Lucro mensal.
- ROI por período.
- Depósito por período.
- Retorno por período.
- Lucro por casa de apostas.
- ROI por casa de apostas.
- Lucro por operador.
- ROI por operador.
- Progresso de metas.

Fórmulas recomendadas:

- `profitLoss = resultAmount - betAmount`
- `roi = profitLoss / depositAmount * 100` quando a análise for sobre depósito.
- `roi = profitLoss / betAmount * 100` quando a análise for sobre valor apostado.
- `progressPercent = currentValue / targetValue * 100`

Regras:

- Sempre indicar qual base de ROI está sendo usada: depósito ou valor apostado.
- Filtros por período devem afetar lucro, ROI, depósito, retorno e progresso.
- Metas devem ser calculáveis por organização, operador ou casa de apostas.
- Dashboards devem mostrar cartões de resumo e gráficos/tabelas para comparação por período.
- Para volumes maiores, usar documentos de resumo ou Cloud Functions para agregações diárias/mensais.

## Pacotes React Sugeridos

- `react`
- `react-dom`
- `typescript`
- `vite`
- `firebase`
- `react-router-dom`
- `@tanstack/react-query` ou hooks próprios com subscriptions Firebase
- `react-hook-form`
- `zod`
- `intl`
- `lucide-react`
- `date-fns`

Escolher apenas uma estratégia principal de estado. Para dados remotos, priorizar subscriptions do Firestore encapsuladas em hooks/repositórios. Para estado local de UI, usar React state/context ou uma biblioteca pequena se o projeto justificar.

## Critérios Técnicos de Aceite

- O app inicializa Firebase corretamente por ambiente.
- Login usa Firebase Authentication.
- Perfil, papel e status são lidos do Firestore.
- Perfil do usuário contém `organizationId`.
- Admin/controlador consegue gerar link de convite.
- Usuário convidado consegue aceitar convite e entrar na organização correta.
- Convite expirado, revogado ou já aceito não pode ser reutilizado.
- Dados operacionais usam streams ou consultas Firestore.
- Gestão de casas de apostas permite cadastrar, editar, ativar/desativar e acompanhar desempenho.
- Dashboard mostra lucro diário e mensal.
- Relatórios mostram ROI, depósitos e retornos por período.
- Metas mostram progresso percentual e status.
- Imagens de ciclos são enviadas para Firebase Storage.
- Cada comprovante tem metadados vinculados no Firestore.
- Operadores não conseguem acessar dados de outros operadores.
- Controladores conseguem revisar todos os dados da própria organização.
- Regras Firebase são consideradas parte obrigatória da entrega.
