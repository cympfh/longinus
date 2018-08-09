const fs = require('fs');
const express = require('express');
const morgan = require('morgan');
const app = express()
const yaml = require('node-yaml');

var config = yaml.readSync('./config.yml');
if ('LONGINUS_KEY' in process.env) {
    config.key = process.env.LONGINUS_KEY;
}
console.log(config);

function is_authorized(req) {
    return (req.header('X-KEY') == config.key);
}

function write(line) {
    try {
        fs.appendFileSync(config.output_path, line);
        return true;
    } catch (e) {
        console.warn(e);
        return false;
    }
}

function get_content(tag, opts, cont) {
    if (!fs.existsSync(config.output_path)) {
        return cont([]);
    }
    fs.readFile(config.output_path, (err, data) => {
        var lines = [];
        data.toString().split('\n').forEach(line => {
            if (opts.head) { if (lines.length >= opts.head) return; }
            let [datetime, _tag, text] = line.split('\t');
            if (tag == _tag) {
                for (var w of opts.q) {
                    if (text.indexOf(w) == -1) return;
                }
                lines.push(`${datetime}\t${text}`);
            }
        });
        if (opts.tail) { lines = lines.slice(-opts.tail); }
        cont(lines);
    });
}

app.use(morgan('combined'));

app.get('/*', (req, res) => {
    const tag = req.path;

    var q = req.query.q ? req.query.q.split(' ') : [];
    var head = req.query.head ? (req.query.head | 0) : false;
    var tail = req.query.tail ? (req.query.tail | 0) : false;

    get_content(tag, {q: q, head: head, tail: tail}, (lines) => {
        if (lines.length == 0) {
            res.status(404).send('');
            return;
        }
        res.type('text/plain');
        res.send(lines.join('\n'));
    });
});

app.post('/*', (req, res) => {

    const tag = req.path;
    const authorized = is_authorized(req);

    var data = '';
    req.on('data', (chunk) => { data += chunk })
    req.on('end', () => {
        data = data.replace(/\n/g, '\\n');
        if (data == '') {
            res.status(400).send('Empty denied');
        } else if (is_authorized(req)) {
            const datetime = new Date().toISOString();
            console.log(`Authorized POST to ${tag} : ${data}`);
            const line = `${datetime}\t${tag}\t${data}\n`;
            if (!write(line)) {
                console.log('[Err] something wrong in write()');
            }
            res.send('Accepted');
        } else {
            console.log(`Unauthorized POST to ${tag} : ${data}`);
            res.status(401).send('Unauthorized');
        }
    });
});

app.listen(config.web.port, () => {
    console.log(`Listen on ${config.web.port}`);
});
