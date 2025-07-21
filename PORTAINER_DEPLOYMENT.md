# ServerDash Portainer Deployment Guide

## Quick Start

Follow these steps to deploy ServerDash using Portainer:

### 1. Create a New Stack

1. Navigate to **Stacks** in your Portainer dashboard
2. Click **+ Add stack**
3. Give your stack a name (e.g., `serverdash`)

### 2. Deploy the Stack

**IMPORTANT:** Use the Repository method for proper deployment:

#### Repository Deployment (REQUIRED)
1. Select **Repository** as the build method
2. Enter the repository URL: `https://github.com/YourUsername/ServerDash`
3. Set the compose file path to: `docker-compose.yml`
4. Leave other repository settings as default

> ⚠️ **Note:** Do NOT use the "Web editor" method as it won't have access to the required build context and source files.

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
2. Wait for all services to build and start (this may take 5-10 minutes for the first deployment)
3. Monitor the deployment in the **Containers** section

### 6. Access Your Application

- **Web Interface:** `http://your-server-ip:3000` (or your configured port)
- **Default Admin Access:** Will be created automatically on first startup

## Local Development

This same `docker-compose.yml` file also works for local development:

```bash
# Clone the repository
git clone https://github.com/YourUsername/ServerDash
cd ServerDash

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Deployment Architecture

The deployment includes:

- **Web Service:** Main Next.js application (builds from source)
- **Agent Service:** Go-based monitoring agent (builds from source)
- **Uptime Service:** Node.js uptime monitor (builds from source)
- **Database Service:** PostgreSQL 17 (uses official image)

## Volume Management

The stack creates a named volume `postgres_data` for database persistence. This data will persist across container restarts and updates.

## Updating

To update ServerDash:

1. Go to your stack in Portainer
2. Click **Editor**
3. Update the repository branch or commit if needed
4. Click **Update the stack**
5. Portainer will rebuild all services with the latest code

## Troubleshooting

### Common Issues

1. **Build failures:** 
   - Ensure you're using the Repository deployment method
   - Check that the repository URL is correct and accessible
   - Verify the compose file path is `docker-compose.yml`

2. **Port conflicts:** 
   - Change `WEB_EXTERNAL_PORT` and `DB_EXTERNAL_PORT` if ports are already in use

3. **Database connection issues:** 
   - Ensure the database container is healthy before other services start
   - Check database credentials match across all services

4. **Container startup failures:**
   - Allow sufficient time for builds (5-10 minutes)
   - Check individual container logs for specific errors

### Logs

To view logs for any service:
1. Go to **Containers** in Portainer
2. Click on the container name
3. Click **Logs**

### Health Checks

The PostgreSQL database includes health checks. Other services will wait for the database to be healthy before starting.

## Build Times

Expected build times for each service:
- **Web Service:** 3-5 minutes (Node.js build with Next.js)
- **Agent Service:** 1-2 minutes (Go compilation)
- **Uptime Service:** 1-2 minutes (Node.js dependencies)
- **Database Service:** 30 seconds (pre-built image)

## Security Best Practices

1. **Always change the default JWT secret**
2. **Use strong database passwords**
3. **Configure proper firewall rules**
4. **Regular backups of the postgres_data volume**
5. **Keep the application updated**
6. **Monitor container logs for suspicious activity**

## Alternative Deployment (Web Editor)

If you absolutely cannot use the Repository method, you can:

1. Manually build and push images to a registry first
2. Update the compose file to use your registry images instead of building
3. Copy the compose file content to the web editor

However, this is **not recommended** for most users.

## Support

For issues and support:
- Check the main README.md for general documentation
- Review logs in Portainer for specific error messages
- Ensure all environment variables are properly configured
- Verify your repository URL and access permissions 