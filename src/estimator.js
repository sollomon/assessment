const express = require('express')
const morgan = require('morgan');
const winston = require('./config/winston');
const cors = require('cors');
const xml = require('xml');
// const logs = require('./logs/app.log');

const app = express();
app.use(cors());

app.use(morgan('combined',{stream:winston.stream}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post('/api/v1/on-covid-19',(req,res)=>{
    const reqData = req.body.data
    const response = covid19ImpactEstimator(reqData);
    res.status(200).json(response);
})

app.post('/api/v1/on-covid-19/json',(req,res)=>{
    const reqData = req.body.data
    const response = covid19ImpactEstimator(reqData);
    res.status(200).json(response);
})

app.post('/api/v1/on-covid-19/xml',(req,res)=>{
    const reqData = req.body.data
    const response = covid19ImpactEstimator(reqData);
    console.log(xml(response))
    res.status(200).set('Content-Type', 'text/xml').send(xml(response));
})

app.get('/api/v1/on-covid-19/logs',(req,res)=>{
    res.send('TODO :://logs')
})

app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    winston.error(` ${req.originalUrl}`);
    res.status(err.status || 500);
    res.send('Error happened!!');
});

app.listen(4000,()=>console.log('Server on port 4000'))

const data = {
    region: {
        name: "Africa",
        avgAge: 19.7,
        avgDailyIncomeInUSD: 5,
        avgDailyIncomePopulation: 0.71
    },
    periodType: "days",
    timeToElapse: 58,
    reportedCases: 674,
    population: 66622705,
    totalHospitalBeds: 1380614
}

var output = {
    data,
    impact:{},
    severeImpact:{}
}

// var currentImpact =  output.impact.currentlyInfected = data.reportedCases * 10;
// var currentSevere = output.severeImpact.currentlyInfected = data.reportedCases * 50;
// var requestedTime = 30 // 30 days

// var set = requestedTime / 3;

// var infectionsByRequestedTime = {
//     impact:currentImpact * Math.pow(2,set),
//     severeImpact:currentSevere * Math.pow(2,set)
// }

// var severeCasesByRequestedTime  = 0.15 * infectionsByRequestedTime.severeImpact

const normalizeTime = (periodType,timeToElapse) => {
    switch (periodType) {
        case 'days':
            return timeToElapse;
        case 'weeks':
            return (timeToElapse / 7).toFixed(0);
        case 'months':
            return (timeToElapse / 30).toFixed(0);
        default:
            return timeToElapse;
    }
}

const covid19ImpactEstimator = (data) => {
    output.data = data
    output.impact.currentlyInfected = data.reportedCases * 10
    output.severeImpact.currentlyInfected = data.reportedCases * 50

    const time = normalizeTime(data.periodType,data.timeToElapse);
    const set = (time/3).toFixed(0);
    output.impact.infectionsByRequestedTime = output.impact.currentlyInfected * Math.pow(2,set);
    output.severeImpact.infectionsByRequestedTime = output.severeImpact.currentlyInfected * Math.pow(2,set);

    output.impact.severeCasesByRequestedTime = output.impact.infectionsByRequestedTime * 0.15
    output.severeImpact.severeCasesByRequestedTime = output.severeImpact.infectionsByRequestedTime * 0.15

    output.impact.hospitalBedsByRequestedTime = (data.totalHospitalBeds * 0.35).toFixed(0) - output.impact.severeCasesByRequestedTime
    output.severeImpact.hospitalBedsByRequestedTime = (data.totalHospitalBeds * 0.35).toFixed(0) - output.severeImpact.severeCasesByRequestedTime

    output.impact.casesForICUByRequestedTime = 0.05 * output.impact.infectionsByRequestedTime
    output.severeImpact.casesForICUByRequestedTime = 0.05 * output.impact.infectionsByRequestedTime

    output.impact.casesForVentilatorsByRequestedTime = 0.02 * output.impact.infectionsByRequestedTime
    output.severeImpact.casesForVentilatorsByRequestedTime = 0.02 * output.severeImpact.infectionsByRequestedTime

    output.impact.dollarsInFlight = output.impact.infectionsByRequestedTime * data.region.avgDailyIncomePopulation * data.region.avgDailyIncomeInUSD * 30
    output.severeImpact.dollarsInFlight = output.severeImpact.infectionsByRequestedTime * data.region.avgDailyIncomePopulation * data.region.avgDailyIncomeInUSD * 30

    return output
};
