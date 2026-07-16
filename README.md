# Fintech Banking API — Cloud Deployment

A containerized FastAPI banking service deployed on AWS EKS, backed by RDS Postgres, with a React frontend.

## Architecture

```
Internet
   │
   ▼
AWS Load Balancer (ELB)
   │
   ▼
EKS Cluster (2 worker nodes, t3.micro)
   │
   ├── Pod 1 — fintech-banking-api (FastAPI)
   └── Pod 2 — fintech-banking-api (FastAPI)
         │
         ▼
   RDS PostgreSQL (db.t4g.micro, private subnet, not publicly accessible)
```

## Stack

- **API:** FastAPI (Python), JWT auth, SQLAlchemy ORM
- **Container registry:** Amazon ECR
- **Orchestration:** Amazon EKS (managed Kubernetes), provisioned via `eksctl`
- **Database:** Amazon RDS for PostgreSQL — separate from the app layer, not run as a pod
- **Frontend:** React (Vite), calling the API directly via a Kubernetes LoadBalancer Service

## Why these choices

**RDS instead of a database pod.** Kubernetes pods are ephemeral by design — they get rescheduled and restarted routinely. Running Postgres as a pod without persistent storage config means data loss on every restart. RDS keeps the data layer separate, managed, and durable, independent of what happens to the application pods.

**RDS is not publicly accessible.** The database only accepts connections from the EKS cluster's security group, on port 5432. It has no route to the public internet. This is enforced at the network layer (AWS Security Groups), not just at the application layer.

**Kubernetes Secret for credentials.** The database connection string is stored as a Kubernetes Secret, injected into the pod as an environment variable at runtime — never hardcoded in the Deployment manifest or committed to version control.

**2 replicas.** The Deployment runs 2 pods of the API so that if one is unhealthy or restarting, the other continues serving traffic. Conceptually the same pattern as an EC2 Auto Scaling Group, applied at the container level.

## Known simplification (documented, not hidden)

The app currently creates its database tables via SQLAlchemy's `Base.metadata.create_all()` on startup, rather than using a migration tool like Alembic. This is acceptable for a personal/learning project but is not how schema changes are managed in production systems — `create_all` has no history and no rollback path. A production version of this project would use versioned migrations instead.

## Deployment steps (summary)

1. Build Docker image, push to ECR
2. Provision EKS cluster (`eksctl`)
3. Provision RDS Postgres instance in the same VPC as the cluster
4. Create a DB subnet group and restrict inbound access to the EKS security group only
5. Create Kubernetes Secret holding `DATABASE_URL`
6. Apply Deployment (2 replicas, pulling from ECR, using the Secret)
7. Apply Service (`type: LoadBalancer`) to expose the API publicly
8. Point the React frontend at the Load Balancer's DNS name

## Cost management

EKS control plane, worker nodes, and the Load Balancer all bill while running. This project is torn down (`eksctl delete cluster`, RDS stopped) between working sessions to avoid idle cost — not left running continuously.
