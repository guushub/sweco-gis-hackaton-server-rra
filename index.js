'use strict';
const EventHubClient = require('azure-event-hubs').Client;
const express = require('express')
const bodyParser = require('body-parser');  
const url = require('url');  
const querystring = require('querystring');  
const connectToAzure = false;

const getDevValues = (n) => {
    const now = Date.now();
    const values = [];
    values.push({time: now, value: Math.random()});

    for (let i = 1; i < n; i++) { 
        const item = {time: now - (i * 60000), value: Math.random()};
        values.unshift(item);
    }

    return values;

} 

const connectionString = '';

const printError = (err) => {
    console.log(err.message);
};

const printMessage = (message) => {
    console.log('Message received: ');
    const messageJson = JSON.stringify(message.body);
    const messageObject = JSON.parse(messageJson);
    let messageToPrint = messageObject;

    if(messageObject.type === "Buffer" && messageObject.data) {
        const messageBuffer = Buffer.from(messageObject.data);
        messageToPrint = messageBuffer.toString();
    }
    console.log(messageToPrint);
    console.log('');
};

const getClientReceiver = (partitionId) => {
    return client
        .createReceiver('$Default', partitionId, { 'startAfterTime': Date.now() })
        .then((receiver) => {
            console.log('Created partition receiver: ' + partitionId);
            receiver.on('errorReceived', printError);
            receiver.on('message', printMessage);
        });
}

// Start server
const app = express()
app.use(bodyParser.urlencoded({ extended: false }));  
app.use(bodyParser.json());
app.get('/', function(req, res) {
    
        // Access the provided 'page' and 'limt' query parameters
        const nRecords = parseInt(req.query.n);

        if(nRecords) {
            const renderValues = getDevValues(nRecords);
            // Return the articles to the rendering engine
            res.send(renderValues);
        } else {
            res.send("Kon request niet verwerken.")
        }
    });

app.listen(80, () => console.log('Example app listening on port 80'))

// In case of TypeError in frames.js, see: https://github.com/noodlefrenzy/node-amqp10/issues/322
if(connectToAzure) {
    const client = EventHubClient.fromConnectionString(connectionString);
    client
        .open()
        .then(client.getPartitionIds.bind(client))
        .then((partitionIds) => {
            return partitionIds.map(getClientReceiver);
        })
        .catch(printError);
}