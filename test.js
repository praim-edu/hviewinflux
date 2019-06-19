let mocha = require('mocha').describe
let expect = require("chai").expect
let request = require('request')

let sendHVDataToInflux = require('./index.js').sendHVDataToInflux
let sendCitrixDataToInflux = require('./index.js').sendCitrixDataToInflux
let sendRDSDataToInflux = require('./index.js').sendRDSDataToInflux

describe("Test Hview77 REST GET", function () {
  it("connection to server", function () {
    let hview77 = request('http://hview77.sup.praim.com:8000/')
    expect(hview77) != null
    describe("Test rest give Hview77 json", function () {
      it("Test rest give json", function () {
        let hview77 = request('http://hview77.sup.praim.com:8000/SessionLocalSummaryView/sessiondata')
        expect(hview77) == JSON
        describe("test inserimento dati Hview77 ", function () {
          it("test inserimento dati ", function () {
            var isValid = sendHVDataToInflux((err, res) => { return res })
            isValid == true;
          })
        })
      })
    })
  })
})

describe("Test xendesk715 REST GET", function () {
  it("connection to server", function () {
    let xendesk715 = request('http://xendesk715.sup.praim.com:8000/')
    expect(xendesk715) != null
    describe("Test rest give xendesk715 json", function () {
      it("Test rest give xendesk715 json", function () {
        let xendesk715 = request('http://xendesk715.sup.praim.com:8000/get-brokermachine')
        expect(xendesk715) == JSON
        describe("test inserimento dati xendesk715 ", function () {
          it("test inserimento dati xendesk715 ", function () {
            var isValid = sendCitrixDataToInflux((err, res) => { return res })
            isValid == true;
          })
        })
      })
    })
  })
})

describe("Test rds2019-1 REST GET", function () {
  it("connection to server", function () {
    let rds2019 = request('http://rds2019-1.sup.praim.com:8000/')
    expect(rds2019) != null
    describe("Test rest give rds2019 json", function () {
      it("Test rest give rds2019 json", function () {
        let rds2019 = request('http://rds2019-1.sup.praim.com:8000/Get-RDUserSession')
        expect(rds2019) == JSON
        describe("test inserimento dati rds2019 ", function () {
          it('test inserimento dati rds2019 ', function () {
            var isValid = sendCitrixDataToInflux((err, res) => { return res })
            isValid == true;
          })
        })
      })
    })
  })
})

describe("Test influx online", function () {
  it("connection to server", function () {
    let rds2019 = request('http://10.2.138.212:8086/mydb')
    expect(rds2019) != null
  })
})