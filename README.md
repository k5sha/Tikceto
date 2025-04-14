# Ticketo 🎟️  
**Ticketo** is a modern ticket sales platform for events. The project is designed for easy booking, purchasing, and managing tickets for both organizers and customers.

## 🚀 Features
- User registration and login
- Event browsing and search
- Ticket purchasing and refunds
- Admin panel for managing events and sales
- E-tickets with QR codes
- Email notifications

## 🛠️ Tech Stack

### Backend:
- Go (Golang) + Chi
- PostgreSQL
- Docker + Docker Compose
- JWT-based authentication
- Redis (optional for caching or queues)

### Frontend:
- React + Vite
- TailwindCSS
- Axios

### DevOps:
- Docker
- Nginx
- MinIO (for file storage if needed)

## ⚙️ Quick Start

```bash
# Clone the repository
git clone https://github.com/k5sha/ticketo.git
cd ticketo

# Start the project
docker-compose up --build
