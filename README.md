# Nexus Dashboard

Dashboard full-stack em Next.js, TypeScript, Prisma e SQLite, com autenticação, painel administrativo, gerenciamento de produtos e licenças.

## Configuração local

Crie um arquivo .env na raiz com DATABASE_URL="file:./dev.db", AUTH_SECRET com uma chave aleatória forte, ADMIN_EMAIL e ADMIN_PASSWORD. Opcionalmente, configure OPENAI_API_KEY e OPENAI_MODEL para ativar respostas de IA no suporte.

Execute no PowerShell:

    npm install
    npx prisma generate
    npx prisma db push
    npm run db:seed
    npm run dev

Acesse http://localhost:3000. A conta inicial usa ADMIN_EMAIL e ADMIN_PASSWORD. O seed não substitui a senha de uma conta existente.

## Recursos

- Login e logout com cookie HttpOnly.
- Admin: criar usuários, alterar perfil/plano e suspender ou reativar contas.
- Tema claro/escuro com preferência salva no navegador.
- Produtos: usuários podem cadastrar seus próprios produtos.
- Licenças: gerar até 50 chaves por operação, com duração diária, semanal, mensal ou lifetime, opção de HWID obrigatório, listagem e exclusão.
- Validação online: POST /api/licenses/validate com key e, quando necessário, hwid. O primeiro HWID válido é vinculado à licença.
- Suporte em /support. Sem OPENAI_API_KEY usa a central de ajuda; com a chave, tenta responder via IA.
- Admin: /admin/site permite alterar nome público, aviso e e-mail de suporte. Alterações no código/layout exigem atualizar o repositório e fazer deploy.
- API de produtos: GET/POST /api/products. API de licenças: GET/POST/DELETE /api/licenses.

## Segurança e produção

Antes de publicar, use HTTPS, AUTH_SECRET forte, banco gerenciado para múltiplas instâncias, rate limiting em login e validação de licenças, proteção CSRF/origin, monitoramento e backups. Nunca exponha OPENAI_API_KEY no navegador. A validação de licença deve receber rate limiting antes de uso comercial em larga escala.
