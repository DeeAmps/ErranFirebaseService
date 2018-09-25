const axios = require("axios")
const smsUrl = require("../config/env.config").SMS_URL

const sendSms = (msisdn, shortCode = "ERRANDA", text, smsc="RANCARD") => {
    axios.get(`${smsUrl}?username=ecotech&password=tEn$syg&to=${msisdn}&from=${shortCode}&text=${text}&smsc=${smsc}`)
    return;
}


module.exports = {
    sendSms
}