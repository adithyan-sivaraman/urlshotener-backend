# API Endpoint for URL Shortener App

This project is an api endpoint for the Vite app which is designed to allow users to shorten Long URL.

## Getting Started

1. Clone the repository to your local machine:

2. Navigate to the project directory:

3. Install the project dependencies using npm install

4. Clone front end Vite App from this [repository](https://github.com/adithyan-sivaraman/urlshotener-frontend)

## Configuration

1.  To configure the front endpoint, you'll need to modify the `config.js`

2. Set the cloud url or local mongo db url in connection.js file

3.  Create .env file and set following environment variables 
     - for local mongo db
       - MONGO_DB
       - MONGO_URL
     - for cloud mongo db
       - MONGO_USER
       - MONGO_PASSWORD
       - MONGO_CLUSTER
    - nodemailer credentials
      - USER_EMAIL
      - USER_PWD
    - JWT Secret Key
      - SECRET_KEY

## Running the App

1. Once you have configured the backend endpoint, you can start the development server: npm run start or npm run dev

2. Run the Vite app by navigating project directory : npm run dev