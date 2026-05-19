# 🎬 Movie Booking System

A full-stack **Movie Ticket Booking Application** that allows users to browse movies, view theatres, select seats, and book tickets seamlessly.

---

## 🚀 Features

* 🔐 User Authentication (JWT आधारित login/signup)
* 🎥 Movie Management (Add / View Movies)
* 🏢 Theatre & Screen Management
* 🎟️ Show Creation & Management
* 💺 Seat Selection System
* 📊 Real-time Seat Availability
* 💳 Payment Integration (Razorpay)
* 📦 Booking Management System

---

## 🛠️ Tech Stack

### 🔹 Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication

### 🔹 Frontend

* HTML
* CSS
* JavaScript

---

## 📁 Project Structure

```
Movie-Booking-System/
│
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── config/
│
├── public/           # Frontend files
├── .env.example
├── .gitignore
├── package.json
└── server.js
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/movie-booking-app.git
cd movie-booking-app
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Setup environment variables

Create a `.env` file and add:

```
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
RAZORPAY_KEY=your_key
RAZORPAY_SECRET=your_secret
```

---

### 4️⃣ Run the server

```bash
npm start
```

Server will run on:

```
http://localhost:8000
```

---

## 📌 API Endpoints (Sample)

### 🎥 Movie

* `GET /api/movies`
* `POST /api/movies`

### 🏢 Theatre

* `GET /api/theatres`
* `GET /api/theatres/:id`  ✅ (getTheatreById)

### 🎟️ Booking

* `POST /api/bookings`

---

## 🔐 Environment Variables

Use `.env.example` as reference:

```
PORT=
MONGO_URI=
JWT_SECRET=
RAZORPAY_KEY=
RAZORPAY_SECRET=
```

---

## 🧪 Future Improvements

* 🎨 React Frontend
* 📱 Mobile Responsive UI
* 🔔 Notifications (Email/SMS)
* ⭐ Ratings & Reviews

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Sandesh Pawar**

---

⭐ If you like this project, give it a star on GitHub!
