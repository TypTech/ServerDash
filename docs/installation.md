# Installation

The easiest way to install ServerDash is using Docker Compose. Follow these steps:

## Docker Compose Installation

1. Create a new directory for ServerDash:
   ```bash
   mkdir serverdash && cd serverdash
   ```

2. Create a `compose.yml` file with the following content:
   ```yaml
   services:
     web:
       image: haedlessdev/serverdash:latest
       ports:
         - "3000:3000"
       environment:
         JWT_SECRET: RANDOM_SECRET # Replace with a secure random string
         DATABASE_URL: "postgresql://postgres:postgres@db:5432/postgres"

     agent:
       image: haedlessdev/serverdash-agent:latest
       environment:
         DATABASE_URL: "postgresql://postgres:postgres@db:5432/postgres"
       depends_on:
         db:
           condition: service_healthy

     db:
       image: postgres:17
       restart: always
       environment:
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: postgres
         POSTGRES_DB: postgres
       volumes:
         - postgres_data:/var/lib/postgresql/data
       healthcheck:
         test: ["CMD-SHELL", "pg_isready -U postgres"]
         interval: 2s
         timeout: 2s
         retries: 10

   volumes:
     postgres_data:
   ```

3. Replace `RANDOM_SECRET` with a secure random string. You can generate one at [randomkeygen.com](https://randomkeygen.com/) or [uuidgenerator.net](https://www.uuidgenerator.net/) or [jwtsecret.com/generate](https://jwtsecret.com/generate)

3. Start ServerDash with the following command:
   ```bash
   docker compose up -d
   ```

4. Open your browser and navigate to `http://localhost:3000`

5. Log in with the default credentials (see below)

## Default Authentication

ServerDash comes with a default administrator account:

- **Email**: admin@example.com
- **Password**: admin

⚠️ **Important**: Change the default password immediately after your first login for security reasons.