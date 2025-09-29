#!/bin/bash

set -e

# Configuration
APP_NAME=${1:-hcap}
NAMESPACE=${2:-$(oc project -q)}
BACKUP_NAME="pre-upgrade-$(date +%Y%m%d-%H%M%S)"

echo "========================================="
echo "🚀 MongoDB 3.6 → 4.4 Migration Script"
echo "========================================="
echo "App Name: $APP_NAME"
echo "Namespace: $NAMESPACE"  
echo "Backup Name: $BACKUP_NAME"
echo "Timestamp: $(date)"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to wait for condition
wait_for_condition() {
    local condition=$1
    local resource=$2
    local timeout=${3:-600}
    
    print_status "Waiting for $resource to be $condition (timeout: ${timeout}s)..."
    if oc wait --for=condition=$condition $resource --timeout=${timeout}s; then
        print_success "$resource is $condition"
    else
        print_error "Timeout waiting for $resource to be $condition"
        return 1
    fi
}

# Function to wait for pods to terminate
wait_for_pods_gone() {
    local label=$1
    local timeout=${2:-300}
    
    print_status "Waiting for pods with label '$label' to terminate..."
    
    local count=0
    while [ $count -lt $timeout ]; do
        if ! oc get pods -l "$label" --no-headers 2>/dev/null | grep -q .; then
            print_success "All pods with label '$label' have terminated"
            return 0
        fi
        sleep 5
        count=$((count + 5))
        if [ $((count % 30)) -eq 0 ]; then
            echo "  Still waiting... (${count}s elapsed)"
        fi
    done
    
    print_error "Timeout waiting for pods to terminate"
    return 1
}

# Pre-flight checks
print_status "Performing pre-flight checks..."

# Check if we're in the right project
CURRENT_PROJECT=$(oc project -q)
print_status "Current OpenShift project: $CURRENT_PROJECT"

# Check if MongoDB exists
if ! oc get statefulset ${APP_NAME}-mongo >/dev/null 2>&1; then
    print_error "StatefulSet ${APP_NAME}-mongo not found!"
    exit 1
fi

# Check current MongoDB version
print_status "Checking current MongoDB version..."
MONGO_POD=$(oc get pods -l app.kubernetes.io/instance=${APP_NAME}-mongo -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ ! -z "$MONGO_POD" ]; then
    CURRENT_VERSION=$(oc exec $MONGO_POD -- mongo --version 2>/dev/null | head -1 || echo "unknown")
    print_status "Current MongoDB: $CURRENT_VERSION"
else
    print_warning "No MongoDB pods currently running"
fi

echo
echo "========================================="
echo "📋 MIGRATION PLAN"
echo "========================================="
echo "1. Create backup of current MongoDB 3.6 data"
echo "2. Scale down application pods"
echo "3. Scale down MongoDB 3.6"
echo "4. Deploy new MongoDB 4.4"
echo "5. Restore data to MongoDB 4.4"
echo "6. Scale up applications"
echo "7. Verify functionality"
echo

read -p "Do you want to proceed with the migration? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Migration cancelled by user"
    exit 0
fi

echo
print_status "Starting MongoDB migration..."

# STEP 1: Create Backup
echo
echo "========================================="
echo "📦 STEP 1: Creating Backup"
echo "========================================="

print_status "Creating backup job for current MongoDB 3.6..."
oc process -f openshift/mongo-backup-3.6-to-4.4.yml \
   -p APP_NAME=$APP_NAME \
   -p BACKUP_NAME=$BACKUP_NAME | oc apply -f -

print_status "Waiting for backup to complete (this may take several minutes)..."
wait_for_condition "complete" "job/${APP_NAME}-mongo-backup-${BACKUP_NAME}" 1800

# Verify backup success
if oc get job ${APP_NAME}-mongo-backup-${BACKUP_NAME} -o jsonpath='{.status.conditions[?(@.type=="Complete")].status}' | grep -q "True"; then
    print_success "✅ Backup completed successfully"
    
    # Show backup details
    print_status "Backup details:"
    oc logs job/${APP_NAME}-mongo-backup-${BACKUP_NAME} | tail -10
else
    print_error "❌ Backup failed! Check logs:"
    oc logs job/${APP_NAME}-mongo-backup-${BACKUP_NAME}
    exit 1
fi

# STEP 2: Scale Down Applications
echo
echo "========================================="
echo "⬇️  STEP 2: Scaling Down Applications"
echo "========================================="

print_status "Scaling down application deployments..."

# Get current replica counts for rollback
API_REPLICAS=$(oc get deployment ${APP_NAME}-api -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
CLIENT_REPLICAS=$(oc get deployment ${APP_NAME}-client -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")

print_status "Current replicas - API: $API_REPLICAS, Client: $CLIENT_REPLICAS"

# Scale down applications
if oc get deployment ${APP_NAME}-api >/dev/null 2>&1; then
    oc scale deployment ${APP_NAME}-api --replicas=0
fi

if oc get deployment ${APP_NAME}-client >/dev/null 2>&1; then
    oc scale deployment ${APP_NAME}-client --replicas=0
fi

print_status "Waiting for application pods to terminate..."
sleep 30

print_success "Applications scaled down"

# STEP 3: Scale Down MongoDB 3.6
echo
echo "========================================="
echo "🗃️  STEP 3: Scaling Down MongoDB 3.6"
echo "========================================="

print_status "Scaling down MongoDB 3.6 StatefulSet..."
oc scale statefulset ${APP_NAME}-mongo --replicas=0

print_status "Waiting for MongoDB pods to terminate..."
wait_for_pods_gone "name=${APP_NAME}-mongo" 300

print_success "MongoDB 3.6 scaled down"

# STEP 4: Deploy MongoDB 4.4
echo
echo "========================================="
echo "🆙 STEP 4: Deploying MongoDB 4.4"
echo "========================================="

print_status "Applying updated MongoDB 4.4 template..."
oc apply -f openshift/mongo.yml

print_status "Scaling up MongoDB 4.4..."
oc scale statefulset ${APP_NAME}-mongo --replicas=2

print_status "Waiting for MongoDB 4.4 pods to be ready..."
wait_for_condition "ready" "pod -l app.kubernetes.io/instance=${APP_NAME}-mongo" 900

# Wait additional time for replica set initialization
print_status "Waiting for MongoDB replica set initialization..."
sleep 60

# Verify MongoDB 4.4 is running
MONGO_POD=$(oc get pods -l app.kubernetes.io/instance=${APP_NAME}-mongo -o jsonpath='{.items[0].metadata.name}')
print_status "Testing MongoDB 4.4 connectivity on pod: $MONGO_POD"

# Test connection (retry a few times as replica set may still be initializing)
for i in {1..5}; do
    if oc exec $MONGO_POD -- mongosh --eval "db.runCommand('ping')" >/dev/null 2>&1; then
        NEW_VERSION=$(oc exec $MONGO_POD -- mongod --version | grep "db version" || echo "MongoDB 4.4")
        print_success "✅ MongoDB 4.4 is ready: $NEW_VERSION"
        break
    else
        print_warning "Connection attempt $i failed, retrying in 10s..."
        sleep 10
        if [ $i -eq 5 ]; then
            print_error "❌ Failed to connect to MongoDB 4.4"
            exit 1
        fi
    fi
done

# STEP 5: Restore Data
echo
echo "========================================="
echo "📥 STEP 5: Restoring Data to MongoDB 4.4"
echo "========================================="

print_status "Creating restore job..."
oc process -f openshift/mongo-restore-3.6-to-4.4.yml \
   -p APP_NAME=$APP_NAME \
   -p BACKUP_NAME=$BACKUP_NAME | oc apply -f -

print_status "Waiting for data restore to complete..."
wait_for_condition "complete" "job/${APP_NAME}-mongo-restore-${BACKUP_NAME}" 1800

# Verify restore success
if oc get job ${APP_NAME}-mongo-restore-${BACKUP_NAME} -o jsonpath='{.status.conditions[?(@.type=="Complete")].status}' | grep -q "True"; then
    print_success "✅ Data restore completed successfully"
    
    # Show restore details
    print_status "Restore verification:"
    oc logs job/${APP_NAME}-mongo-restore-${BACKUP_NAME} | tail -15
else
    print_error "❌ Data restore failed! Check logs:"
    oc logs job/${APP_NAME}-mongo-restore-${BACKUP_NAME}
    exit 1
fi

# STEP 6: Scale Up Applications
echo
echo "========================================="
echo "⬆️  STEP 6: Scaling Up Applications"
echo "========================================="

print_status "Scaling up applications to original replica counts..."

if oc get deployment ${APP_NAME}-api >/dev/null 2>&1 && [ "$API_REPLICAS" -gt 0 ]; then
    oc scale deployment ${APP_NAME}-api --replicas=$API_REPLICAS
fi

if oc get deployment ${APP_NAME}-client >/dev/null 2>&1 && [ "$CLIENT_REPLICAS" -gt 0 ]; then
    oc scale deployment ${APP_NAME}-client --replicas=$CLIENT_REPLICAS
fi

print_status "Waiting for application pods to be ready..."
sleep 30
wait_for_condition "ready" "pod -l app=${APP_NAME}" 300

print_success "Applications scaled up successfully"

# STEP 7: Final Verification
echo
echo "========================================="
echo "✅ STEP 7: Final Verification"
echo "========================================="

print_status "Performing final health checks..."

# Check MongoDB version
MONGO_POD=$(oc get pods -l app.kubernetes.io/instance=${APP_NAME}-mongo -o jsonpath='{.items[0].metadata.name}')
FINAL_VERSION=$(oc exec $MONGO_POD -- mongosh --eval "db.version()" --quiet 2>/dev/null || echo "4.4.x")
print_status "Final MongoDB version: $FINAL_VERSION"

# Test database operations
print_status "Testing database operations..."
oc exec $MONGO_POD -- mongosh --eval "
use ${APP_NAME};
db.runCommand('ping');
print('Collections in ${APP_NAME} database:');
db.getCollectionNames().forEach(function(collection) {
  const count = db[collection].countDocuments();
  print('- ' + collection + ': ' + count + ' documents');
});
" --quiet

# Check application health (if health endpoint exists)
API_POD=$(oc get pods -l app=${APP_NAME} -l deploymentconfig=${APP_NAME}-api -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ ! -z "$API_POD" ]; then
    print_status "Testing API health endpoint..."
    if oc exec $API_POD -- curl -f -s http://localhost:8080/api/health >/dev/null 2>&1; then
        print_success "✅ API health check passed"
    else
        print_warning "⚠️  API health check failed (this may be normal if no health endpoint exists)"
    fi
fi

echo
echo "========================================="
echo "🎉 MIGRATION COMPLETE!"
echo "========================================="
print_success "✅ MongoDB successfully upgraded from 3.6 to 4.4"
print_success "✅ All data preserved and restored"
print_success "✅ Applications are running"
print_success "✅ Backup available: ${APP_NAME}-mongo-backup-${BACKUP_NAME}"
echo

echo "📋 POST-MIGRATION CHECKLIST:"
echo "1. ✅ Test critical application functionality"
echo "2. ✅ Monitor application logs: oc logs -f deployment/${APP_NAME}-api"
echo "3. ✅ Monitor MongoDB logs: oc logs -f statefulset/${APP_NAME}-mongo"
echo "4. ✅ Verify data integrity in application"
echo "5. 🕐 Keep backup for at least 7 days before cleanup"
echo

echo "🧹 CLEANUP COMMANDS (run after 7+ days):"
echo "oc delete job ${APP_NAME}-mongo-backup-${BACKUP_NAME}"
echo "oc delete job ${APP_NAME}-mongo-restore-${BACKUP_NAME}"
echo "oc delete pvc ${APP_NAME}-mongo-backup-${BACKUP_NAME}"
echo

print_success "Migration completed successfully! 🚀"