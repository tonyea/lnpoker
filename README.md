## A Texas Holdem game server (Node) and web client (React)

A Texas Holdem game server and web client built to test out the Bitcoin Lightning Network. Some notable features
are real-time game-play, multiple game rooms and support up to 5 players per room. Demo: [lightningpoker.club](lightningpoker.club)

### Game Features

- Texas Holdem game engine for up to 5 players per room based on [node-poker](https://github.com/mjhbell/node-poker).
- Multiple simultaneous game rooms with individual game rules (blinds, buyins, # of players, etc).
- Real-time game interaction between clients via web sockets.
- Robust game records are stored in a POSTGRES DB which include each player action and along with game results.
- A basic React based web client server.
- Deposits and Withdrawals of Bitcoin

### Screenshots
#### Start screen
![1 Start screen](https://i.imgur.com/Z2miFpx.png)
#### Create new game with a custom buy-in
![2 Create new game with a custom buy-in](https://i.imgur.com/XGegHNu.png)
#### Get payment request for buy-in invoice (open channel if routing failures occur)
![3 Get payment request for buy-in invoice](https://i.imgur.com/1uzRBwP.png)
#### Pay invoice
![4 pay invoice](https://i.imgur.com/BQdd82g.png)
#### New game screen
![5 New game screen](https://i.imgur.com/EXZWXVJ.png)
#### New round with 2 users 
![6 New round with 2 users](https://i.imgur.com/VpUbDNV.png)
#### Flop round screen
![7 Flop round screen](https://i.imgur.com/6l41ICi.png)
#### End round screen
![8 End round screen](https://i.imgur.com/CYxmmfv.png)
#### End game screen
![9 End game screen](https://i.imgur.com/dfnaBum.png)
#### Click on balance amount to withdraw funds
![10 Click on balance amount to withdraw funds](https://i.imgur.com/m63osHi.png)
#### Copy payment request
![11 Copy payment request](https://i.imgur.com/S1jf6nJ.png)
#### Paste payment request for withdrawal
![12 Paste payment request for withdrawal](https://i.imgur.com/BCiWBio.png)
#### Withdrawal is being processed
![13 Withdrawal is being processed](https://i.imgur.com/b5S5pkX.png)

## Instructions

### Architecture dependencies

1. Node >=8.12.0
2. NPM
3. Postgres >=10.5 # https://www.postgresql.org/download/linux/ubuntu/
4. LND >=0.5 #https://github.com/lightningnetwork/lnd

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

2. Create a .env file in root folder of repo and input connection credentials for your lightning node. See https://dev.lightning.community/guides/installation/

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
LNPOKER_MACAROON=/location/of/admin.macaroon
LNPOKER_TLS=/home/.lnd/tls.cert # this is the default, change as per your lightning settings
LNPOKER_HOST=localhost:10001 # depends on which port your node is running
GRPC_SSL_CIPHER_SUITES=HIGH+ECDSA
NODEURI=03e61c6a47778c4521d96b059bd782b15eb3d8c165306587ceae08014119bbc4cc@localhost:10011 # use own node uri. Get by running command lncli getinfo on node
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
