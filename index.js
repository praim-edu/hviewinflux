const Influx = require('influxdb-nodejs')
const client = new Influx('http://10.2.138.212:8086/mydb')
const axios = require('axios')

const hvServerName = "hview77.sup.praim.com"
const hvServerUrl = "http://" + hvServerName + ":8000/SessionLocalSummaryView/"
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

function sendDataToInflux(){
    client.createDatabase().then(() => client.createRetentionPolicy(rp, '2h')).then(() => {
        let namesData
        // make a get request to the url
        axios({
            method: 'get',
            url: hvServerUrl + "namesdata",
            headers: { 'Accept': 'application/json' }, // this api needs this header set for the request
        }).then(res => {
            namesData = res.data;
            axios({
                method: 'get',
                url: hvServerUrl + "sessiondata",
                headers: { 'Accept': 'application/json' },
            }).then(res => {
                sessionData = res.data;
                if (sessionData.length == namesData.length) {
                    for (let i = 0; i < sessionData.length; i++) {
                        client.write(hvServerName)
                            .tag({app: ['hviewinflux']})
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
                            .then(() => { console.info('write point success') })
                            .catch(err => { console.error(err) });
                        }
                    }
            }).catch(err => { console.error(err) })
        }).catch(err => { console.error(log) })
    }).catch(err => { console.error(log) })
}

setInterval(sendDataToInflux, 600*1000);