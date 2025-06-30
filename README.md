# Book Review Backend Service

A simple backend service built with **Node.js**, **Express**, **Sequelize**, and **MySQL**, implementing **Redis** caching and error handling. Supports real-time book reviews (extendable via GraphQL subscriptions).



---------------------------------- Tech Stack ----------------------------------

- **Node.js** + **Express** – API server
- **Sequelize ORM** – MySQL ORM for models and migrations
- **MySQL** – Relational Database
- **Redis** – In-memory cache for fast data retrieval
- **Jest** – Unit & integration testing (optional)
- **Docker** – Optional for Redis setup



---------------------------------- Features ----------------------------------

- CRUD for Books and Reviews
- Caching with Redis for `GET /books` and `GET /books/:id/reviews`
- Automatic Redis fallback to DB if cache fails
- Cache invalidation on `POST /books` and `POST /reviews`
- Error handling for DB and cache scenarios
- Scalable code structure with services, models, and routes



---------------------------------- Code Running Instructions  ----------------------------------

- Install all dependies, files and all
        - npm install
- Download Redis in your local machine
- Configure MySQL database
        - Ensure MySQL is installed and running.
        - Create a database named (e.g., book_review_db)
        - Update your /config/db.js or .env file with:
                DB_PORT = 3306
                DB_USER = root
                DB_HOST = localhost
                DB_PASSWORD = yourpassword
                DB_NAME = database_name
- Run Redis in your local machine/ terminal
        - redis-server.exe
- Run the code in any code editor, in VS Code:
        - npm start
- Hurrayy !! your code is running and your environment is well set for testing and running the APIs.
- Open PostMan and test the APIs as per the routes defines in the code.  
