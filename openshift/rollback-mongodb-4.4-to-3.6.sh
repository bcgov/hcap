#!/bin/bash

set -e

# Emergency rollback script
APP_NAME=${1}
BACKUP_NAME=${2}

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

if [ -z "$APP_NAME" ] || [ -z "$BACKUP_NAME" ]; then
    echo "Usage: $0 <APP_NAME> <BACKUP_NAME>"
    echo
    echo "Available backups:"
    oc get pvc -l app=${APP_NAME:-hcap} | grep backup || echo "No backups found"
    exit 1
fi

echo "========================================="
echo "🚨 EMERGENCY ROLLBACK TO MONGODB 3.6"
echo "========================================="
echo "This will:"
echo "1. Stop all applications"
echo "2. Replace MongoDB 4.4 with MongoDB 3.6"
echo "3. Restore from backup: $BACKUP_NAME"
echo "4. Restart applications"
echo
print_warning "⚠️  ALL CURRENT MONGODB 4.4 DATA WILL BE LOST!"
echo

read -p "Are you absolutely sure you want to proceed? Type 'ROLLBACK' to confirm: " -r
if [ "$REPLY" != "ROLLBACK" ]; then
    echo "Rollback cancelled"
    exit 0
fi

echo
print_warning "Starting emergency rollback..."

# Scale down everything
print_warning "Scaling down all services..."
oc scale deployment ${APP_NAME}-api --replicas=0 2>/dev/null || true
oc scale deployment ${APP_NAME}-client --replicas=0 2>/dev/null || true
oc scale statefulset ${APP_NAME}-mongo --replicas=0

# Wait for pods to terminate
print_warning "Waiting for pods to terminate..."
sleep 60

# Rollback MongoDB image to 3.6
print_warning "Rolling back to MongoDB 3.6..."
oc patch statefulset ${APP_NAME}-mongo -p '{
  "spec": {
    "template": {
      "spec": {
        "containers": [{
          "name": "mongo-container",
          "image": "registry.hub.docker.com/centos/mongodb-36-centos7",
          "command": null,
          "args": ["run-mongod-replication"]
        }]
      }
    }
  }
}'

# Scale up MongoDB 3.6
oc scale statefulset ${APP_NAME}-mongo --replicas=2
oc wait --for=condition=ready pod -l name=${APP_NAME}-mongo --timeout=600s

# Restore from backup using MongoDB 3.6 tools
print_warning "Restoring data from backup..."
oc run rollback-restore --image=registry.hub.docker.com/centos/mongodb-36-centos7 --rm -i --restart=Never --overrides='{
  "spec": {
    "containers": [{
      "name": "rollback-restore",
      "image": "registry.hub.docker.com/centos/mongodb-36-centos7", 
      "command": ["/bin/bash"],
      "args": ["-c", "mongorestore --host '${APP_NAME}'-mongodb:27017 --username admin --password $MONGODB_ADMIN_PASSWORD --authenticationDatabase admin --drop /backup/'${BACKUP_NAME}'"],
      "env": [{
        "name": "MONGODB_ADMIN_PASSWORD",
        "valueFrom": {
          "secretKeyRef": {
            "key": "admin-password",
            "name": "'${APP_NAME}'-mongodb"
          }
        }
      }],
      "volumeMounts": [{
        "name": "backup-storage",
        "mountPath": "/backup"
      }]
    }],
    "volumes": [{
      "name": "backup-storage",
      "persistentVolumeClaim": {
        "claimName": "'${APP_NAME}'-mongodb-backup-'${BACKUP_NAME}'"
      }
    }]
  }
}'

# Scale up applications
print_warning "Scaling up applications..."
oc scale deployment ${APP_NAME}-api --replicas=3
oc scale deployment ${APP_NAME}-client --replicas=2

oc wait --for=condition=ready pod -l app=${APP_NAME} --timeout=300s

print_success "✅ Emergency rollback to MongoDB 3.6 complete"
print_warning "⚠️  Please verify application functionality immediately"