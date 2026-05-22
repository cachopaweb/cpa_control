# Sistema CPA - Instruções Principais

## Visão Geral

O sistema CPA será um microSaaS para controle de operações em casas de apostas. Cada cliente/empresa terá seu próprio ambiente, onde o usuário controlador administra operadores, casas de apostas, operações e ciclos de apostas. Os operadores registram suas atividades e devem anexar uma imagem, foto ou print como comprovante de cada ciclo.

## Objetivo

Permitir que um controlador acompanhe, audite e consolide as apostas feitas por vários operadores, mantendo histórico financeiro, evidências visuais e status operacional de cada ciclo.

O produto deve dar destaque especial para:

- Cadastro e gestão completa de casas de apostas.
- Acompanhamento de lucro diário e mensal.
- Análise de ROI, depósitos e retornos por período.
- Metas operacionais e financeiras com visão clara de progresso.

## Modelo MicroSaaS

O sistema deve suportar múltiplos clientes/empresas usando a mesma aplicação. Cada cliente deve ter isolamento lógico de dados por organização.

Conceitos principais:

- `organization`: cliente/empresa assinante do microSaaS.
- `controller`: administrador da organização.
- `operator`: usuário operacional convidado pelo controlador.
- `invite`: convite por link para entrada de novos usuários na organização.

Regras:

- Todo usuário deve pertencer a uma organização.
- Controladores só administram usuários e dados da própria organização.
- Operadores só acessam dados da própria organização e, dentro dela, apenas os dados permitidos.
- Casas de apostas, operações, ciclos, comprovantes e relatórios devem estar vinculados a uma organização.
- O sistema deve ser preparado para cobrança/assinatura em fase futura, mesmo que pagamentos não façam parte do MVP.

## Referência de Produto

O sistema deve usar `https://nexcpa.com.br/` e os prints salvos em `docs/imagens` como referência principal de layout, navegação, organização visual e usabilidade, pois o novo app será semelhante em proposta operacional.

Essa referência deve orientar:

- Estrutura das telas principais.
- Clareza dos fluxos de operação.
- Densidade das informações.
- Organização de menus e dashboards.
- Experiência mobile e desktop.
- Hierarquia visual entre ações principais, listas, filtros e detalhes.

Prints locais disponíveis:

- `docs/imagens/dashboard.jpeg`
- `docs/imagens/acompanhamento.jpeg`
- `docs/imagens/acompanhamento_operacoes.jpeg`
- `docs/imagens/operadores.jpeg`
- `docs/imagens/operadores-equipe.jpeg`
- `docs/imagens/historico.jpeg`
- `docs/imagens/timeline.jpeg`
- `docs/imagens/folha-pagamento.jpeg`
- `docs/imagens/notificacao.jpeg`
- `docs/imagens/configuracoes.jpeg`

O novo app deve se inspirar na experiência do NEX CPA, mas deve manter identidade própria, sem copiar marca, textos proprietários, logotipo ou assets visuais.

## Papéis

### Controlador

Responsável por administrar o sistema e acompanhar todos os dados.

Permissões esperadas:

- Criar, editar, ativar e desativar operadores.
- Cadastrar e gerenciar casas de apostas.
- Visualizar todas as operações.
- Revisar ciclos enviados por operadores.
- Acompanhar saldo, lucro, prejuízo e desempenho.
- Exportar relatórios.
- Consultar logs de alterações.

### Operador

Responsável por registrar operações e ciclos de apostas.

Permissões esperadas:

- Acessar apenas seus próprios dados.
- Criar uma operação vinculada a uma casa de apostas.
- Registrar ciclos dentro de suas operações.
- Anexar imagem, foto ou print de comprovação em cada ciclo.
- Informar valores, status e observações.
- Encerrar ou pausar operações quando permitido.

## Entidades Principais

### Usuário

Campos sugeridos:

- `id`
- `name`
- `email`
- `password_hash`
- `role`: `controller` ou `operator`
- `status`: `active` ou `inactive`
- `created_at`
- `updated_at`

### Casa de Apostas

Campos sugeridos:

- `id`
- `name`
- `website`
- `logo_url`
- `notes`
- `status`: `active` ou `inactive`
- `created_at`
- `updated_at`

### Operação

Campos sugeridos:

- `id`
- `operator_id`
- `betting_house_id`
- `initial_balance`
- `current_balance`
- `deposit_amount`
- `withdrawal_amount`
- `total_return`
- `profit_loss`
- `roi`
- `status`: `open`, `paused` ou `closed`
- `created_at`
- `closed_at`

### Ciclo

Campos sugeridos:

- `id`
- `operation_id`
- `cycle_number`
- `bet_amount`
- `expected_return`
- `result_amount`
- `profit_loss`
- `roi`
- `status`: `pending`, `won`, `lost`, `canceled` ou `under_review`
- `proof_image_url`
- `notes`
- `created_at`
- `updated_at`

### Comprovante

Pode ser armazenado diretamente no ciclo ou em tabela separada caso seja necessário suportar múltiplas imagens por ciclo.

Campos sugeridos para tabela separada:

- `id`
- `cycle_id`
- `file_url`
- `file_name`
- `mime_type`
- `file_size`
- `uploaded_by`
- `created_at`

### Log de Auditoria

Campos sugeridos:

- `id`
- `actor_user_id`
- `entity_type`
- `entity_id`
- `action`
- `before_data`
- `after_data`
- `created_at`

### Meta

Representa uma meta operacional ou financeira da organização, de um operador ou de uma casa de apostas.

Campos sugeridos:

- `id`
- `organization_id`
- `scope`: `organization`, `operator` ou `betting_house`
- `operator_id`
- `betting_house_id`
- `metric`: `profit`, `roi`, `deposit`, `return`, `cycles` ou `operations`
- `target_value`
- `current_value`
- `period_start`
- `period_end`
- `status`: `active`, `completed`, `missed` ou `canceled`
- `created_at`
- `updated_at`

## Fluxo Principal

1. O controlador acessa sua organização no microSaaS.
2. O controlador convida operadores por link.
3. O operador acessa o link, cria sua conta e entra na organização.
4. O controlador cadastra as casas de apostas.
5. O operador acessa o sistema.
6. O operador cria uma operação em uma casa de apostas.
7. O operador registra ciclos dentro da operação.
8. Cada ciclo exige uma imagem, foto ou print como comprovante.
9. O sistema calcula lucro ou prejuízo do ciclo.
10. O controlador revisa os ciclos e acompanha os resultados.
11. O sistema consolida dashboards e relatórios.

## Regras de Negócio

- Um operador só pode visualizar suas próprias operações e ciclos.
- O controlador pode visualizar todos os operadores, operações e ciclos.
- Controladores e operadores só podem acessar dados da própria organização.
- Novos usuários operadores devem ser adicionados por link de convite gerado pelo controlador.
- Convites devem ter token seguro, prazo de expiração, status e organização de destino.
- Todo ciclo deve ter ao menos um comprovante visual antes de ser salvo ou enviado.
- Uma operação pertence a um operador e a uma casa de apostas.
- Uma operação pode ter vários ciclos.
- O número do ciclo deve ser sequencial dentro da operação.
- Alterações em valores financeiros, status e comprovantes devem gerar log de auditoria.
- Operações encerradas não devem permitir novos ciclos.
- Casas de apostas inativas não devem aceitar novas operações.
- O sistema deve calcular lucro por dia e por mês.
- O sistema deve calcular ROI por período, operador, casa de apostas e organização.
- O sistema deve registrar e exibir depósitos e retornos por período.
- Metas devem mostrar valor alvo, valor atual, percentual de progresso e status.

## Telas Sugeridas

### Controlador

- Dashboard geral.
- Gestão de operadores.
- Gestão de casas de apostas.
- Lista de operações.
- Detalhe da operação.
- Revisão de ciclos.
- Relatórios.
- Metas e progresso.
- Logs de auditoria.

### Operador

- Login.
- Minhas operações.
- Criar operação.
- Detalhe da operação.
- Novo ciclo.
- Histórico de ciclos.
- Upload ou captura de comprovante.

## Stack Técnica Definida

O projeto deve ser implementado em React com Firebase.

- Aplicativo: React.
- Linguagem: TypeScript.
- Autenticação: Firebase Authentication.
- Banco em tempo real: Cloud Firestore.
- Armazenamento de comprovantes: Firebase Storage.
- Regras de acesso: Firebase Security Rules para Firestore e Storage.
- Funções backend opcionais: Cloud Functions for Firebase para rotinas administrativas, auditoria reforçada, cálculos consolidados e criação segura de usuários.
- Relatórios: consultas agregadas no Firestore, exportação CSV/PDF em fase posterior.
- Interface: tema claro e tema escuro, com alternância pelo usuário e suporte à preferência do sistema.

Detalhes técnicos devem seguir o arquivo `docs/ESPECIFICACAO_TECNICA.md`.

## Features Planejadas

As próximas implementações devem seguir as skills em `docs/skills`:

- `auth-and-roles`: autenticação, autorização e separação entre controlador e operador.
- `operator-management`: gestão de operadores e convites por link.
- `betting-house-management`: cadastro e controle de casas de apostas.
- `operation-management`: criação e acompanhamento de operações.
- `cycle-registration`: registro de ciclos com valores, status e comprovante obrigatório.
- `proof-image-capture`: upload, foto, print e validação de imagens.
- `reports-and-dashboard`: dashboards, métricas e relatórios.
- `goals-and-progress`: metas financeiras/operacionais com visão de progresso.
- `audit-log`: trilha de auditoria para alterações sensíveis.
- `app-theme-and-layout`: layout inspirado no NEX CPA, design system React e temas light/dark.

## Prioridade Recomendada de Implementação

1. Autenticação e papéis.
2. Gestão de operadores.
3. Gestão de casas de apostas.
4. Operações.
5. Ciclos com comprovante obrigatório.
6. Dashboard básico.
7. Relatórios financeiros com lucro, ROI, depósito e retorno por período.
8. Metas com visão de progresso.
9. Auditoria completa.
10. Refinamento visual baseado na referência NEX CPA e nos temas light/dark.

## Critérios Gerais de Aceite

- O controlador consegue administrar operadores e acompanhar todas as operações.
- O operador consegue criar uma operação e registrar ciclos.
- Nenhum ciclo é registrado sem comprovante visual.
- Os dados financeiros são consistentes e auditáveis.
- O controlador acompanha lucro diário/mensal, ROI, depósitos e retornos por período.
- O controlador cria metas e acompanha progresso visual.
- A interface funciona bem em desktop e celular.
- Permissões impedem vazamento de dados entre operadores.
