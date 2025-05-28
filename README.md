<h1 align="center">Ticketo 🎟️</h1>  

<div align="center">

  [![CI & Build](https://github.com/k5sha/Tikceto/actions/workflows/test_and_build.yaml/badge.svg)](https://github.com/k5sha/Tikceto/actions/workflows/test_and_build.yaml)
    [![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
    ![Go](https://img.shields.io/badge/backend-Go-informational?logo=go)
    ![React](https://img.shields.io/badge/frontend-React-blue?logo=react)
    ![TailwindCSS](https://img.shields.io/badge/styling-TailwindCSS-06B6D4?logo=tailwindcss)
    [![Live Demo](https://img.shields.io/badge/demo-online-brightgreen?logo=vps)](https://k5sha.run.place)

  </a>
</div>

### 🎯 Overview

**Ticketo** is a modern, user-friendly ticket sales platform built for event organizers and attendees. It provides seamless event browsing, booking, and management experiences through a sleek UI and robust backend.

<div align="center">
  <img src="https://github.com/user-attachments/assets/d8b07a6c-2806-4c45-a6d3-22a34e50a711" alt="Ticketo Screenshot" width="700"/>
</div>

## 🚀 Features

* 🔐 User registration and login
* 🔎 Event browsing and keyword search
* 🎟️ Secure ticket purchasing and refund system
* ⚙️ Admin panel to manage events and ticket sales
* 📲 QR-coded e-tickets
* 📧 Email notifications for orders and updates

## 🛠️ Tech Stack

### 🧠 Backend

* **Go (Golang)** + [Chi](https://github.com/go-chi/chi)
* **PostgreSQL**
* **JWT** for secure authentication
* **Docker & Docker Compose**
* **Redis** (optional: caching or background tasks)

### 🎨 Frontend

* **React** + **Vite**
* **TailwindCSS**
* **Axios** for API requests

### 🛠 DevOps & Storage

* **Nginx** for reverse proxy
* **Docker** for containerization
* **MinIO** (optional file storage)


## ⚙️ Getting Started

### Prerequisites

* [Docker](https://www.docker.com/)
* [Docker Compose](https://docs.docker.com/compose/)

### Run Locally

```bash
# Clone the repository
git clone https://github.com/k5sha/ticketo.git
cd ticketo

# Build and run the services
docker-compose up --build
```



## 📄 License

This project is licensed under the [MIT License](LICENSE).


## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.
