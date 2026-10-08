# B&B Group Finance — versão completa para hospedagem

## Arquitetura
- Node.js + Express
- PostgreSQL
- Autenticação por cookie JWT
- Dois utilizadores iniciais: Belo e Backson
- Frontend servido pelo próprio Node

## Deploy recomendado
1. Criar uma base PostgreSQL num provedor como Render, Railway, Supabase ou Neon.
2. Executar `schema.sql` na base.
3. Definir as variáveis de ambiente de `.env.example` e adicionar `SETUP_KEY`.
4. Instalar: `npm install`
5. Iniciar: `npm start`
6. Abrir `/api/setup` uma única vez com POST e `{"setupKey":"..."}`.
7. Entrar com Belo/1234 ou Backson/1234 e mudar as palavras-passe antes de usar em produção.

## Segurança
- Trocar JWT_SECRET e SETUP_KEY por valores aleatórios longos.
- Não publicar `.env`.
- Em produção, usar HTTPS.
- Trocar as palavras-passe iniciais imediatamente.

## Funcionalidades
- Acesso apenas de Belo e Backson após setup.
- Histórico partilhado.
- Investimentos com limite individual.
- Receitas e despesas com descrição obrigatória.
- Comissão opcional.
- Dívidas.
- Meta semanal.
- Dashboard e alertas no frontend.
