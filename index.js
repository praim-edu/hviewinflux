const Influx = require('influxdb-nodejs')
const client = new Influx('http://10.2.138.212:8086/mydb')
const axios = require('axios')

const hvServerName = "hview77.sup.praim.com"
const hvServerUrl = "http://" + hvServerName + ":8000/"
const hvServerCPU = "cpu"
const hvServerRAM = "ram"
const hvServerIO = "diskio"
const hvServerMB = "diskusage"
const hvServerVM = "SessionLocalSummaryView/"
const rp = 'test-rp';

// i --> integer
// s --> string
// f --> float
// b --> boolean
const fieldSchema = {
    // from namesdata
    machineorrdsservername: 's',
    agentversion: 's',
    desktopname: 's',
    desktoptype: 's',
    clientaddress: 's',
    sessiontype: 's',
    username: 's',
    // from sessiondata
    sessionprotocol: 's',
    sessionstate: 's',
    starttime: 's',
    disconnecttime: 's'
};
const tagSchema = {
    app: ['hviewinflux'],
};

function sendHVDataToInflux() {
    client.createDatabase().then(() => client.createRetentionPolicy(rp, '2h')).then(() => {
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
                            .set({ RP: rp })
                            .then(() => { console.info('write point success(serverInformation)') })
                            .catch(err => { console.error(err) });
                    }
                }
            }).catch(err => { console.error(err) })
        }).catch(err => { console.error(err) })
    }).catch(err => { console.error(err) })
}

function sendServerHealthToInflux() {
    client.createDatabase().then(() => client.createRetentionPolicy(rp, '2h')).then(() => {
        let cpu
        let ram
        let io
        let mb
        // make a get request to the url
        axios({
            method: 'get',
            url: hvServerUrl + hvServerCPU,
            headers: { 'Accept': 'application/json' },
        }).then(res => {
            cpu = res.data;
            axios({
                method: 'get',
                url: hvServerUrl + hvServerRAM,
                headers: { 'Accept': 'application/json' },
            }).then(res => {
                ram = res.data;
                axios({
                    method: 'get',
                    url: hvServerUrl + hvServerMB,
                    headers: { 'Accept': 'application/json' },
                }).then(res => {
                    mb = res.data;
                    client.write(hvServerName)
                        .tag({ app: ['hviewinflux'] })
                        .field({
                            "cpu": cpu,
                            "ram": ram,
                            "mb": mb
                        })
                        .set({ RP: rp })
                        .then(() => { console.info('write point success(cpu_ram_mb)') })
                        .catch(err => { console.error(err) });
                }).catch(err => { console.error(err) })
            }).catch(err => { console.error(err) })
        }).catch(err => { console.error(err) })
    }).catch(err => { console.error(err) })
}
function sendServerDiskIOToInflux() {
    client.createDatabase().then(() => client.createRetentionPolicy(rp, '2h')).then(() => {
        let io

        // make a get request to the url
        axios({
            method: 'get',
            url: hvServerUrl + hvServerIO,
            headers: { 'Accept': 'application/json' },
        }).then(res => {
            client.write(hvServerName)
                .tag({ app: ['hviewinflux'] })
                .field({
                    "io": res.data,
                })
                .set({ RP: rp })
                .then(() => { console.info('write point success(io)') })
                .catch(err => { console.error(err) });
        }).catch(err => { console.error(err) })
    }).catch(err => { console.error(err) })
}
// horizon view data every 10 minutes
setInterval(sendHVDataToInflux, 600 * 1000);

// server health every 1 minute
setInterval(sendServerHealthToInflux, 60 * 1000);

// server health every 5 seconds
setInterval(sendServerDiskIOToInflux, 5 * 1000);

