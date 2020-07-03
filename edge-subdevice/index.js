/* © 2020 Envision Digital. All Rights Reserved. */

const axios = require("axios");

const EDGE_GATEWAY_URL=`http://${process.env.EDGE_GATEWAY_IP}:${process.env.EDGE_GATEWAY_PORT}/send-data`;

try {
  setInterval(async () => {
    let temp = Math.floor(Math.random() * 101);
    const res = await axios({
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      url: EDGE_GATEWAY_URL,
      data: {
        deviceName: "eco-subdevice",
        temp: temp,
        timestamp: + new Date()
      }
    });
  }, 1000);
} catch(err) {
  console.error(err, err.stack);
}

