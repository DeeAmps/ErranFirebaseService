const firebase = require("firebase");
firebase.initializeApp({
	databaseURL: "https://erranda-app.firebaseio.com/",
});
const db = firebase.database();

const requestsRef = db.ref("requests");
const ridersRef = db.ref("riders");
const updatesRef = db.ref("updates");
const usersRef = db.ref("users");
const pickupRef = db.ref("pickup");
const adminPickupRef = db.ref("adminpickup");
const cancellationsRef = db.ref("cancellations");
const adminAccountRef = db.ref("adminAccount");
const accountHistoryRef = db.ref("accounthistory");
const riderEarningsRef = db.ref("riderEarnings");
const vehicleLowAccountAmountRef = db.ref("vehicleLowAccountAmount")

module.exports = {
    requestsRef,
    riderEarningsRef,
    ridersRef,
    accountHistoryRef,
    updatesRef,
    usersRef,
    pickupRef,
    adminPickupRef,
    cancellationsRef,
    adminAccountRef,
    vehicleLowAccountAmountRef
}