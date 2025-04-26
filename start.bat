@echo off
echo Creating necessary directories...
mkdir configs\fluentd\log 2>nul
mkdir configs\nginx 2>nul
mkdir configs\prometheus 2>nul
mkdir configs\grafana 2>nul

echo Stopping any existing containers...
docker-compose down

echo Starting Elasticsearch first...
docker-compose up -d elasticsearch

echo Waiting for Elasticsearch to initialize (30 seconds)...
timeout /t 30 /nobreak

echo Starting Fluentd...
docker-compose up -d fluentd

echo Waiting for Fluentd to initialize (10 seconds)...
timeout /t 10 /nobreak

echo Starting remaining services...
docker-compose up -d

echo System is starting up, check status with:
echo docker-compose ps