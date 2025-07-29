import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const sampleApplications = [
  {
    name: "Nginx",
    description: "High-performance web server and reverse proxy server. Perfect for serving static content and load balancing.",
    icon: "🌐",
    category: "networking",
    dockerImage: "nginx",
    ports: JSON.stringify({ "80": "80", "443": "443" }),
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
    ports: JSON.stringify({ "5432": "5432" }),
    environment: JSON.stringify({ 
      "POSTGRES_DB": "myapp", 
      "POSTGRES_USER": "user", 
      "POSTGRES_PASSWORD": "password" 
    }),
    volumes: JSON.stringify({ "/var/lib/postgresql/data": "/var/lib/postgresql/data" }),
    featured: true,
    tags: "database, sql, postgresql",
    version: "15",
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
    ports: JSON.stringify({ "6379": "6379" }),
    environment: JSON.stringify({ "REDIS_PASSWORD": "your_password" }),
    volumes: JSON.stringify({ "/data": "/data" }),
    commands: JSON.stringify({ "args": "redis-server --requirepass your_password" }),
    featured: true,
    tags: "cache, database, in-memory, nosql",
    version: "alpine",
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
    ports: JSON.stringify({ "3000": "3000" }),
    environment: JSON.stringify({ "NODE_ENV": "production" }),
    volumes: JSON.stringify({ "/app": "/usr/src/app" }),
    commands: JSON.stringify({ "args": "node index.js" }),
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
    ports: JSON.stringify({ "27017": "27017" }),
    environment: JSON.stringify({ 
      "MONGO_INITDB_ROOT_USERNAME": "admin", 
      "MONGO_INITDB_ROOT_PASSWORD": "password" 
    }),
    volumes: JSON.stringify({ "/data/db": "/data/db" }),
    tags: "database, nosql, mongodb, document",
    version: "latest",
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
    ports: JSON.stringify({ "3000": "3000" }),
    environment: JSON.stringify({ 
      "GF_SECURITY_ADMIN_PASSWORD": "admin",
      "GF_SECURITY_ADMIN_USER": "admin"
    }),
    volumes: JSON.stringify({ 
      "/var/lib/grafana": "/var/lib/grafana",
      "/etc/grafana": "/etc/grafana"
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
    ports: JSON.stringify({ "9090": "9090" }),
    volumes: JSON.stringify({ 
      "/prometheus": "/prometheus",
      "/etc/prometheus": "/etc/prometheus"
    }),
    commands: JSON.stringify({ 
      "args": "--config.file=/etc/prometheus/prometheus.yml --storage.tsdb.path=/prometheus"
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
    ports: JSON.stringify({ "80": "80" }),
    volumes: JSON.stringify({ "/usr/local/apache2/htdocs": "/usr/local/apache2/htdocs" }),
    tags: "web server, apache, http",
    version: "alpine",
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
    ports: JSON.stringify({ "9200": "9200", "9300": "9300" }),
    environment: JSON.stringify({ 
      "discovery.type": "single-node",
      "ES_JAVA_OPTS": "-Xms512m -Xmx512m"
    }),
    volumes: JSON.stringify({ "/usr/share/elasticsearch/data": "/usr/share/elasticsearch/data" }),
    tags: "search, analytics, elasticsearch, lucene",
    version: "8.11.0",
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
    ports: JSON.stringify({ "80": "80" }),
    environment: JSON.stringify({ 
      "NEXTCLOUD_ADMIN_USER": "admin",
      "NEXTCLOUD_ADMIN_PASSWORD": "admin123"
    }),
    volumes: JSON.stringify({ 
      "/var/www/html": "/var/www/html",
      "/var/www/html/data": "/var/www/html/data"
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
    ports: JSON.stringify({ "9000": "9000" }),
    volumes: JSON.stringify({ 
      "/var/run/docker.sock": "/var/run/docker.sock",
      "portainer_data": "/data"
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
    ports: JSON.stringify({ "80": "80", "443": "443", "8080": "8080" }),
    volumes: JSON.stringify({ 
      "/var/run/docker.sock": "/var/run/docker.sock",
      "/etc/traefik": "/etc/traefik"
    }),
    commands: JSON.stringify({ 
      "args": "--api.insecure=true --providers.docker=true --providers.docker.exposedbydefault=false"
    }),
    tags: "reverse proxy, load balancer, ssl, traefik",
    version: "latest",
    author: "Traefik Labs",
    website: "https://traefik.io",
    documentation: "https://doc.traefik.io/traefik/"
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