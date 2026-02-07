# Backend env setup

1. Copy the example file:

```
cp .env.example .env
```

2. Fill in required values:
- DATABASE_URL
- JWT_SECRET
- JWT_REFRESH_SECRET
- EMAIL_USER / EMAIL_PASSWORD (if using email)

3. Start the server:

```
npm run dev
```

Notes:
- Do not commit .env to git.
- In Render, set these values in the Environment section.
