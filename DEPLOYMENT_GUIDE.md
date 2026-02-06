# Deployment Guide for AWS EC2

## Prerequisites
1.  **AWS Account**: Access to launch EC2 instances.
2.  **GitHub Repository**: Your code must be pushed to GitHub.
3.  **SSH Client**: Terminal (Mac/Linux) or PuTTY (Windows).

---

## Part 1: AWS EC2 Setup

1.  **Launch Instance**:
    *   Go to AWS Console > EC2 > Launch Instance.
    *   **Name**: `CRM-Server`
    *   **OS Image**: `Ubuntu Server 22.04 LTS (HVM)`
    *   **Instance Type**: `t3.small` (Recommended for building Docker images. `t2.micro` is free tier but often crashes during builds due to low RAM).
    *   **Key Pair**: Create a new key pair (e.g., `crm-key.pem`), download it, and **keep it safe**.
    *   **Security Group**: Allow the following ports:
        *   `SSD (22)` - My IP (for remote access)
        *   `HTTP (80)` - Anywhere (for frontend)
        *   `HTTPS (443)` - Anywhere (optional, for SSL)
        *   `Custom TCP (8000)` - Anywhere (optional, if you want direct API access context)

2.  **Connect to Instance**:
    *   Open your terminal (or Git Bash on Windows).
    *   Move the key to a secure location: `mv ~/Downloads/crm-key.pem ~/.ssh/`
    *   Set permissions (Linux/Mac): `chmod 400 ~/.ssh/crm-key.pem`
    *   Connect: `ssh -i ~/.ssh/crm-key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>`

---

## Part 2: Server Configuration (One-Time)

Run these commands inside your EC2 server to install Docker and Git.

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER && newgrp docker

# Verify installation
docker --version
docker compose version
```

---

## Part 3: GitHub Actions (CI/CD)

This pipeline will automatically deploy your code whenever you push to the `main` branch.

### 1. Add Secrets to GitHub
Go to your **GitHub Repo > Settings > Secrets and variables > Actions > New repository secret**. Add the following:

| Secret Name | Value |
| :--- | :--- |
| `EC2_HOST` | The Public IPv4 address of your EC2 instance. |
| `EC2_USER` | `ubuntu` |
| `EC2_KEY` | The content of your `.pem` key file (Open file with Notepad, copy ALL text including BEGIN/END headers). |
| `ENV_FILE` | The full content of your `backend/.env` file (See Template Below). |

#### `ENV_FILE` Template:
```properties
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=crm_db
JWT_SECRET=your_super_secret_key_change_this
# Frontend URL for CORS (Put your EC2 Public IP or Domain)
CORS_ORIGINS=http://<YOUR_EC2_IP>,http://localhost:3000
```

### 2. The Workflow File
I have created the workflow file for you at `.github/workflows/deploy.yml`.

---

## Part 4: Manual First Run (Verification)

Before relying on the auto-deploy, let's make sure it works manually.

1.  **Clone on Server**:
    ```bash
    git clone https://github.com/rutujak-bora/crm.git app
    cd app
    ```

2.  **Create Env File**:
    ```bash
    nano backend/.env
    # Paste your env variables. Ctrl+O to save, Ctrl+X to exit.
    ```

3.  **Start Services**:
    ```bash
    docker compose up -d --build
    ```

4.  **Visit your Site**:
    Open `http://<YOUR_EC2_PUBLIC_IP>` in your browser.
