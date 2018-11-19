## A Texas Holdem game server (Node) and web client (React)

A Texas Holdem game server and web client built to test out the Bitcoin Lightning Network. Some notable features
are real-time game-play, multiple game rooms and support up to 5 players per room.

### Game Features

- Texas Holdem game engine for up to 5 players per room based on [node-poker](https://github.com/mjhbell/node-poker).
- Multiple simultaneous game rooms with individual game rules (blinds, buyins, # of players, etc).
- Real-time game interaction between clients via web sockets.
- Robust game records are stored in a POSTGRES DB which include each player action and along with game results.
- A basic React based web client server.

## Instructions

### Architecture dependencies

1. Node >=8.12.0
2. NPM
3. Postgres >=10.5 # https://www.postgresql.org/download/linux/ubuntu/

### DB Setup

1. Create a system user, e.g. lnpoker
2. Create a postgres role with the same username, e.g. lnpoker

```
sudo adduser lnpoker # go through prompts for password etc.

su - postgres # switch to postgres user

createuser --interactive # role name should be same as system user created above

```

3. Create a database with the same name

```
psql # enter psql command line

create database lnpoker; # dbname should be same as role name and system user created earlier

```

4. Switch to newly created system user and create test DB

```
su - lnpoker

psql # enter psql command line

create database lnpokertest;
```

5. Download file in the repo named "lnpokerschema.sql" and move it to the home folder of our user

```
cd \home\lnpoker

https://raw.githubusercontent.com/tonyea/lnpoker/master/lnpokerschema.sql
```

6. Import DB schema into the two DBs.

```
psql -U lnpoker lnpoker < lnpokerschema.sql # as system user lnpoker
psql -U lnpoker lnpokertest < lnpokertestschema.sql # as system user lnpoker
```

### Repo Setup

1. Clone repo and install dependencies

```
git clone https://github.com/tonyea/lnpoker.git

npm install

npm run client-install # package.json command that installs dependencies in client folder
```

2. Create a .env file in root folder of repo

```
PORT=5000
SOCKET_PORT=8010
jwtSecretOrKey=createownkeyhere
PGHOST=localhost
PGUSER=lnpoker
PGDATABASE=lnpoker
PGTESTDATABASE=lnpokertest
PGPASSWORD=passwordcreatedearlier
PGPORT=5432 # in psql as lnpoker, check /conninfo to find port if unsure
```

3. Run tests and check if DB connection worked

```
npm run test
```

4. Serve file
5. Visit localhost, create at least two profiles, create a game as profile 1 and join game as profile 2 (separate browser or anonymous browsing) to play.

## License

(The MIT License)

Copyright (c) 2012-2014 Anthony Ebin

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
