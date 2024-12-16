const crypto = require("crypto");
const https = require("https");

class MomoPayment {
  constructor() {
    this.partnerCode = "MOMOBKUN20180529";
    this.accessKey = "klm05TvNBzhg7h7j";
    this.secretKey = "at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa";
    this.endpoint = "test-payment.momo.vn";
  }

  async createPayment({ amount, bookingId, userId }) {
    try {
      const roundedAmount = Math.round(amount);
      
      const requestId = `${this.partnerCode}_${Date.now()}`;
      const orderId = requestId;
      const orderInfo = `Payment for booking #${bookingId}`;
      const redirectUrl = `${process.env.CLIENT_URL}/account/bookings/${bookingId}`;
      const ipnUrl = `${process.env.API_URL}/payment/momo/notify/${bookingId}`;
      const extraData = "";

      const rawSignature = [
        `partnerCode=${this.partnerCode}`,
        `accessKey=${this.accessKey}`,
        `requestId=${requestId}`,
        `amount=${roundedAmount}`,
        `orderId=${orderId}`,
        `orderInfo=${orderInfo}`,
        `redirectUrl=${redirectUrl}`,
        `ipnUrl=${ipnUrl}`,
        `extraData=${extraData}`,
        `requestType=payWithATM`
      ].join("&");

      const signature = crypto
        .createHmac("sha256", this.secretKey)
        .update(rawSignature)
        .digest("hex");

      const requestBody = {
        partnerCode: this.partnerCode,
        accessKey: this.accessKey,
        requestId: requestId,
        amount: roundedAmount,
        orderId: orderId,
        orderInfo: orderInfo,
        redirectUrl: redirectUrl,
        ipnUrl: ipnUrl,
        extraData: extraData,
        requestType: "payWithATM",
        bankCode: "SML",
        signature: signature,
        lang: "vi"
      };

      console.log("MoMo Request:", {
        ...requestBody,
        rawSignature,
        amount: roundedAmount
      });

      return new Promise((resolve, reject) => {
        const options = {
          hostname: this.endpoint,
          port: 443,
          path: "/v2/gateway/api/create",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(JSON.stringify(requestBody))
          }
        };

        const req = https.request(options, (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            try {
              const response = JSON.parse(data);
              console.log("MoMo Response:", response);
              
              if (response.resultCode === 0) {
                resolve(response);
              } else {
                console.error("MoMo Error Response:", response);
                reject(new Error(response.message || "MoMo payment failed"));
              }
            } catch (error) {
              console.error("Error parsing MoMo response:", error);
              reject(error);
            }
          });
        });

        req.on("error", (error) => {
          console.error("MoMo Request Error:", error);
          reject(error);
        });

        req.write(JSON.stringify(requestBody));
        req.end();
      });
    } catch (error) {
      console.error("MoMo Service Error:", error);
      throw error;
    }
  }
}

module.exports = new MomoPayment();
