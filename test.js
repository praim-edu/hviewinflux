const axios = require('axios')
const Influx = require('influxdb-nodejs')
const client = new Influx('http://10.2.138.212:8086/mydb')

const hvServerName = "hview77.sup.praim.com"

client.query(hvServerName)
  .where('app', 'hviewinflux')
  .then(console.info)
  .catch(console.error);