import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import * as cors from 'cors';

import {JsonDB} from 'node-json-db';
import {Config} from 'node-json-db/dist/lib/JsonDBConfig'


const app = express();
app.use(cors());

// Initialize Express as simple HTTP server
const server = http.createServer(app);

// Initialize WebSocket instance bootstrapping from Express
const wss = new WebSocket.Server({server});

// Initialize the reactor database
let reactorDB = new JsonDB(new Config("reactorDataBase", true, true, '/'));

// WebSocket event handlers
wss.on('connection', (ws: WebSocket) => {
    console.log('New client has connected!');
    ws.send('Hello!');

    ws.on('message', function incoming(message){
        parseMessage(message, ws);
    });
    ws.on('close', function close(){
        console.log("A client has disconnected!")
    });
});

function parseMessage(message: any, ws: WebSocket){
    let obj = JSON.parse(message);
    // Get next available ID
    if(obj.task == "get-id"){
        console.log("Client has requested a new ID")
        ws.send(getNextID())
    }

    // Create new reactor
    if(obj.task == "new"){
        console.log("Creating new reactor")
        newReactor(obj.ID, obj.NAME, obj.WORLD)
    }

    // Update reactor status
    if(obj.task == "update-status"){
        console.log(`Updating reactor status for ID ${obj.ID}`);
        updateReactor(obj);
    }

    // Update reactor error
    if(obj.task == "update-error"){
        console.log(`Updating PID error for ID ${obj.ID}`);
        updatePIDError(obj);
    }

    // Execute PID and send back rod adjustment to client
    if(obj.task == "run-pid"){
        console.log(`Calculating PID adjust for ID ${obj.ID}`);
        ws.send(runPID(obj.ID));
    }
}

function runPID(ID: number){
    const Kp = reactorDB.getData(`/${ID}/pidOptions/Kp`);
    const Ki = reactorDB.getData(`/${ID}/pidOptions/Ki`);
    const Kd = reactorDB.getData(`/${ID}/pidOptions/Kd`);
    const error = reactorDB.getData(`/${ID}/reactorError/error`);

    return Math.round(Kp*error + Ki * integratedError(error, ID) + Kd * derivedError(error, ID));
}

function integratedError(error: number, ID: number){
    let intErrTotal;
    const integralMin = -50;
    const integralMax = 50;

    try{
        intErrTotal = reactorDB.getData(`/${ID}/pidStatus/integralError`);
    } catch(error) {
        console.log('No integral error found! Getting default');
        intErrTotal = 1;
    }

    intErrTotal = intErrTotal + error;

    if (intErrTotal > integralMax){
        intErrTotal = integralMax;
    }

    if (intErrTotal < integralMin){
        intErrTotal = integralMin;
    }

    reactorDB.push(`/${ID}/pidStatus/integralError`, intErrTotal);
    return intErrTotal;
}

function derivedError(error: number, ID: number){
    let energyHistory;
    let energyProduction = 0;

    try{
        energyHistory = reactorDB.getData(`/${ID}/pidStatus/lastEnergyPoll`);
        energyProduction = reactorDB.getData(`/${ID}/reactorStatus/rfProduced`);
    } catch(error) {
        console.log('No energy history found! Setting default');
        energyHistory = 1;
    }

    reactorDB.push(`/${ID}/pidStatus/lastEnergyPoll`, energyProduction);
    return energyProduction - energyHistory;
}

function updateReactor(reactorData: any){
    reactorDB.push(`/${reactorData.ID}/reactorStatus`, {
        isActive:reactorData.activity,
        energyStored:reactorData.energy,
        energySaturation:reactorData.saturation,
        fuelLevel:reactorData.fuel,
        wasteLevel:reactorData.waste,
        fuelMax:reactorData.maxFuel,
        wasteProduced:reactorData.fuelBurnup,
        rfProduced:reactorData.energyOut,
        reactivity:reactorData.coreReactivity,
        temp:reactorData.coreTemp
    });
}

function updatePIDError(reactorData: any){
    reactorDB.push(`/${reactorData.ID}/reactorError`, {
        error:reactorData.rfUsage
    });
}

function newReactor(ID: number, NAME: string, WORLD: string){
    // Create a new reactor and set default PID gain tunings (Kp = 1, Ki = 1, Kd = 1)
    reactorDB.push(`/${ID}`, {name:NAME, world:WORLD, pidOptions:{Kp:1, Ki:1, Kd: 1, time:0.5}});
}

function getNextID(){
    let running = true;
    let i = 0;
    while(running){
        try{
            reactorDB.getData(`/${i}`);
            ++i;
        } catch(error) {
            running = false;
        }
    }
    return i;
}

app.get('/', function (req, res) {
    console.log('Sending Data to React Front-end');
    const len = getNextID();
    let data: any[] = [];

    for(let i = 0; i < len; ++i) {
        data.push(reactorDB.getData(`/${i}/`));
    }
    res.send(data);
});

// Start the server
app.listen(9000, () => {
    console.log(`Starting Express Server on port 9000`);
});


server.listen(8080, () => {
   console.log(`Starting WebSocket Server on port 8080`);
});