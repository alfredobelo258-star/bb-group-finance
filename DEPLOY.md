# Deploy rápido

## Render
- Crie um Web Service a partir desta pasta/repositório.
- Build: `npm install`
- Start: `npm start`
- Crie uma PostgreSQL e copie a `DATABASE_URL`.
- Adicione `JWT_SECRET`, `SETUP_KEY`, `NODE_ENV=production`.
- Execute `schema.sql` na PostgreSQL.
- Abra `https://SEU-SITE/api/setup` via POST com `{"setupKey":"SEU_SETUP_KEY"}` (pode usar Postman/Insomnia).
- Login inicial: Belo / 1234 e Backson / 1234.

## Nota
A aplicação está preparada para hospedagem, mas este chat não possui uma conta de hosting nem pode publicar um domínio público por conta própria.
