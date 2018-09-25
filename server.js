const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
const https = require("https")
const { cancellationsRef, requestsRef, pickupRef, ridersRef  } = require("./db/init");
const axios = require("axios")
const { SERVICE_URL, API_URL } = require("./config/env.config")
const { loopRequests, riderLogTopUpHistory, handleChildChange, creditRider, creditCompany } = require("./helpers/listenerHelper")
require('dotenv').config();

let port = process.env.PORT || 8086;

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

app.get("/ping", (req, res) => res.send("Live!"));


cancellationsRef.child("users").orderByChild('date').startAt(Date.now()).on("child_added", (snapshot) => {
    const newNode = snapshot.val();
    let getAmount = newNode.amount;
    let riderId = newNode.riderId;
    ridersRef.child(riderId).once("value", (snapshot) => {
        let obj =  snapshot.val();
        let riderCurrentAmount = obj.amount;
        let riderAmountPercentage = getAmount * 0.8
        let companyAmountPercentage = getAmount - riderAmountPercentage
        creditRider(riderAmountPercentage, riderId).then(rslt => {
            if(rslt.done){
                riderLogTopUpHistory(riderId, riderCurrentAmount, riderAmountPercentage, "Trip Cancellation");
                creditCompany(companyAmountPercentage)
            }
        })
    })
},(err) => {
    if(err) console.log("Error ", err)
    return
});

// pickupRef.on('child_changed', (snapshot) => {
//     const childReq = snapshot.exportVal();
//     const riderId = snapshot.ref.key;
//     // if(childReq.accepted){
//     //     pickupRef.child(riderId).remove();
//     // }
//     if(childReq.rejected){
//         let parentReqId = childReq.userId;
//         let childReqId = childReq.requestId;
//         /; //Remove Rider from  Pick Up Collection
//         let parsedParentId = `%2B${parentReqId.split("+")[1]}`;
        // let requestUrl = `${API_URL}/api/getRider?requestId=${parsedParentId.trim()}&childRequestId=${childReqId.trim()}&rejected=true&riderId=${riderId.trim()}`;
        // axios.get(requestUrl)
        // .then(function (response) {
        //     return;
        // })
        // .catch(function(Err) {
        //     return;
        // });
//     }
// }, (err) => {
//     if(err) console.log("Error ", err)
//     return
// });

requestsRef.on('child_changed', (snapshot) => {
    const data = snapshot.val();
    return loopRequests(data, snapshot.ref.key);
},(err) => {
    if(err) console.log("Error ", err)
    return
});


ridersRef.on('child_changed', (snapshot) => {
    return handleChildChange(snapshot)
},(err) => {
    if(err) console.log("Error ", err)
    return
})

setInterval(() => {
    https.get(`${SERVICE_URL}/ping`);
}, 60000); // every 1 minutes (100000)


app.listen(port, () => {
    console.log(`Service running on localhost:${port}/api/`);
})