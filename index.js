const Influx = require('influxdb-nodejs')
const client = new Influx('http://10.2.138.212:8086/mydb')
const axios = require('axios')

const hvServerName = "hview77.sup.praim.com"
const hvServerUrl = "http://" + hvServerName + ":8000/"
const hvServerVM = "SessionLocalSummaryView/"
const rpHV = 'hvData';

const CitrixServerName = "xendesk715.sup.praim.com"
const CitrixServerUrl = "http://" + CitrixServerName + ":8000/"
const CitrixServerVM = "Get-BrokerMachine/"
const rpCitrix = 'ctxData';

const ServerCPU = "cpu"
const ServerRam = "ram"
const ServerIO = "diskio"
const ServerMB = "diskusage"

//HV Method 
function sendHVDataToInflux() {
    client.createDatabase().then(() => client.createRetentionPolicy(rpHV, '2h')).then(() => {
        let namesData
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
                if (sessionData.length == namesData.length) {
                    for (let i = 0; i < sessionData.length; i++) {
                        client.write(hvServerName)
                            .tag({ app: ['hviewinflux'] })
                            .field({
                                // from namesdata
                                "machineorrdsservername": namesData[i].MachineOrRDSServerName,
                                "agentversion": namesData[i].AgentVersion,
                                "desktopname": namesData[i].DesktopName,
                                "desktoptype": namesData[i].DesktopType,
                                "clientaddress": namesData[i].ClientAddress,
                                "clientversion": namesData[i].ClientVersion,
                                "username": namesData[i].UserName,
                                // from sessiondata
                                "sessionprotocol": sessionData[i].SessionProtocol,
                                "sessionstate": sessionData[i].SessionState,
                                "starttime": sessionData[i].StartTime,
                                "disconnecttime": sessionData[i].DisconnectTime
                            })
                            .set({ RP: rpHV })
                            .then(() => { console.info('write point success(serverHVInformation)') })
                            .catch(err => { console.error(err) });
                    }
                }
            }).catch(err => { console.error(err) })
        }).catch(err => { console.error(err) })
    }).catch(err => { console.error(err) })
}

//Citrix Method 
function sendCitrixDataToInflux() {
    client.createDatabase().then(() => client.createRetentionPolicy(rpCitrix, '2h')).then(() => {
        let GetBrokermachine
        // make a get request to the url
        axios({
            method: 'get',
            url: CitrixServerUrl + CitrixServerVM,
            headers: { 'Accept': 'application/json' }, // this api needs this header set for the request
        }).then(res => {
            GetBrokermachine = res.data;
            for (let i = 0; i < GetBrokermachine.length; i++) {
                client.write(CitrixServerName)
                    .tag({ app: ['hviewinflux'] })
                    .field({
                        "agentversion": GetBrokermachine[i].AgentVersion ? GetBrokermachine[i].AgentVersion : '',
                        "ostype": GetBrokermachine[i].OSType ? GetBrokermachine[i].OSType : '',
                        "vdimachinename": GetBrokermachine[i].MachineName ? GetBrokermachine[i].MachineName : '',
                        "sessionclientaddress": GetBrokermachine[i].SessionClientAddress ? GetBrokermachine[i].SessionClientAddress : '',
                        "sessionclientversion": GetBrokermachine[i].SessionClientVersion ? GetBrokermachine[i].SessionClientVersion : '',
                        "sessionclientname": GetBrokermachine[i].SessionClientName ? GetBrokermachine[i].SessionClientName : '',
                        "sessionusername": GetBrokermachine[i].SessionUserName ? GetBrokermachine[i].SessionUserName : '',
                        "sessionprotocol": GetBrokermachine[i].SessionProtocol ? GetBrokermachine[i].SessionProtocol : '',
                        "sessionstate": GetBrokermachine[i].SessionState ? GetBrokermachine[i].SessionState : 0.0,
                        "vdiipaddress": GetBrokermachine[i].IPAddress ? GetBrokermachine[i].IPAddress : ''
                    })
                    .set({ RP: rpCitrix })
                    .then(() => { console.info('write point success(serverCitrixInformation)') })
                    .catch(err => { console.error(err) });
            }
        }).catch(err => { console.error(err) })
    }).catch(err => { console.error(err) })
}

function sendServerHealthToInflux(server, rp, serverName) {
    client.createDatabase().then(() => client.createRetentionPolicy(rp, '2h')).then(() => {
        let cpu
        let ram
        let mb
        // make a get request to the url
        axios({
            method: 'get',
            url: server + ServerCPU,
            headers: { 'Accept': 'application/json' },
        }).then(res => {
            cpu = res.data;
            axios({
                method: 'get',
                url: server + ServerRam,
                headers: { 'Accept': 'application/json' },
            }).then(res => {
                ram = res.data;
                axios({
                    method: 'get',
                    url: server + ServerMB,
                    headers: { 'Accept': 'application/json' },
                }).then(res => {
                    mb = res.data;
                    client.write(serverName)
                        .tag({ app: ['influx'] })
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
            url: server + ServerIO,
            headers: { 'Accept': 'application/json' },
        }).then(res => {
            client.write(serverName)
                .tag({ app: ['hviewinflux'] })
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
setInterval(sendHVDataToInflux, 30 * 1000);

// xendesk data every 10 minutes
setInterval(sendCitrixDataToInflux, 30 * 1000);

// horizon view health every 1 minute
setInterval(function () { sendServerHealthToInflux(hvServerUrl, rpHV, hvServerName) }, 60 * 1000);

// horizon view health every 10 seconds
setInterval(function () { sendServerDiskIOToInflux(hvServerUrl, rpHV, hvServerName) }, 10 * 1000);

// xendesk health every 1 minute
setInterval(function () { sendServerHealthToInflux(CitrixServerUrl, rpCitrix, CitrixServerName) }, 60 * 1000);

// xendesk health every 10 seconds
setInterval(function () { sendServerDiskIOToInflux(CitrixServerUrl, rpCitrix, CitrixServerName) }, 10 * 1000);