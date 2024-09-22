# Express.js User Authentication and Point Management API

## Overview
This project was developed for the **Tathva Tech Team Inductions**. It is an API built using Express.js that supports user registration, login, token-based authentication, and point management. MongoDB is used for data storage, JWT (JSON Web Token) for authentication, and bcrypt for secure password hashing.

### Features:
1. **User Registration & Login**: Provides a secure way for users to register and log in using hashed passwords.
2. **Token Authentication**: JWT is used for session handling, with both access and refresh tokens to manage user sessions effectively.
3. **User Management**: The API allows for creating, updating, fetching, and deleting user profiles.
4. **Points System**: Users can increment their points, and the API offers features to retrieve the top scorer and calculate the average points.
5. **Token Blacklisting**: Upon user logout, the access token is blacklisted to prevent misuse.
1. **Validation**: Joi is used to validate essential fields like email and password, especially during registration.

## Installation
```bash
    git clone https://github.com/SreehariSanjeev04/Tathva-Inductions.git
    cd repository-folder
    node server.js
```

## API Endpoints

1. **POST /api/register**: Registers a new user. Requires name, email, password, and age in the request body.
```bash
    "name": "NAME",
    "email": "email@example.com",
    "password": "password",
    "age": 90
```
2. **POST /api/login**: Authenticates a user and returns an access token and refresh token.
```bash
    "email": "email@example.com",
    "password": "password",
```
3. **GET /api/users (Protected)**: Retrieves all users (excluding their passwords).
4. **PUT /api/update (Protected)**: Updates an existing user
```bash
    "name": "NEW_NAME",
    "email": "new_email@example.com",
    "password": "new_password",
    "age": 80
```
5. **DELETE /api/delete (Protected)**: Deletes a user and blacklists their token upon deletion.
```bash
    "email": "new_email@example.com",
```
6. **POST /api/increment-point (Protected)**: Increments the logged-in user’s points.
7. **GET /api/topscore**: Retrieves the user with the highest points.
8. **GET /api/averagepoint**: Calculates and returns the average points of all users.
9. **GET /api/refresh-token**: Generates a new access token using a refresh token.
10. **GET /api/logout (Protected)**: Logs out a user by blacklisting their access token.
11. **GET /api/getprofile (Protected)**: Retrieves the profile of the logged-in user.

## Middleware

1. **User Validation**: Ensures data consistency during registration and updates.
2. **Token Authentication**: Protects routes by verifying JWTs.
3. **Token Blacklisting**: Prevents blacklisted tokens from accessing protected resources.
