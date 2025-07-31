# 📦 ServerDash Applications - Installation Guide

This guide ensures that all applications in the ServerDash store can be installed and deployed successfully.

## 🚀 What We've Fixed

### 1. **Application Configuration Issues**
- **Port Conflicts**: All applications now use unique ports to avoid conflicts
- **Secure Passwords**: All applications use strong, consistent passwords (`serverDash2024!`)
- **Volume Paths**: Applications use organized paths under `/opt/serverdash/`
- **Image Versions**: Updated to stable, reliable image versions

### 2. **Deployment System Improvements**
- **Docker Image Pre-pulling**: System automatically pulls required images before deployment
- **Directory Creation**: Automatically creates required host directories
- **Error Handling**: Better error messages and troubleshooting information
- **Port Conflict Resolution**: Automatically handles port conflicts
- **Container Cleanup**: Properly cleans up existing containers before redeployment

### 3. **System Preparation**
- **Setup Script**: Comprehensive setup script (`setup-applications.sh`)
- **Readiness Testing**: API endpoint to test deployment readiness
- **Resource Checking**: Validates system resources before deployment

## 🛠️ Quick Setup

### Option 1: Automated Setup (Recommended)
```bash
# Run the setup script
./setup-applications.sh
```

### Option 2: Manual Setup
```bash
# 1. Check Docker installation
docker --version
docker info

# 2. Create application directories
sudo mkdir -p /opt/serverdash/{postgresql,redis,nodejs,mongo,grafana,prometheus,apache,elasticsearch,nextcloud,portainer,traefik,mysql}
sudo chown -R $USER:$USER /opt/serverdash
chmod -R 755 /opt/serverdash

# 3. Pull essential images
docker pull nginx:alpine
docker pull postgres:15-alpine
docker pull redis:7-alpine
docker pull node:18-alpine
docker pull mongo:7
docker pull grafana/grafana:latest
docker pull prom/prometheus:latest
docker pull httpd:2.4-alpine
docker pull portainer/portainer-ce:latest
docker pull mysql:8.0
docker pull adminer:latest
docker pull phpmyadmin/phpmyadmin:latest
```

## 📋 Available Applications

### **Databases**
| Application | Port | Default Credentials |
|-------------|------|-------------------|
| PostgreSQL | 5433 | postgres / serverDash2024! |
| MySQL | 3307 | root / serverDash2024! |
| MongoDB | 27018 | admin / serverDash2024! |
| Redis | 6380 | Password: serverDash2024! |
| Elasticsearch | 9201, 9301 | No authentication |

### **Database Management**
| Application | Port | Access |
|-------------|------|--------|
| phpMyAdmin | 8085 | Web interface for MySQL |
| Adminer | 8086 | Universal database tool |

### **Web Servers**
| Application | Port | Purpose |
|-------------|------|---------|
| Nginx | 8080, 8443 | Web server & reverse proxy |
| Apache | 8081 | Traditional web server |
| Traefik | 8083, 8444, 8084 | Modern reverse proxy |

### **Monitoring**
| Application | Port | Default Credentials |
|-------------|------|-------------------|
| Grafana | 3002 | admin / serverDash2024! |
| Prometheus | 9091 | No authentication |

### **Development**
| Application | Port | Purpose |
|-------------|------|---------|
| Node.js | 3001 | JavaScript runtime |
| Portainer | 9001 | Docker management UI |

### **Productivity**
| Application | Port | Default Credentials |
|-------------|------|-------------------|
| Nextcloud | 8082 | admin / serverDash2024! |

## 🔧 Troubleshooting

### Common Issues

**1. Docker not installed/running**
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install docker.io
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in
```

**2. Permission denied errors**
```bash
# Fix Docker socket permissions
sudo chmod 666 /var/run/docker.sock
# Or restart Docker service
sudo systemctl restart docker
```

**3. Port conflicts**
- The system automatically resolves port conflicts
- Check for non-Docker services using ports: `sudo lsof -i :PORT`
- Stop conflicting services: `sudo systemctl stop SERVICE_NAME`

**4. Low disk space**
```bash
# Clean Docker system
docker system prune -a
# Remove unused images
docker image prune -a
```

**5. Memory issues**
```bash
# Check memory usage
free -h
# Close unnecessary applications
# Consider adding swap space
```

### Testing Deployment Readiness

Use the built-in test endpoint:
```bash
curl -X POST http://localhost:3000/api/applications/test-deployment
```

Or test manually:
```bash
# Test Docker
docker run --rm hello-world

# Test pulling an application image
docker pull nginx:alpine

# Check system resources
df -h /
free -h
```

## 📚 Application-Specific Notes

### **PostgreSQL**
- Data stored in: `/opt/serverdash/postgresql`
- Connect: `psql -h localhost -p 5433 -U postgres`

### **MySQL**
- Data stored in: `/opt/serverdash/mysql`
- Connect: `mysql -h localhost -P 3307 -u root -p`

### **MongoDB**
- Data stored in: `/opt/serverdash/mongo`
- Connect: `mongosh --port 27018 -u admin -p`

### **Redis**
- Data stored in: `/opt/serverdash/redis`
- Connect: `redis-cli -p 6380 -a serverDash2024!`

### **Grafana**
- Data stored in: `/opt/serverdash/grafana`
- Access: `http://localhost:3002`
- Login: admin / serverDash2024!

### **Nextcloud**
- Data stored in: `/opt/serverdash/nextcloud`
- Access: `http://localhost:8082`
- Login: admin / serverDash2024!

### **Portainer**
- Data stored in: `/opt/serverdash/portainer`
- Access: `http://localhost:9001`
- Set admin password on first access

## 🔒 Security Considerations

### **Default Passwords**
All applications use the default password `serverDash2024!`. **Change these passwords** after deployment:

1. **Access the application's web interface**
2. **Navigate to user/admin settings**
3. **Change the default password**
4. **Update any application configurations**

### **Network Security**
- Applications are exposed on custom ports
- Consider using a reverse proxy (Traefik/Nginx) for production
- Enable firewalls for external access
- Use SSL certificates for production deployments

### **Data Security**
- Application data is stored in `/opt/serverdash/`
- Regular backups are recommended
- Consider encryption for sensitive data

## 🆘 Support

If you encounter issues:

1. **Run the setup script**: `./setup-applications.sh`
2. **Check system readiness**: Test deployment endpoint
3. **Review Docker logs**: `docker logs container_name`
4. **Check application logs**: In the ServerDash interface
5. **Restart Docker service**: `sudo systemctl restart docker`

## 🔄 Updates

To update applications:
1. Pull new images: `docker pull image:version`
2. Remove old containers: Via ServerDash interface
3. Redeploy with new configurations

---

**🎉 You're all set!** All applications should now install and run successfully. Navigate to the Applications section in ServerDash to start deploying your applications. 