import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const sampleApplications = [
  {
    name: "Nginx",
    description: "High-performance web server and reverse proxy server. Perfect for serving static content and load balancing.",
    icon: "🌐",
    category: "networking",
    dockerImage: "nginx",
    ports: JSON.stringify({ "8080": "80", "8443": "443" }),
    environment: JSON.stringify({ "NGINX_HOST": "localhost" }),
    volumes: JSON.stringify({ "/var/www/html": "/usr/share/nginx/html" }),
    commands: JSON.stringify({ "args": "-g 'daemon off;'" }),
    featured: true,
    tags: "web server, reverse proxy, load balancer",
    version: "alpine",
    author: "Nginx Team",
    website: "https://nginx.org",
    documentation: "https://nginx.org/en/docs/"
  },
  {
    name: "PostgreSQL",
    description: "Advanced open-source relational database system with strong reputation for reliability and data integrity.",
    icon: "🐘",
    category: "database",
    dockerImage: "postgres",
    ports: JSON.stringify({ "5433": "5432" }),
    environment: JSON.stringify({ 
      "POSTGRES_DB": "myapp", 
      "POSTGRES_USER": "postgres", 
      "POSTGRES_PASSWORD": "serverDash2024!" 
    }),
    volumes: JSON.stringify({ "/var/lib/postgresql/serverdash": "/var/lib/postgresql/data" }),
    featured: true,
    tags: "database, sql, postgresql",
    version: "15-alpine",
    author: "PostgreSQL Global Development Group",
    website: "https://postgresql.org",
    documentation: "https://www.postgresql.org/docs/"
  },
  {
    name: "Redis",
    description: "In-memory data structure store, used as database, cache, and message broker with high performance.",
    icon: "🔴",
    category: "database",
    dockerImage: "redis",
    ports: JSON.stringify({ "6380": "6379" }),
    environment: JSON.stringify({ "REDIS_PASSWORD": "serverDash2024!" }),
    volumes: JSON.stringify({ "/opt/serverdash/redis": "/data" }),
    commands: JSON.stringify({ "args": "redis-server --requirepass serverDash2024!" }),
    featured: true,
    tags: "cache, database, in-memory, nosql",
    version: "7-alpine",
    author: "Redis Team",
    website: "https://redis.io",
    documentation: "https://redis.io/documentation"
  },
  {
    name: "Node.js",
    description: "JavaScript runtime built on Chrome's V8 engine. Perfect for building scalable network applications.",
    icon: "🟢",
    category: "development",
    dockerImage: "node",
    ports: JSON.stringify({ "3001": "3000" }),
    environment: JSON.stringify({ "NODE_ENV": "production" }),
    volumes: JSON.stringify({ "/opt/serverdash/nodejs": "/usr/src/app" }),
    commands: JSON.stringify({ "args": "node -e 'console.log(\"Node.js container is running!\"); setInterval(() => {}, 1000)'" }),
    tags: "javascript, nodejs, runtime, development",
    version: "18-alpine",
    author: "Node.js Foundation",
    website: "https://nodejs.org",
    documentation: "https://nodejs.org/en/docs/"
  },
  {
    name: "MongoDB",
    description: "Document-oriented NoSQL database designed for ease of development and scaling with flexible schemas.",
    icon: "🍃",
    category: "database",
    dockerImage: "mongo",
    ports: JSON.stringify({ "27018": "27017" }),
    environment: JSON.stringify({ 
      "MONGO_INITDB_ROOT_USERNAME": "admin", 
      "MONGO_INITDB_ROOT_PASSWORD": "serverDash2024!" 
    }),
    volumes: JSON.stringify({ "/opt/serverdash/mongo": "/data/db" }),
    tags: "database, nosql, mongodb, document",
    version: "7",
    author: "MongoDB Inc.",
    website: "https://mongodb.com",
    documentation: "https://docs.mongodb.com/"
  },
  {
    name: "Grafana",
    description: "Open source analytics and interactive visualization web application for monitoring and observability.",
    icon: "📊",
    category: "monitoring",
    dockerImage: "grafana/grafana",
    ports: JSON.stringify({ "3002": "3000" }),
    environment: JSON.stringify({ 
      "GF_SECURITY_ADMIN_PASSWORD": "serverDash2024!",
      "GF_SECURITY_ADMIN_USER": "admin"
    }),
    volumes: JSON.stringify({ 
      "/opt/serverdash/grafana": "/var/lib/grafana"
    }),
    featured: true,
    tags: "monitoring, visualization, dashboard, metrics",
    version: "latest",
    author: "Grafana Labs",
    website: "https://grafana.com",
    documentation: "https://grafana.com/docs/"
  },
  {
    name: "Prometheus",
    description: "Open-source monitoring and alerting toolkit designed for reliability and scalability.",
    icon: "🔥",
    category: "monitoring",
    dockerImage: "prom/prometheus",
    ports: JSON.stringify({ "9091": "9090" }),
    volumes: JSON.stringify({ 
      "/opt/serverdash/prometheus": "/prometheus"
    }),
    commands: JSON.stringify({ 
      "args": "--config.file=/etc/prometheus/prometheus.yml --storage.tsdb.path=/prometheus --web.console.libraries=/etc/prometheus/console_libraries --web.console.templates=/etc/prometheus/consoles --web.enable-lifecycle"
    }),
    tags: "monitoring, metrics, alerting, prometheus",
    version: "latest",
    author: "Prometheus Team",
    website: "https://prometheus.io",
    documentation: "https://prometheus.io/docs/"
  },
  {
    name: "Apache HTTP Server",
    description: "Reliable, secure and efficient web server software used by millions of websites worldwide.",
    icon: "🪶",
    category: "networking",
    dockerImage: "httpd",
    ports: JSON.stringify({ "8081": "80" }),
    volumes: JSON.stringify({ "/opt/serverdash/apache": "/usr/local/apache2/htdocs" }),
    tags: "web server, apache, http",
    version: "2.4-alpine",
    author: "Apache Software Foundation",
    website: "https://httpd.apache.org",
    documentation: "https://httpd.apache.org/docs/"
  },
  {
    name: "Elasticsearch",
    description: "Distributed search and analytics engine built on Apache Lucene for full-text search capabilities.",
    icon: "🔍",
    category: "database",
    dockerImage: "elasticsearch",
    ports: JSON.stringify({ "9201": "9200", "9301": "9300" }),
    environment: JSON.stringify({ 
      "discovery.type": "single-node",
      "ES_JAVA_OPTS": "-Xms512m -Xmx512m",
      "xpack.security.enabled": "false"
    }),
    volumes: JSON.stringify({ "/opt/serverdash/elasticsearch": "/usr/share/elasticsearch/data" }),
    tags: "search, analytics, elasticsearch, lucene",
    version: "8.11.3",
    author: "Elastic N.V.",
    website: "https://elastic.co",
    documentation: "https://www.elastic.co/guide/"
  },
  {
    name: "Nextcloud",
    description: "Self-hosted productivity platform that keeps you in control and protects your data.",
    icon: "☁️",
    category: "productivity",
    dockerImage: "nextcloud",
    ports: JSON.stringify({ "8082": "80" }),
    environment: JSON.stringify({ 
      "NEXTCLOUD_ADMIN_USER": "admin",
      "NEXTCLOUD_ADMIN_PASSWORD": "serverDash2024!",
      "NEXTCLOUD_TRUSTED_DOMAINS": "localhost"
    }),
    volumes: JSON.stringify({ 
      "/opt/serverdash/nextcloud": "/var/www/html"
    }),
    featured: true,
    tags: "cloud, storage, collaboration, self-hosted",
    version: "latest",
    author: "Nextcloud GmbH",
    website: "https://nextcloud.com",
    documentation: "https://docs.nextcloud.com/"
  },
  {
    name: "Portainer",
    description: "Lightweight management UI for Docker environments. Simplify container management with a web interface.",
    icon: "🐳",
    category: "development",
    dockerImage: "portainer/portainer-ce",
    ports: JSON.stringify({ "9001": "9000" }),
    volumes: JSON.stringify({ 
      "/var/run/docker.sock": "/var/run/docker.sock",
      "/opt/serverdash/portainer": "/data"
    }),
    featured: true,
    tags: "docker, management, ui, containers",
    version: "latest",
    author: "Portainer.io",
    website: "https://portainer.io",
    documentation: "https://docs.portainer.io/"
  },
  {
    name: "Traefik",
    description: "Modern HTTP reverse proxy and load balancer with automatic service discovery and SSL termination.",
    icon: "🚪",
    category: "networking",
    dockerImage: "traefik",
    ports: JSON.stringify({ "8083": "80", "8444": "443", "8084": "8080" }),
    volumes: JSON.stringify({ 
      "/var/run/docker.sock": "/var/run/docker.sock",
      "/opt/serverdash/traefik": "/etc/traefik"
    }),
    commands: JSON.stringify({ 
      "args": "--api.insecure=true --providers.docker=true --providers.docker.exposedbydefault=false --entrypoints.web.address=:80 --entrypoints.websecure.address=:443"
    }),
    tags: "reverse proxy, load balancer, ssl, traefik",
    version: "latest",
    author: "Traefik Labs",
    website: "https://traefik.io",
    documentation: "https://doc.traefik.io/traefik/"
  },
  {
    name: "phpMyAdmin",
    description: "Web-based administration tool for MySQL and MariaDB databases with intuitive interface.",
    icon: "🗄️",
    category: "database",
    dockerImage: "phpmyadmin/phpmyadmin",
    ports: JSON.stringify({ "8085": "80" }),
    environment: JSON.stringify({
      "PMA_ARBITRARY": "1",
      "PMA_HOST": "localhost",
      "PMA_PORT": "3306"
    }),
    tags: "mysql, database, admin, web interface",
    version: "latest",
    author: "phpMyAdmin Team",
    website: "https://www.phpmyadmin.net",
    documentation: "https://docs.phpmyadmin.net/"
  },
  {
    name: "MySQL",
    description: "Popular open-source relational database management system known for speed and reliability.",
    icon: "🐬",
    category: "database",
    dockerImage: "mysql",
    ports: JSON.stringify({ "3307": "3306" }),
    environment: JSON.stringify({
      "MYSQL_ROOT_PASSWORD": "serverDash2024!",
      "MYSQL_DATABASE": "serverdash",
      "MYSQL_USER": "serverdash",
      "MYSQL_PASSWORD": "serverDash2024!"
    }),
    volumes: JSON.stringify({ "/opt/serverdash/mysql": "/var/lib/mysql" }),
    tags: "database, sql, mysql, relational",
    version: "8.0",
    author: "Oracle Corporation",
    website: "https://mysql.com",
    documentation: "https://dev.mysql.com/doc/"
  },
  {
    name: "Adminer",
    description: "Full-featured database management tool written in PHP. Single file, supports multiple databases.",
    icon: "🔧",
    category: "database",
    dockerImage: "adminer",
    ports: JSON.stringify({ "8086": "8080" }),
    environment: JSON.stringify({
      "ADMINER_DEFAULT_SERVER": "localhost"
    }),
    tags: "database, admin, mysql, postgresql, sqlite",
    version: "latest",
    author: "Jakub Vrána",
    website: "https://www.adminer.org",
    documentation: "https://www.adminer.org/en/"
  }
]

export async function POST(request: NextRequest) {
  try {
    // Clear existing applications
    await (prisma as any).application.deleteMany({})
    
    // Insert sample applications
    const createdApplications = []
    for (const app of sampleApplications) {
      const created = await (prisma as any).application.create({ data: app })
      createdApplications.push(created)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${createdApplications.length} applications`,
      applications: createdApplications
    })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to seed applications' 
      },
      { status: 500 }
    )
  }
} 