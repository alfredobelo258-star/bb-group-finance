# B&B Group Finance V2

Sistema online para B&B Group com login, PostgreSQL, movimentos, investimentos, comissões, dívidas e dashboard.

## Deploy no Render
1. Crie um PostgreSQL (Render Postgres, Neon ou Supabase).
2. Crie um Web Service no Render a partir deste projeto.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Environment:
   - `DATABASE_URL` = URL do PostgreSQL
   - `JWT_SECRET` = uma chave longa e aleatória
6. Faça o deploy.
7. Abra o endereço `.onrender.com`.

## Credenciais iniciais
- Belo: `belo` / `Belo@258`
- Backson: `backson` / `Backson@258`

IMPORTANTE: altere as palavras-passe antes de usar em produção. A versão V2 usa PostgreSQL para que Belo e Backson possam ver os mesmos dados online.
