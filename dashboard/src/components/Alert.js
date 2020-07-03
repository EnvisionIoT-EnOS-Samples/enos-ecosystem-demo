/* © 2020 Envision Digital. All Rights Reserved. */

import React, { Component } from "react";
import moment from "moment";
export default class Alert extends Component {
  constructor(props) {
    super(props);
    this.state = {
      alert: null
    };
  }

  alertHandler = (data) => {
    const orgID = data.orgId;
    const modelID = data.modelId;
    const assetID = data.assetId;
    const timestamp = data.occurTime;
    const alertDesc = data.contentDesc.defaultValue;
    let alert = <div key={`alert-${timestamp}`} className="alert alert-dismissible alert-primary">
      <button type="button" className="close" data-dismiss="alert">&times;</button>
      <p>
        {`Organization ID: ${orgID}`}<br />
        {`Model ID: ${modelID}`} {`Asset ID: ${assetID}`}<br />
        {`Timestamp: ${moment(timestamp).format("DD/MM/YYYY HH:mm:ss")}`}<br />
        <strong>{`Temp: ${data.value}`}</strong><br />
        <strong>{alertDesc}</strong>
      </p>
    </div>;
    this.setState({ alert });
  }

  componentDidMount = () => {
    try {
      // const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL;
      const WEBSOCKET_PORT = process.env.REACT_APP_WEBSOCKET_PORT;
      const ws = new WebSocket(`ws://localhost:${WEBSOCKET_PORT}`);
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "alert":
            this.alertHandler(data);
            break;
          default:
        }
      };
    } catch (err) {
      console.error(err, err.stack);
    }
  }

  render() {
    return (
      <>
        <h4>Device Alert</h4>
        <div>
          {this.state.alert}
        </div>
      </>
    );
  }
}