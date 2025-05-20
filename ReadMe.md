# Cloud-Native Todo App

This project is a cloud-native Todo application built with a microservices architecture using Node.js, Express, MongoDB, and Kubernetes. It includes user authentication, todo management, and a frontend gateway, all containerized and orchestrated via Docker Compose and Kubernetes.

## Project Structure

```
.
├── db-service/           # MongoDB connection helper
├── frontend-gateway/     # Frontend gateway (serves static files, API gateway)
├── todo-service/         # Todo microservice (CRUD for todos)
├── user-service/         # User microservice (signup/login/JWT)
├── scripts/              # Kubernetes deployment manifests
├── docker-compose.yaml   # Local development orchestration
└── .github/workflows/    # GitHub Actions CI/CD workflows
```

## Services

- **User Service** (`user-service/`): Handles user registration, login, and JWT authentication.
- **Todo Service** (`todo-service/`): Manages todo CRUD operations, protected by JWT.
- **Frontend Gateway** (`frontend-gateway/`): Serves the React/HTML frontend and proxies API requests to backend services.
- **DB Service** (`db-service/`): MongoDB helper (used for local development).

## Local Development

### Prerequisites

- [Docker](https://www.docker.com/)
- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)

### Running Locally

1. **Clone the repository:**
   ```sh
   git clone <repo-url>
   cd todo-app
   ```

2. **Start all services with Docker Compose:**
   ```sh
   docker-compose up --build
   ```

   - Frontend: [http://localhost:3002](http://localhost:3002)
   - User Service: [http://localhost:3000](http://localhost:3000)
   - Todo Service: [http://localhost:3001](http://localhost:3001)
   - MongoDB: [mongodb://localhost:27017](mongodb://localhost:27017)

3. **Run tests for each service:**
   ```sh
   cd user-service && npm test
   cd ../todo-service && npm test
   cd ../frontend-gateway && npm test
   ```

## Environment Variables

Each service uses environment variables for configuration. See the `.env` files in each service directory for examples.

- `MONGO_URI` or `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT signing
- `PORT`: Service port

## CI/CD

- Automated via GitHub Actions ([`.github/workflows/`](.github/workflows/))
- Builds, tests, and deploys Docker images to Google Cloud and GKE

## GitHub Workflows & Automation

This project uses GitHub Actions for continuous integration and deployment (CI/CD). The workflows are defined in the [`.github/workflows/`](.github/workflows/) directory and automate the following tasks:

- **Build:** Automatically builds Docker images for each microservice when changes are pushed.
- **Test:** Runs unit and integration tests for all services to ensure code quality.
- **Push to Registry:** Pushes built Docker images to Google Container Registry (GCR) or Artifact Registry.
- **Deploy to GKE:** Applies Kubernetes manifests to the Google Kubernetes Engine (GKE) cluster for automated deployments.

### How it Works

1. **On Push or Pull Request:**  
   When you push code or open a pull request, the workflow triggers:
   - Installs dependencies
   - Runs tests
   - Builds Docker images

2. **On Merge to Main:**  
   When changes are merged to the main branch:
   - Builds and pushes Docker images to the container registry
   - Updates the Kubernetes deployment in GKE using `kubectl apply`

3. **Secrets & Permissions:**  
   - GCP credentials and registry authentication are managed via GitHub repository secrets.
   - Ensure you add the necessary secrets (`GCP_PROJECT_ID`, `GKE_CLUSTER`, `GKE_ZONE`, `GCP_SA_KEY`, etc.) in your repository settings.

For more details, see the workflow YAML files in the `.github/workflows/` directory.

## GCP Manual Deployments

To manually deploy this application to Google Cloud Platform (GCP), follow these steps:

1. **Build and Push Docker Images:**
   - Build Docker images for each service and push them to Google Container Registry (GCR) or Artifact Registry.
   ```sh
   # Example for user-service
   docker build -t gcr.io/<your-gcp-project-id>/user-service:latest ./user-service
   docker push gcr.io/<your-gcp-project-id>/user-service:latest
   # Repeat for todo-service and frontend-gateway
   ```

2. **Update Kubernetes Manifests:**
   - Edit the deployment YAML files in the `scripts/` directory to use your pushed image URLs (replace `${IMAGE}` with your image path).

3. **Set Up GKE Cluster:**
   - Create a Kubernetes cluster in GCP using the Cloud Console or CLI.
   ```sh
   gcloud container clusters create todo-cluster --zone <your-zone>
   gcloud container clusters get-credentials todo-cluster --zone <your-zone>
   ```

4. **Create Namespace:**
   ```sh
   kubectl create namespace todo-app
   ```

5. **Apply Kubernetes Manifests:**
   ```sh
   kubectl apply -f scripts/
   ```

6. **Access the Application:**
   - Once the LoadBalancer service is provisioned, get the external IP:
   ```sh
   kubectl get svc -n todo-app
   ```
   - Access the frontend using the external IP on port 3002.

> **Note:** Ensure you have enabled the required GCP APIs (Container Registry, GKE, etc.) and have the necessary IAM permissions.

## Logging and GCP Log Access

Each microservice in this application outputs logs to standard output (stdout) and standard error (stderr). When running on Google Kubernetes Engine (GKE), these logs are automatically collected by Google Cloud Logging (formerly Stackdriver).

### Viewing Logs in GCP

1. **Google Cloud Console:**
   - Go to the [Google Cloud Console Logging page](https://console.cloud.google.com/logs/query).
   - Use the query builder to filter logs by Kubernetes namespace, pod, or service. For example:
     ```
     resource.type="k8s_container"
     resource.labels.namespace_name="todo-app"
     ```
   - You can further filter by service name using `resource.labels.container_name`.

2. **Using `kubectl` (for quick access):**
   - View logs for a specific pod:
     ```sh
     kubectl logs <pod-name> -n todo-app
     ```
   - To get the pod name:
     ```sh
     kubectl get pods -n todo-app
     ```

3. **Log Aggregation:**
   - All logs are available in Cloud Logging for searching, filtering, and alerting.
   - You can set up log-based metrics and alerts in the Cloud Console.

> **Tip:** For production, consider using structured logging (e.g., JSON) for better search and analysis in Cloud Logging.

## Monitoring and Alerts in GCP

Google Cloud Platform provides robust monitoring and alerting capabilities through Google Cloud Monitoring (formerly Stackdriver Monitoring). This allows you to track the health and performance of your Kubernetes cluster and microservices.

### Managed Prometheus in GCP

GCP offers a managed Prometheus solution that integrates seamlessly with Google Kubernetes Engine (GKE). Managed Prometheus allows you to collect, store, and query Prometheus metrics without managing your own Prometheus servers.

- **Enable Managed Prometheus:**  
  Enable the Managed Service for Prometheus in your GCP project and GKE cluster or run

  ```sh
  gcloud container clusters update [CLUSTER_NAME] \
  --region=[REGION] \
  --enable-managed-prometheus
  ```

- **Automatic Scraping:**  
  GKE Autopilot and Standard clusters can automatically scrape metrics from workloads annotated for Prometheus.
- **Prometheus Compatibility:**  
  Use standard Prometheus client libraries in your Node.js services to expose custom metrics at `/metrics` endpoints.
- **Query Metrics:**  
  Use the Cloud Monitoring Metrics Explorer or Prometheus Query Language (PromQL) to query metrics.
- **Dashboards:**  
  Create dashboards in Cloud Monitoring to visualize Prometheus metrics alongside other GCP metrics.

For more details, see the [GCP Managed Service for Prometheus documentation](https://cloud.google.com/stackdriver/docs/solutions/prometheus).

### Creating Alerts

- In Cloud Monitoring, navigate to **Alerting** and click **Create Policy**.
- Set conditions based on metrics (e.g., high CPU usage, pod restarts, HTTP error rates, or custom Prometheus metrics).
- Configure notification channels (email, SMS, Slack, etc.) to receive alerts.
- Save and enable your alerting policy.

> **Tip:** Combine Cloud Logging, Monitoring, and Managed Prometheus for comprehensive observability of your application.

