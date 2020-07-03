/* © 2020 Envision Digital. All Rights Reserved. */

const express = require("express");
const { GatewayClient, SECURE_MODE } = require("enos-mqtt-sdk-nodejs");
const { invokeApi } = require("./poseidon");

const API_GATEWAY_URL = process.env.API_GATEWAY_URL;
const APP_ACCESS_KEY = process.env.APP_ACCESS_KEY;
const APP_ACCESS_SECRET = process.env.APP_ACCESS_SECRET;
const EDGE_GATEWAY_PRODUCT_KEY = process.env.EDGE_GATEWAY_PRODUCT_KEY;
const ORG_ID = process.env.ORG_ID;
const PPE_BROKER_URL = process.env.PPE_BROKER_URL;
const SUBDEVICE_MODEL_ID = process.env.SUBDEVICE_MODEL_ID;
const PORT = process.env.PORT;

const EDGE_TYPE_GATEWAY = 0;

const prefix = "enos-eco";
const assetTreeName = `${prefix}-asset-tree`;
const assetTreeRootNodeName = `${prefix}-asset-rootnode`;
const edgeGatewayName = `${prefix}-edge-gateway`;
const subDeviceProduct = `${prefix}-product`;
const subDeviceName = `${prefix}-subdevice`;

let edgeGatewayClient = null;
let cleanUpAssets = [];
let assetTree = {
  timezone: "+08:00",
  rootNode: {
    modelID: "EnOS_Edge_Standard_Model",
    name: {
      defaultValue: assetTreeRootNodeName,
      i18nValue: { "en_US": assetTreeRootNodeName }
    }
  },
  deviceNodes: {}
};

const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get("/ping", (req, res) => {
  res.send("OK");
});

app.post("/send-data", async (req, res) => {
  const deviceName = req.body.deviceName;
  const temp = req.body.temp;
  const timestamp = req.body.timestamp;
  const query = `deviceName like '${deviceName}'`;

  const devices = await searchDevice(ORG_ID, query);

  if (devices.length === 1) {
    const productKey = devices[0].productKey;
    const deviceKey = devices[0].deviceKey;
    const deviceSecret = devices[0].deviceSecret;

    const loginSubDeviceResponse = await edgeGatewayClient
      .subDeviceManagement.loginSubDevice({
        subDevice: {
          productKey: productKey,
          deviceKey: deviceKey,
          deviceSecret: deviceSecret
        }
      });

    if (loginSubDeviceResponse.code === 200) {
      const postMpResponse = await edgeGatewayClient
        .deviceData.postMeasurepoint({
          point: {
            measurepoints: {
              temp: temp
            },
            productKey: productKey,
            deviceKey: deviceKey,
            time: timestamp
          }
        });
      // console.log('post mp response: ', postMpResponse);
      res.send("success");
    } else {
      res.send("fail - unable to connect to sub device");
    }
  } else {
    res.send("fail - Either sub device do not exist or there are more than 1");
  }
});

const createProduct = async (orgID, modelID, productName) => {
  let url = `${API_GATEWAY_URL}/connect-service/v2.1/products?action=create`;
  const queryParams = [
    { key: "orgId", value: orgID }
  ];
  url += "&" + queryParams.map(e => e.key + "=" + e.value).join("&");
  let data = {
    biDirectionalAuth: false,
    modelId: modelID,
    dataFormat: "Json",
    productName: {
      defaultValue: productName,
      i18nValue: { "en_US": productName }
    },
    productType: "Device"
  };
  const response = await invokeApi(APP_ACCESS_KEY, APP_ACCESS_SECRET, url, data, "POST");
  // console.log(response.data);
  if (response.status !== 200) {
    throw new Error(`Fail to create product, error code: ${response.status}`);
  }
  return response.data.data;
}

const deleteProduct = async (orgID, productKey) => {
  let url = `${API_GATEWAY_URL}/connect-service/v2.1/products?action=delete`;
  const queryParams = [
    { key: "orgId", value: orgID },
    { key: "productKey", value: productKey }
  ];
  url += "&" + queryParams.map(e => e.key + "=" + e.value).join("&");
  const response = await invokeApi(APP_ACCESS_KEY, APP_ACCESS_SECRET, url, null, "POST");
  console.log(response.data);
  if (response.status !== 200) {
    throw new Error(`Fail to delete product, error code: ${response.status}`);
  }
  return response.data.data;
}

const createDevice = async (orgID, timezone, deviceName, productKey, edgeType = null) => {
  let url = `${API_GATEWAY_URL}/connect-service/v2.1/devices?action=create`;
  const queryParams = [
    { key: "orgId", value: orgID }
  ];
  url += "&" + queryParams.map(e => e.key + "=" + e.value).join("&");
  let data = {
    productKey: productKey,
    timezone: timezone,
    deviceName: {
      defaultValue: deviceName,
      i18nValue: { "en_US": deviceName }
    },
    deviceAttributes: {}
  };
  if (edgeType !== null) {
    data.deviceAttributes["edge_type"] = edgeType;
    data.deviceAttributes["version"] = "0.1";
  }
  const response = await invokeApi(APP_ACCESS_KEY, APP_ACCESS_SECRET, url, data, "POST");
  if (response.status !== 200) {
    throw new Error(`Fail to create device, error code: ${response.status}`);
  }
  return response.data.data;
}

const deleteDevice = async (orgID, assetID) => {
  let url = `${API_GATEWAY_URL}/connect-service/v2.1/devices?action=delete`;
  const queryParams = [
    { key: "orgId", value: orgID },
    { key: "assetId", value: assetID }
  ];
  url += "&" + queryParams.map(e => e.key + "=" + e.value).join("&");
  const response = await invokeApi(APP_ACCESS_KEY, APP_ACCESS_SECRET, url, null, "POST");
  console.log(response.data);
  if (response.status !== 200) {
    throw new Error(`Fail to delete device, error code: ${response.status}`);
  }
  return response.data.data;
}

const searchDevice = async (orgID, query) => {
  let url = `${API_GATEWAY_URL}/connect-service/v2.1/devices?action=search`;
  const queryParams = [
    { key: "orgId", value: orgID }
  ];
  url += "&" + queryParams.map(e => e.key + "=" + e.value).join("&");
  let data = {
    expression: query
  };
  const response = await invokeApi(APP_ACCESS_KEY, APP_ACCESS_SECRET, url, data, "POST");
  // console.log(response.data);
  if (response.status !== 200) {
    throw new Error(`Fail to search device, error code: ${response.status}`);
  }
  return response.data.data;
}

const enableDevice = async (orgID, assetID, productKey, deviceKey) => {
  let url = `${API_GATEWAY_URL}/connect-service/v2.1/devices?action=enable`;
  const queryParams = [
    { key: "orgId", value: orgID }
  ];
  if (assetID) {
    queryParams.push({ key: "assetId", value: assetID });
  } else {
    queryParams.push({ key: "productKey", value: productKey });
    queryParams.push({ key: "deviceKey", value: deviceKey });
  }
  url += "&" + queryParams.map(e => e.key + "=" + e.value).join("&");
  const response = await invokeApi(APP_ACCESS_KEY, APP_ACCESS_SECRET, url, null, "POST");
  if (response.status !== 200) {
    throw new Error(`Fail to create device, error code: ${response.status}`);
  }
  return response.data.data;
}

const attachSubDeviceToEdgeGateway = async (orgID, edgeGatewayAssetID, subDeviceAssetIDs) => {
  let url = `${API_GATEWAY_URL}/connect-service/v2.1/device-topos?action=addSubDevice`;
  const queryParams = [
    { key: "orgId", value: orgID }
  ];
  url += "&" + queryParams.map(e => e.key + "=" + e.value).join("&");
  let data = {
    "gateway": {
      "assetId": edgeGatewayAssetID
    },
    "subDevices": subDeviceAssetIDs.map((assetID) => {
      return {
        "assetId": assetID
      };
    })
  };
  const response = await invokeApi(APP_ACCESS_KEY, APP_ACCESS_SECRET, url, data, "POST");
  // console.log(response.data);
  if (response.status !== 200) {
    throw new Error(`Fail to attach sub device to edge device, error code: ${response.status}`);
  }
  return response.data.data;
}

const createAssetTreeV2 = async (orgID, assetID) => {
  let url = `${API_GATEWAY_URL}/asset-tree-service/v2.1/asset-trees?action=associate`;
  const queryParams = [
    { key: "orgId", value: orgID },
    { key: "assetId", value: assetID }
  ];
  url += "&" + queryParams.map(e => e.key + "=" + e.value).join("&");
  const response = await invokeApi(APP_ACCESS_KEY, APP_ACCESS_SECRET, url, null, "POST");
  // console.log(response.data);
  if (response.status !== 200) {
    throw new Error(`Fail to create asset tree, error code: ${response.status}`);
  }
  return response.data.data;
}

const getAssetTree = async (orgID, treeID) => {
  let url = `${API_GATEWAY_URL}/asset-tree-service/v2.1/asset-trees?action=get`;
  const queryParams = [
    { key: "orgId", value: orgID },
    { key: "treeId", value: treeID }
  ];
  url += "&" + queryParams.map(e => e.key + "=" + e.value).join("&");
  const response = await invokeApi(APP_ACCESS_KEY, APP_ACCESS_SECRET, url, null, "GET");
  // console.log(response.data);
  if (response.status !== 200) {
    throw new Error(`Fail to get asset tree and root node, error code: ${response.status}`);
  }
  return response.data.data;
}

const deleteAssetTree = async (orgID, treeID) => {
  let url = `${API_GATEWAY_URL}/asset-tree-service/v2.1/asset-trees?action=delete`;
  const queryParams = [
    { key: "orgId", value: orgID },
    { key: "treeId", value: treeID }
  ];
  url += "&" + queryParams.map(e => e.key + "=" + e.value).join("&");
  const response = await invokeApi(APP_ACCESS_KEY, APP_ACCESS_SECRET, url, null, "POST");
  // console.log(response.data);
  if (response.status !== 200) {
    throw new Error(`Fail to delete asset tree, error code: ${response.status}`);
  }
  return response.data.data;
}

const deleteAssetTreeNode = async (orgID, treeID, assetID) => {
  let url = `${API_GATEWAY_URL}/asset-tree-service/v2.1/asset-nodes?action=delete`;
  const queryParams = [
    { key: "orgId", value: orgID },
    { key: "treeId", value: treeID },
    { key: "assetId", value: assetID }
  ];
  url += "&" + queryParams.map(e => e.key + "=" + e.value).join("&");
  const response = await invokeApi(APP_ACCESS_KEY, APP_ACCESS_SECRET, url, null, "POST");
  // console.log(response.data);
  if (response.status !== 200) {
    throw new Error(`Fail to delete asset tree node, error code: ${response.status}`);
  }
  return response.data.data;
}

const attachAssetToAssetTree = async (orgID, treeID, parentAssetID, assetID) => {
  let url = `${API_GATEWAY_URL}/asset-tree-service/v2.1/asset-nodes?action=associateAsset`;
  const queryParams = [
    { key: "orgId", value: orgID },
    { key: "treeId", value: treeID },
    { key: "parentAssetId", value: parentAssetID },
    { key: "assetId", value: assetID }
  ];
  url += "&" + queryParams.map(e => e.key + "=" + e.value).join("&");
  const response = await invokeApi(APP_ACCESS_KEY, APP_ACCESS_SECRET, url, null, "POST");
  // console.log(response.data);
  if (response.status !== 200) {
    throw new Error(`Fail to attach asset to asset tree, error code: ${response.status}`);
  }
  return response.data.data;
};

// This is the setup script for demo to prepare the demo environment.
const setup = async () => {
  try {
    // create subdevice product
    const subDeviceProductKey = await createProduct(
      ORG_ID, SUBDEVICE_MODEL_ID,
      subDeviceProduct);

    // create subdevice
    const subDeviceDetails = await createDevice(
      ORG_ID, assetTree.timezone, subDeviceName,
      subDeviceProductKey);

    // create edge gateway
    const edgeDeviceDetails = await createDevice(
      ORG_ID, assetTree.timezone, edgeGatewayName,
      EDGE_GATEWAY_PRODUCT_KEY,
      EDGE_TYPE_GATEWAY);

    // enable subdevice
    await enableDevice(
      ORG_ID, subDeviceDetails.assetId,
      subDeviceDetails.productKey,
      subDeviceDetails.deviceKey);

    // enable edge gateway    
    await enableDevice(
      ORG_ID, edgeDeviceDetails.assetId,
      edgeDeviceDetails.productKey,
      edgeDeviceDetails.deviceKey);

    // attach the subdevice to edge gateway
    await attachSubDeviceToEdgeGateway(
      ORG_ID, edgeDeviceDetails.assetId,
      [subDeviceDetails.assetId]
    );

    const assetTreeID = await createAssetTreeV2(
      ORG_ID, edgeDeviceDetails.assetId);

    const assetTreeDetails = await getAssetTree(ORG_ID, assetTreeID);

    // attach edge device to asset tree
    let parentAssetID = assetTreeDetails.asset.assetId;
    let assetID = edgeDeviceDetails.assetId;
    await attachAssetToAssetTree(ORG_ID, assetTreeID, parentAssetID, assetID);

    // attach edge device to asset tree
    parentAssetID = edgeDeviceDetails.assetId;
    assetID = subDeviceDetails.assetId;
    await attachAssetToAssetTree(ORG_ID, assetTreeID, parentAssetID, assetID);

    // update assetTree for edge gateway
    assetTree.deviceNodes[edgeGatewayName] = {
      type: "edge",
      name: edgeGatewayName,
      assetId: edgeDeviceDetails.assetId,
      productKey: edgeDeviceDetails.productKey,
      deviceKey: edgeDeviceDetails.deviceKey,
      deviceSecret: edgeDeviceDetails.deviceSecret,
      subdevices: [
        {
          type: "subdevice",
          name: subDeviceName,
          assetId: subDeviceDetails.assetId,
          productKey: subDeviceDetails.productKey,
          deviceKey: subDeviceDetails.deviceKey,
          deviceSecret: subDeviceDetails.deviceSecret
        }
      ]
    };

    // build up clean up asset list, used at clean up
    cleanUpAssets = [
      subDeviceDetails.assetId,
      edgeDeviceDetails.assetId,
      assetTreeID,
      subDeviceProductKey
    ];
  } catch (err) {
    console.error(err, err.stack);
  }
}

const cleanUp = async () => {
  console.log("cleaning up");

  let subDeviceAssetID = cleanUpAssets[0];
  let edgeDeviceAssetID = cleanUpAssets[1];
  let assetTreeID = cleanUpAssets[2];
  let productKey = cleanUpAssets[3];

  await deleteAssetTreeNode(ORG_ID, assetTreeID, subDeviceAssetID);
  await deleteAssetTreeNode(ORG_ID, assetTreeID, edgeDeviceAssetID);
  await deleteAssetTree(ORG_ID, assetTreeID);

  await deleteDevice(ORG_ID, subDeviceAssetID);
  await deleteDevice(ORG_ID, edgeDeviceAssetID);

  await deleteProduct(ORG_ID, productKey);
}

const initEdgeGatewayClient = async () => {
  try {
    // fire up the edge device
    const clientOptions = {
      brokerUrl: PPE_BROKER_URL,
      secureMode: SECURE_MODE.VIA_DEVICE_SECRET,
      productKey: assetTree.deviceNodes[edgeGatewayName].productKey,
      deviceKey: assetTree.deviceNodes[edgeGatewayName].deviceKey,
      deviceSecret: assetTree.deviceNodes[edgeGatewayName].deviceSecret,
      mqttOptions: {
        connectionTimeout: 30,
        reconnectPeriod: 0,
        keepAlive: 0
      }
    }
    edgeGatewayClient = new GatewayClient(clientOptions);

    // listen to 'connect' event
    edgeGatewayClient.on('connect', () => {
      console.log('connected');
    });

    // listen to 'close' event
    edgeGatewayClient.on('close', () => {
      console.log('connection closed');
    });

    await edgeGatewayClient.connect();
  } catch (err) {
    console.error(err, err.stack);
  }
}

const cleanUpHandler = (callback) => {
  // catch ctrl+c event and exit normally
  process.on("SIGINT", async () => {
    console.log("Ctrl-C...");
    await callback();
    process.exit(2);
  });

  process.on("SIGTERM", async () => {
    console.log("Ctrl-C...");
    await callback();
    process.exit(3);
  });

  //catch uncaught exceptions, trace, then exit normally
  process.on("uncaughtException", (e) => {
    console.log("Uncaught Exception...");
    console.log(e.stack);
    process.exit(99);
  });
};

(async () => {
  await setup();
  await initEdgeGatewayClient();
  await cleanUpHandler(cleanUp);
  app.listen(PORT, () => {
    console.log(`Edge gateway listening at http://localhost:${PORT}`);
  });
})();