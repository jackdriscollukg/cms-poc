### Steps to run

#### Server

0. Change into the server directory

```
cd server
```

1. Create a .env file and replace the values from your Strapi Configuration

```
HOST=0.0.0.0
PORT=1337
APP_KEYS="toBeModified1,toBeModified2"
API_TOKEN_SALT=tobemodified
ADMIN_JWT_SECRET=tobemodified
JWT_SECRET=tobemodified
```

2. Install the dependencies

```
npm install
```

3. Start the server

```
npm run start
```

#### Client

0. Change into the client directory ( from / )

```
cd app
```

1. Install the depencies

```
npm install
```

2. Run the client

```
npm run serve
```
