const Influx = require('influxdb-nodejs')
const client = new Influx('http://10.2.138.212:8086/mydb')
const axios = require('axios')

const hvServerName = "hview77.sup.praim.com"
const hvServerUrl = "http://" + hvServerName + ":8000/"
const hvServerVM = "SessionLocalSummaryView/"
const rpHV = 'hvData';

const ctxServerName = "xendesk715.sup.praim.com"
const ctxServerUrl = "http://" + ctxServerName + ":8000/"
const ctxServerVM = "Get-BrokerMachine/"
const rpCtx = 'ctxData';

const rdsServerName = "rds2019-1.sup.praim.com"
const rdsServerUrl = "http://" + rdsServerName + ":8000/"
const rdsServerVM = "Get-RDUserSession/"
const rpRDS = 'rdsData';

const serverCPU = "cpu"
const serverRAM = "ram"
const serverIO = "diskio"
const serverMB = "diskusage"

//HV Method 
function sendHVDataToInflux() {
    client.createDatabase().then(() => client.createRetentionPolicy(rpHV, '2h')).then(() => {
        let namesData
        let sessionData
        // make a get request to the url
        axios({
            method: 'get',
            url: hvServerUrl + hvServerVM + "namesdata",
            headers: { 'Accept': 'application/json' }, // this api needs this header set for the request
        }).then(res => {
            namesData = res.data;
            axios({
                method: 'get',
                url: hvServerUrl + hvServerVM + "sessiondata",
                headers: { 'Accept': 'application/json' },
            }).then(res => {
                sessionData = res.data;
                sendDataToInflux(hvServerName, namesData, rpHV)
                sendDataToInflux(hvServerName, sessionData, rpHV)
            }).catch(err => { console.error(err) })
        }).catch(err => { console.error(err) })
    }).catch(err => { console.error(err) })
}

//Citrix Method 
function sendCitrixDataToInflux() {
    client.createDatabase().then(() => client.createRetentionPolicy(rpCtx, '2h')).then(() => {
        let getBrokerMachine
        // make a get request to the url
        axios({
            method: 'get',
            url: ctxServerUrl + ctxServerVM,
            headers: { 'Accept': 'application/json' }, // this api needs this header set for the request
        }).then(res => {
            getBrokerMachine = res.data;
            sendDataToInflux(ctxServerName, getBrokerMachine, rpCtx)
        }).catch(err => { console.error(err) })
    }).catch(err => { console.error(err) })
}

//RDS Method
function sendRDSDataToInflux() {
    client.createDatabase().then(() => client.createRetentionPolicy(rpRDS, '2h')).then(() => {
        let rdsUserSession
        // make a get request to the url
        axios({
            method: 'get',
            url: rdsServerUrl + rdsServerVM,
            headers: { 'Accept': 'application/json' }, // this api needs this header set for the request
        }).then(res => {
            rdsUserSession = res.data;
            sendDataToInflux(rdsServerName, rdsUserSession, rpRDS)
        }).catch(err => { console.error(err) })
    }).catch(err => { console.error(err) })
}

function sendDataToInflux(serverName, myRawData, myRP) {
    if (myRawData && !Array.isArray(myRawData)) {
        myRawData = [myRawData]
    }
    for (let i = 0; i < myRawData.length; i++) {
        let myKeyData = Object.keys(myRawData[i])
        let myValueData = Object.values(myRawData[i])
        let myFieldData = {}
        myKeyData.forEach((myKey, k) => myFieldData[myKey] = ((myValueData[k] != undefined && myValueData[k] != null && !Array.isArray(myValueData[k])) ? myValueData[k] : ''))

        client.write(serverName)
            .tag({ app: [process.env.npm_package_name] })
            .field(myFieldData)
            .set({ RP: myRP })
            .then(() => { console.info(serverName + ' write point success') })
            .catch(err => { console.error(err) });
    }
}

function sendServerHealthToInflux(server, rp, serverName) {
    client.createDatabase().then(() => client.createRetentionPolicy(rp, '2h')).then(() => {
        let cpu
        let ram
        let mb
        // make a get request to the url
        axios({
            method: 'get',
            url: server + serverCPU,
            headers: { 'Accept': 'application/json' },
        }).then(res => {
            cpu = res.data;
            axios({
                method: 'get',
                url: server + serverRAM,
                headers: { 'Accept': 'application/json' },
            }).then(res => {
                ram = res.data;
                axios({
                    method: 'get',
                    url: server + serverMB,
                    headers: { 'Accept': 'application/json' },
                }).then(res => {
                    mb = res.data;
                    client.write(serverName)
                        .tag({ app: [process.env.npm_package_name] })
                        .field({
                            "cpu": cpu,
                            "ram": ram,
                            "mb": mb
                        })
                        .set({ RP: rp })
                        .then(() => { console.info('write point success (cpu_ram_mb) on ' + serverName) })
                        .catch(err => { console.error(err) });
                }).catch(err => { console.error(err) })
            }).catch(err => { console.error(err) })
        }).catch(err => { console.error(err) })
    }).catch(err => { console.error(err) })
}

function sendServerDiskIOToInflux(server, rp, serverName) {
    client.createDatabase().then(() => client.createRetentionPolicy(rp, '2h')).then(() => {
        // make a get request to the url
        axios({
            method: 'get',
            url: server + serverIO,
            headers: { 'Accept': 'application/json' },
        }).then(res => {
            client.write(serverName)
                .tag({ app: [process.env.npm_package_name] })
                .field({
                    "diskIO": res.data,
                })
                .set({ RP: rp })
                .then(() => { console.info('write point success(io) on ' + serverName) })
                .catch(err => { console.error(err) });
        }).catch(err => { console.error(err) })
    }).catch(err => { console.error(err) })
}

// horizon view data every 10 minutes
setInterval(sendHVDataToInflux, 600 * 1000);

// xendesk data every 10 minutes
setInterval(sendCitrixDataToInflux, 600 * 1000);

// rds data every 10 minutes
setInterval(sendRDSDataToInflux, 600 * 1000);

// horizon view health every 1 minute
setInterval(function () { sendServerHealthToInflux(hvServerUrl, rpHV, hvServerName) }, 60 * 1000);

// horizon view health every 10 seconds
setInterval(function () { sendServerDiskIOToInflux(hvServerUrl, rpHV, hvServerName) }, 10 * 1000);

// xendesk health every 1 minute
setInterval(function () { sendServerHealthToInflux(ctxServerUrl, rpCtx, ctxServerName) }, 60 * 1000);

// xendesk health every 10 seconds
setInterval(function () { sendServerDiskIOToInflux(ctxServerUrl, rpCtx, ctxServerName) }, 10 * 1000);

// rds health every 1 minute
setInterval(function () { sendServerHealthToInflux(rdsServerUrl, rpRDS, rdsServerName) }, 60 * 1000);

// rds health every 10 seconds
setInterval(function () { sendServerDiskIOToInflux(rdsServerUrl, rpRDS, rdsServerName) }, 10 * 1000);