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
                    if (Array.isArray(sessionData)) {
                        for (let i = 0; i < sessionData.length; i++) {
                            client.write(hvServerName)
                                .tag({ app: [process.env.npm_package_name] })
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
                    } else {
                        client.write(hvServerName)
                            .tag({ app: [process.env.npm_package_name] })
                            .field({
                                // from namesdata
                                "machineorrdsservername": namesData.MachineOrRDSServerName,
                                "agentversion": namesData.AgentVersion,
                                "desktopname": namesData.DesktopName,
                                "desktoptype": namesData.DesktopType,
                                "clientaddress": namesData.ClientAddress,
                                "clientversion": namesData.ClientVersion,
                                "username": namesData.UserName,
                                // from sessiondata
                                "sessionprotocol": sessionData.SessionProtocol,
                                "sessionstate": sessionData.SessionState,
                                "starttime": sessionData.StartTime,
                                "disconnecttime": sessionData.DisconnectTime
                            })
                    }
                }
            }).catch(err => { console.error(err) })
        }).catch(err => { console.error(err) })
    }).catch(err => { console.error(err) })
}

//Citrix Method 
function sendCitrixDataToInflux() {
    client.createDatabase().then(() => client.createRetentionPolicy(rpCtx, '2h')).then(() => {
        let GetBrokermachine
        // make a get request to the url
        axios({
            method: 'get',
            url: ctxServerUrl + ctxServerVM,
            headers: { 'Accept': 'application/json' }, // this api needs this header set for the request
        }).then(res => {
            GetBrokermachine = res.data;
            if (Array.isArray(GetBrokermachine)) {
                for (let i = 0; i < GetBrokermachine.length; i++) {
                    client.write(ctxServerName)
                        .tag({ app: [process.env.npm_package_name] })
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
                        .set({ RP: rpCtx })
                        .then(() => { console.info('write point success(serverCitrixInformation)') })
                        .catch(err => { console.error(err) });
                }
            } else {
                client.write(ctxServerName)
                    .tag({ app: [process.env.npm_package_name] })
                    .field({
                        "agentversion": GetBrokermachine.AgentVersion ? GetBrokermachine.AgentVersion : '',
                        "ostype": GetBrokermachine.OSType ? GetBrokermachine.OSType : '',
                        "vdimachinename": GetBrokermachine.MachineName ? GetBrokermachine.MachineName : '',
                        "sessionclientaddress": GetBrokermachine.SessionClientAddress ? GetBrokermachine.SessionClientAddress : '',
                        "sessionclientversion": GetBrokermachine.SessionClientVersion ? GetBrokermachine.SessionClientVersion : '',
                        "sessionclientname": GetBrokermachine.SessionClientName ? GetBrokermachine.SessionClientName : '',
                        "sessionusername": GetBrokermachine.SessionUserName ? GetBrokermachine.SessionUserName : '',
                        "sessionprotocol": GetBrokermachine.SessionProtocol ? GetBrokermachine.SessionProtocol : '',
                        "sessionstate": GetBrokermachine.SessionState ? GetBrokermachine.SessionState : 0.0,
                        "vdiipaddress": GetBrokermachine.IPAddress ? GetBrokermachine.IPAddress : ''
                    })
                    .set({ RP: rpCtx })
                    .then(() => { console.info('write point success(serverCitrixInformation)') })
                    .catch(err => { console.error(err) });
            }
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
            if (Array.isArray(rdsUserSession)) {
                for (let i = 0; i < rdsUserSession.length; i++) {
                    client.write(rdsServerName)
                        .tag({ app: [process.env.npm_package_name] })
                        .field({
                            "servername": rdsUserSession[i].ServerName ? rdsUserSession[i].ServerName : '',
                            "HostServer": rdsUserSession[i].HostServer ? rdsUserSession[i].HostServer : '',
                            "username": rdsUserSession[i].UserName ? rdsUserSession[i].UserName : '',
                            "serveripaddress": rdsUserSession[i].ServerIPAddress ? rdsUserSession[i].ServerIPAddress : '',
                            "sessionstate": rdsUserSession[i].SessionState ? rdsUserSession[i].SessionState : 0.0,
                            "CollectionName": rdsUserSession[i].CollectionName ? rdsUserSession[i].CollectionName : ''

                        })
                        .set({ RP: rpRDS })
                        .then(() => { console.info('write point success(serverRDSInformation)') })
                        .catch(err => { console.error(err) });
                }
            } else {
                client.write(rdsServerName)
                    .tag({ app: [process.env.npm_package_name] })
                    .field({
                        "servername": rdsUserSession.ServerName ? rdsUserSession.ServerName : '',
                        "HostServer": rdsUserSession.HostServer ? rdsUserSession.HostServer : '',
                        "username": rdsUserSession.UserName ? rdsUserSession.UserName : '',
                        "serveripaddress": rdsUserSession.ServerIPAddress ? rdsUserSession.ServerIPAddress : '',
                        "sessionstate": rdsUserSession.SessionState ? rdsUserSession.SessionState : 0.0,
                        "CollectionName": rdsUserSession.CollectionName ? rdsUserSession.CollectionName : ''
                    })
                    .set({ RP: rpRDS })
                    .then(() => { console.info('write point success(serverRDSInformation)') })
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