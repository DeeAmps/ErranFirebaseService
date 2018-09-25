const { sendSms } = require("./smsHelper")
const smsMessages = require("../config/notificationMessages")
const notification = require("./sendNotification");
const Promise = require('promise');
const { ridersRef, adminPickupRef, adminAccountRef, vehicleLowAccountAmountRef, riderEarningsRef } = require("../db/init");

const creditRider = (amt, riderId) => {
    ridersRef.child(riderId).child("amount").transaction((currentAmount) => {
        return currentAmount + amt;
    },(err) => {
        if(err) console.log("Error ", err);
    });
    return new Promise((resolve, reject) => {
        resolve(rslts = {done: true}, false)
    });

}

const riderLogTopUpHistory = (riderId, currentAmount,ramount, purpose) => {
    riderEarningsRef.child("cancellations").child(riderId).push({
        account: currentAmount,
        amount: ramount,
        balance: currentAmount + ramount,
        date: Date.now(),
        id: riderId,
        paymentType: "Cash",
        purpose: purpose,
        transactionID:"",
        type: ""
    }, (err) => {
        if(err) console.log(err);
        return;
    });
}

const creditCompany = (amount) => {
    console.log("Crediting company!")
    adminAccountRef.child("amount").transaction((currentAmount) => {
        return currentAmount + amount;
    },(err) => {
        if(err) console.log("Error ", err)
        return;
    });
    return;
}

const loopRequests = (data, userPhone) => {
    let requestsKeys = Object.keys(data);
    requestsKeys.forEach((key) => {
        let obj = data[key];
        if(obj.delivered && !obj.deliveryNotification){
            state = "delivery";
            notification.notified(userPhone, state, key)
            notification.setRiderPickUpNotification(state, userPhone,key);
        }
        if(obj.status && !obj.statusNotification){
            state = "status";
            notification.notified(userPhone, state, key);
            notification.setRiderPickUpNotification(state, userPhone, key)
        }
        if(obj.journeyStarted && !obj.journeyStartedNotification ){
            state = "journey_started";
            notification.notified(userPhone, state, key)
            notification.setRiderPickUpNotification(state, userPhone, key)
        }
        if(obj.cancelled){
            checkAndRemoveFromAdmin(key)
        }
    })
}

const checkAndRemoveFromAdmin = (key) => {
    adminPickupRef.once("value", (snapshot) =>{
        if (snapshot.hasChild(key)) {
            adminPickupRef.child(key).remove((err) => {
                return
            })
        }
    },(err) => {
        if(err) console.log("Error ", err)
        return
    })
}

const handleChildChange = (snapshot) => {
    let sendSms = false;
    let lowAmount = false;
    let data = { amountNotification: { noAmount: false, lowAmount: false } };
    const childReq = snapshot.exportVal();
    const riderId = snapshot.ref.key;
    const vehicleType = childReq.type
    const lowAmountNotified = childReq.amountNotification.lowAmount
    const noAmountNotified = childReq.amountNotification.noAmount
    const { amount } = childReq;
    vehicleLowAccountAmountRef.on("value", (snapshot) => {
        let lowAmountThreshold = snapshot.val()[vehicleType]
        if(!lowAmountNotified && (amount <= lowAmountThreshold && amount > 0)){
            data.amountNotification.lowAmount = true;
            sendSms = true;
            return updateAndSend(data, sendSms, riderId, childReq, lowAmount);
        }
        else if(!noAmountNotified && (amount <= 0)){
            sendSms = true;
            data.amountNotification.noAmount = true;
            return updateAndSend(data, sendSms, riderId, childReq, lowAmount)
        }
        else{
            return;
        }
    }); 
}

const updateAndSend = (data, sendSms, riderId, childReq, lowAmount) => {
    if(sendSms){
        ridersRef.child(riderId).update(data => {
            lowOrNoAmountNotification(childReq, lowAmount)
        },(err) => {
            if(err) console.log("Error ", err)
            return
        });
    }
    
}

const lowOrNoAmountNotification = (childReq, lowAmount) => {
    const riderMsisdn = childReq.phone
    let sms = ""
    const canSendSms = (childReq.isActive && childReq.isAuth && childReq.isAvailable)
    if(lowAmount && canSendSms){
        sms = smsMessages.SMS_LOW_AMOUNT
    }
    else if(!lowAmount && canSendSms){
        sms = smsMessages.SMS_NO_AMOUNT
    }
    return sendSms(riderMsisdn, undefined, sms , undefined);
}

module.exports = {
    loopRequests,
    handleChildChange, 
    lowOrNoAmountNotification,
    creditRider,
    riderLogTopUpHistory,
    creditCompany
}