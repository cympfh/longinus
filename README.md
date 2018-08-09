# Longinus

## config

```bash
$ cat config.yml
web:
  port: 8080
output_path: ./out.log
key: pa$$w0rd  # or environ LONGINUS_KEY
```

Env `LONGINUS_KEY` is prior to `key` in `config.ymml`.

## usage

### launch server

Install `node` and dependencies by `npm i` then,

```bash
node ./server.js
# or
LONGINUS_KEY=hogehoge node ./server.js
```

### POST, logging

```bash
curl $DOMAIN/A/B -d 'datadatadata'
```

The data `datadatadata` be stored and associated with the tag `/A/B`.

### GET

```bash
curl $DOMAIN/A/B
curl $DOMAIN/A/B?q=blue+red&head=10  # filtered with queries
```

#### filter queries

| name |  type  | description        |
|:-----|:-------|:-------------------|
| q    | string | grep keywords      |
| head | int    | take first n lines |
| tail | int    | take last n lines  |

