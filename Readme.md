
# 📚 CourseMaster Backend API

A robust, scalable RESTful API powering the Learning Management System. Built with Node.js, Express, and MongoDB, featuring secure authentication, role-based access control, and Stripe payment integration.

## 🚀 Features

-   **Authentication & Authorization**: Secure JWT-based auth with HttpOnly cookies.
-   **Role-Based Access Control (RBAC)**: Distinct guards for `Student` and `Admin`.
-   **Course Management**: CRUD operations for courses, batches, and lessons.
-   **Enrollment System**: Cohort-based enrollment logic with seat limits and date validation.
-   **Payment Gateway**: Full Stripe integration (Checkout Sessions & Webhooks).
-   **Assessment Engine**: Logic for submitting assignments and grading quizzes.
-   **File Handling**: Secure integration for external resource links (Google Drive, YouTube).

## 🛠️ Tech Stack

-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Database**: MongoDB (Mongoose ODM)
-   **Authentication**: JSON Web Tokens (JWT), Bcrypt
-   **Payments**: Stripe API

## ⚙️ Environment Variables

Create a `.env` file in the root directory and add the following:

```env
PORT=4000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/your_db
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=development

# Frontend URL (For CORS)
CLIENT_URL=http://localhost:3000

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
````

## 🏃‍♂️ Getting Started

### 1\. Clone the repository

```bash
git clone [https://github.com/Nisha0202/lms_backend](https://github.com/Nisha0202/lms_backend)
cd lms-backend
```

### 2\. Install dependencies

```bash
npm install
```

### 3\. Run the development server

```bash
npm run dev
```

The server will start on `http://localhost:4000`.

## 🗂️ API Endpoints Overview

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | User login | Public |
| `GET` | `/api/courses` | List all available courses | Public |
| `POST` | `/api/courses` | Create a new course | Admin |
| `POST` | `/api/payment/create-checkout-sessiont` | Initialize Stripe session | Student |
| `POST` | `/api/assessments/submit-assignment` | Submit an assignment | Student |



