const crypto = require("crypto");
const https = require("https");

class MomoPayment {
  constructor() {
    this.partnerCode = process.env.MOMO_PARTNER_CODE;
    this.accessKey = process.env.MOMO_ACCESS_KEY;
    this.secretKey = process.env.MOMO_SECRET_KEY;
    this.endpoint = process.env.MOMO_ENDPOINT;
  }

  async createPayment({ amount, bookingId, userId }) {
    try {
      const requestId = this.partnerCode + new Date().getTime();
      const orderId = requestId;
      const orderInfo = `Payment for booking #${bookingId}`;
      const redirectUrl = `${process.env.CLIENT_URL}/account/bookings/${bookingId}`;
      const ipnUrl = `${process.env.API_URL}/payment/momo/notify/${bookingId}`;
      const requestType = "payWithATM";
      const extraData = Buffer.from(
        JSON.stringify({
          bookingId,
          userId,
          key: "payment",
          orderId: requestId,
          returnUrl: `/account/bookings/${bookingId}`,
          paymentId: null,
        })
      ).toString("base64");

      const rawSignature = [
        `accessKey=${this.accessKey}`,
        `amount=${amount}`,
        `extraData=${extraData}`,
        `ipnUrl=${ipnUrl}`,
        `orderId=${orderId}`,
        `orderInfo=${orderInfo}`,
        `partnerCode=${this.partnerCode}`,
        `redirectUrl=${redirectUrl}`,
        `requestId=${requestId}`,
        `requestType=${requestType}`,
      ].join("&");

      const signature = crypto
        .createHmac("sha256", this.secretKey)
        .update(rawSignature)
        .digest("hex");

      const requestBody = JSON.stringify({
        partnerCode: this.partnerCode,
        accessKey: this.accessKey,
        requestId: requestId,
        amount: amount,
        orderId: orderId,
        orderInfo: orderInfo,
        redirectUrl: redirectUrl,
        ipnUrl: ipnUrl,
        extraData: extraData,
        requestType: requestType,
        signature: signature,
        lang: "en",
      });

      return new Promise((resolve, reject) => {
        const options = {
          hostname: this.endpoint,
          port: 443,
          path: "/v2/gateway/api/create",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(requestBody),
          },
        };

        const req = https.request(options, (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            try {
              const response = JSON.parse(data);
              resolve(response);
            } catch (error) {
              reject(error);
            }
          });
        });

        req.on("error", (error) => {
          reject(error);
        });

        req.write(requestBody);
        req.end();
      });
    } catch (error) {
      console.error("MoMo payment creation error:", error);
      throw error;
    }
  }
}

module.exports = new MomoPayment();
