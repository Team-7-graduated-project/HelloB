const crypto = require('crypto');
const axios = require('axios');

const config = {
  partnerCode: process.env.MOMO_PARTNER_CODE,
  accessKey: process.env.MOMO_ACCESS_KEY,
  secretKey: process.env.MOMO_SECRET_KEY,
  apiEndpoint: process.env.MOMO_API_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api',
  redirectUrl: process.env.CLIENT_URL + '/payment/success',
  ipnUrl: process.env.SERVER_URL + '/api/payment/momo/notify',
};

const createPayment = async ({ amount, bookingId, userId }) => {
  try {
    // Generate unique orderId
    const orderId = `MOMO_${Date.now()}_${bookingId}`;
    const requestId = orderId;

    // Create signature data
    const rawSignature = `accessKey=${config.accessKey}&amount=${amount}&extraData=${Buffer.from(JSON.stringify({
      bookingId,
      userId,
      orderId,
      key: 'payment'
    })).toString('base64')}&ipnUrl=${config.ipnUrl}&orderId=${orderId}&orderInfo=Payment for booking ${bookingId}&partnerCode=${config.partnerCode}&redirectUrl=${config.redirectUrl}&requestId=${requestId}&requestType=captureWallet`;

    // Create signature
    const signature = crypto
      .createHmac('sha256', config.secretKey)
      .update(rawSignature)
      .digest('hex');

    // Create request body
    const requestBody = {
      partnerCode: config.partnerCode,
      accessKey: config.accessKey,
      requestId: requestId,
      amount: amount,
      orderId: orderId,
      orderInfo: `Payment for booking ${bookingId}`,
      redirectUrl: config.redirectUrl,
      ipnUrl: config.ipnUrl,
      requestType: 'captureWallet',
      extraData: Buffer.from(JSON.stringify({
        bookingId,
        userId,
        orderId,
        key: 'payment'
      })).toString('base64'),
      signature: signature,
      lang: 'vi'
    };

    // Make request to MoMo API
    const response = await axios.post(
      `${config.apiEndpoint}/create`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(JSON.stringify(requestBody))
        }
    });

    // Validate response
    if (response.data.resultCode === 0) {
      return {
        payUrl: response.data.payUrl,
        orderId: orderId,
        requestId: requestId,
        signature: signature
      };
    } else {
      throw new Error(response.data.message || 'Failed to create MoMo payment');
    }

  } catch (error) {
    console.error('MoMo payment creation error:', error);
    throw new Error('Failed to initialize MoMo payment');
  }
};

// Add function to verify MoMo payment response
const verifyPayment = async (momoResponse) => {
  try {
    const { orderId, requestId, amount, resultCode, transId, extraData, signature } = momoResponse;

    // Recreate signature for verification
    const rawSignature = `accessKey=${config.accessKey}&amount=${amount}&extraData=${extraData}&orderId=${orderId}&orderInfo=Payment for booking&partnerCode=${config.partnerCode}&payType=webApp&requestId=${requestId}&responseTime=${Date.now()}&resultCode=${resultCode}&transId=${transId}`;

    const checkSignature = crypto
      .createHmac('sha256', config.secretKey)
      .update(rawSignature)
      .digest('hex');

    // Verify signature
    if (signature !== checkSignature) {
      throw new Error('Invalid signature');
    }

    return {
      isValid: true,
      orderId,
      amount,
      transId,
      extraData: JSON.parse(Buffer.from(extraData, 'base64').toString())
    };
  } catch (error) {
    console.error('MoMo payment verification error:', error);
    return { isValid: false, error: error.message };
  }
};

module.exports = {
  createPayment,
  verifyPayment
};
