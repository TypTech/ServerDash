# ServerDash Portainer Deployment Guide

## Quick Start

Follow these steps to deploy ServerDash using Portainer:

### 1. Create a New Stack

1. Navigate to **Stacks** in your Portainer dashboard
2. Click **+ Add stack**
3. Give your stack a name (e.g., `serverdash`)

### 2. Deploy the Stack

Choose one of these deployment methods:

#### Option A: Upload Repository (Recommended)
1. Select **Repository** as the build method
2. Enter the repository URL: `https://github.com/YourUsername/ServerDash`
3. Set the compose file path to: `docker-compose.yml`

#### Option B: Web Editor
1. Select **Web editor**
2. Copy and paste the contents of `docker-compose.yml` from this repository

### 3. Configure Environment Variables (Optional)

In the **Environment variables** section, you can override any of these default values:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `JWT_SECRET` | `CHANGE_THIS_TO_A_SECURE_RANDOM_STRING_GENERATE_WITH_OPENSSL` | **CHANGE THIS!** JWT secret for authentication |
| `POSTGRES_PASSWORD` | `ServerDash2024!` | PostgreSQL database password |
| `POSTGRES_USER` | `postgres` | PostgreSQL database username |
| `POSTGRES_DB` | `serverdash` | PostgreSQL database name |
| `WEB_EXTERNAL_PORT` | `3000` | External port for the web interface |
| `DB_EXTERNAL_PORT` | `5434` | External port for PostgreSQL |
| `ENABLE_REGISTRATION` | `false` | Allow new user registration |
| `DEBUG_MODE` | `false` | Enable debug logging |
| `UPTIME_CHECK_INTERVAL` | `60` | Uptime check interval in seconds |
| `SERVER_CHECK_INTERVAL` | `30` | Server monitoring interval in seconds |
| `NETWORK_CHECK_INTERVAL` | `45` | Network device check interval in seconds |

### 4. Security Configuration (IMPORTANT!)

**Before deploying to production:**

1. **Generate a secure JWT secret:**
   ```bash
   openssl rand -base64 64
   ```
   Add this as the `JWT_SECRET` environment variable

2. **Change the database password:**
   Set a strong password for `POSTGRES_PASSWORD`

3. **Configure allowed origins:**
   Set `ALLOWED_ORIGINS` to your domain (e.g., `https://yourdomain.com`)

### 5. Deploy

1. Click **Deploy the stack**
2. Wait for all services to start (this may take a few minutes for the first deployment)

### 6. Access Your Application

- **Web Interface:** `http://your-server-ip:3000` (or your configured port)
- **Default Admin Access:** Will be created automatically on first startup

## Volume Management

The stack creates a named volume `postgres_data` for database persistence. This data will persist across container restarts and updates.

## Updating

To update ServerDash:

1. Go to your stack in Portainer
2. Click **Editor**
3. Update the image tags or pull the latest `docker-compose.yml`
4. Click **Update the stack**

## Troubleshooting

### Common Issues

1. **Port conflicts:** Change `WEB_EXTERNAL_PORT` and `DB_EXTERNAL_PORT` if ports are already in use
2. **Database connection issues:** Ensure the database container is healthy before other services start
3. **Build failures:** Check Portainer logs for detailed error messages

### Logs

To view logs for any service:
1. Go to **Containers** in Portainer
2. Click on the container name
3. Click **Logs**

### Health Checks

The PostgreSQL database includes health checks. Other services will wait for the database to be healthy before starting.

## Security Best Practices

1. **Always change the default JWT secret**
2. **Use strong database passwords**
3. **Configure proper firewall rules**
4. **Regular backups of the postgres_data volume**
5. **Keep the application updated**

## Support

For issues and support:
- Check the main README.md for general documentation
- Review logs in Portainer for specific error messages
- Ensure all environment variables are properly configured 