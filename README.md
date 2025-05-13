# Stick RPG app

// WIP

## Initial Setup

1. Install Termux on F-Droid (<https://f-droid.org/en/packages/com.termux/>)

2. Run the following commands on Termux

    ```sh
    apt update && apt upgrade && apt install postgresql -y

    mkdir db
    initdb ./db
    echo "pg_ctl -D ./db start" > start_db.sh
    echo "pg_ctl -D ./db stop" > stop_db.sh
    sh start_db.sh
    echo "CREATE USER stick WITH PASSWORD 'stick'; CREATE DATABASE stick OWNER stick;" | psql -d postgres
    sh stop_db.sh

    apt install wget -y && wget https://raw.githubusercontent.com/wahasa/Alpine/main/Install/alpine_3.21.sh && chmod +x alpine_3.21.sh && ./alpine_3.21.sh
    ```

3. Run the following commands on Alpine on termux

    ```sh
    # Enter `alpine` to enter alpine.
    apk update
    apk upgrade
    apk add git nodejs npm

    git clone https://github.com/stick-rpg/app.git
    # Enter `exit` to leave alpine.
    ```

4. Install MessengerBotR, copy `bot.js`

## After update (or first time)

Run the following commands on Alpine on termux

```sh
(cd app && git pull)
(cd app && npm i)
(cd app && npm run build)
(cd app && npx prisma migrate deploy)
```

## Starting the app

1. Ensure PostgreSQL server is running  
    (Run `sh start_db.sh` on Termux)

2. Run the following commands on Alpine on termux

```sh
(cd app && npm start)
```

## Stopping the app

1. Stop `node` process anyway (Ctrl + C preferred)

2. Ensure PostgreSQL server is stopped  
    (Run `sh stop_db.sh` on Termux)
