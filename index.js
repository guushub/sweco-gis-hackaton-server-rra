'use strict';
const EventHubClient = require('azure-event-hubs').Client;
const express = require('express')
const bodyParser = require('body-parser');  
const url = require('url');  
const querystring = require('querystring');  
const connectToAzure = true;
const values = [];

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

const connectionString = 'HostName=GuusDevHub.azure-devices.net;SharedAccessKeyName=service;SharedAccessKey=Bg1G89erSM4O0K+TU69KQhFU3op9cim2O7GDbsaQIWg=';

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

    let time = parseInt(messageToPrint.time);
    if(!time) {
        time = Date.parse(messageToPrint.time);
    }
    values.push({
        time: time,
        value: messageToPrint.value
    });

    if(values.length > 1000) {
        values.shift();
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
            const valsToSend = values;
            if(nRecords < values.length) {
                valsToSend = values.slice(nRecords);
            }

            //const renderValues = getDevValues(nRecords);
            res.send(valsToSend);
        } else {
            res.send("Kon request niet verwerken.")
        }
    });
const port = 8081;
app.listen(port, () => console.log('Example app listening on port ' + port))

// In case of TypeError in frames.js, see: https://github.com/noodlefrenzy/node-amqp10/issues/322
const client = EventHubClient.fromConnectionString(connectionString);
client
    .open()
    .then(client.getPartitionIds.bind(client))
    .then((partitionIds) => {
        return partitionIds.map(getClientReceiver);
    })
    .catch(printError);