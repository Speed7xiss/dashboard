# Nexus Dashboard

Dashboard full-stack em Next.js, TypeScript, Prisma e SQLite, com interface em português, área administrativa, área de usuário e API própria.

## Requisitos
- Node.js 20.9+
- npm

## Configuração local

```bash
npm install
cp .env.example .env
```

No Windows PowerShell, copie `.env.example` para `.env` manualmente. Defina `AUTH_SECRET` com uma chave aleatória forte e altere `ADMIN_PASSWORD`.

```bash
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Acesse `http://localhost:3000`. A conta inicial usa `ADMIN_EMAIL` e `ADMIN_PASSWORD` definidos no `.env`. O seed cria a conta administrativa somente se ela ainda não existir; não substitui credenciais existentes.

## API
- `POST /api/auth/login` — autenticação por e-mail e senha.
- `POST /api/auth/logout` — encerra a sessão.
- `GET /api/auth/me` — usuário autenticado.
- `GET /api/dashboard` — dados de dashboard conforme o perfil.
- `GET /api/admin/users` — listagem administrativa (admin).
- `PATCH /api/admin/users` — atualiza status, plano ou perfil (admin).

## Segurança e produção
Senhas são armazenadas com hash bcrypt; a sessão usa JWT assinado em cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção. As rotas administrativas validam a função no servidor. Para implantação pública, configure HTTPS, `AUTH_SECRET` forte, limitação de tentativas de login, proteção CSRF/origin nas rotas de mutação, monitoramento e backup. SQLite é adequado para desenvolvimento e instâncias simples; em implantação com múltiplas instâncias, configure PostgreSQL e uma `DATABASE_URL` apropriada no schema Prisma.

A interface já consome a API real para login, estatísticas e gerenciamento de usuários. Não inclui pagamento, envio de e-mail ou provedor OAuth sem configuração adicional.
