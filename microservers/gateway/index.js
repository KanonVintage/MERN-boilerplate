//importing the required modules right here y'all
const thrift = require('thrift');
const TopTenService = require('./gen-nodejs/TopTenService');
const app = require('express')();
const cors = require('cors')
const transport = thrift.TBufferedTransport;
const protocol = thrift.TBinaryProtocol;

//now, we need this to present the proyect tomorrow, you know, that response time test
const responseTime = require('response-time')
const redis = require('redis');

//adding cors to app, dont need it but just in case y'know
app.use(cors());
//now the real thing begins here, we create and connect redis client to local instance.
const client    = redis.createClient({
    host : 'redis'})

//after 3 hours trying to figure this out, we finally made it, yes!
client.on('ready', function() {
    redisIsReady = true;
    console.log('redis is running');
});

// yknow, if that fails then we gotta show why, here we print redis errors to the console
client.on('error', (err) => {
  console.log("Error " + err);
});
// use response-time as a middleware, for the documentation again
app.use(responseTime());

function createConnection(host, port, thing, errorCallback) {
    const connection = thrift.createConnection(host, port, {
        transport : transport,
        protocol : protocol
    });
    connection.on('error', errorCallback);
    return thrift.createClient(thing, connection);
}

//now, heres where things get real
app.get('/topten/:sometext', (req, res) => {
    const TopTen = createConnection(process.env.TOPTEN_HOST, process.env.TOPTEN_PORT, TopTenService, (err) => {
        return res.status(500).json({
            name: err.name,
            message: err.message,
            stack: err.stack
        });
    });
    console.log("almost there asshole");

    return TopTen.topten(req.params.sometext)
        .then(result => res.status(200).json(result))
        .catch(err => res.status(500).json(err));
});

app.listen(process.env.PORT || 8000);