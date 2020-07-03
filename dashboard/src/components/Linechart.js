/* © 2020 Envision Digital. All Rights Reserved. */

import React, { Component } from "react";
import moment from "moment";
import { ResponsiveLine } from "@nivo/line";
export default class Linechart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      deviceCurrentDate: null,
      timeseries: []
    }
  }

  timeSeriesHandler = (data) => {
    let timeseries = this.state.timeseries;
    data.payload.forEach((device) => {
      let assetID = device.assetId;
      const points = JSON.parse(device.points);

      let index = timeseries.findIndex(item => item.id === assetID);
      let element = {
        id: assetID,
        data: []
      };
      if (index > -1) {
        element = timeseries[index];
      }

      element.data.push({
        "x": moment(device.time).format("HH:mm:ss"),
        "y": points.temp
      });
      if (element.data.length > 10) {
        element.data.shift();
      }

      if (index > -1) {
        timeseries[index] = element;
      } else {
        timeseries.push(element);
      }
    });
    this.setState({ timeseries });
  }

  lineChart = () => {
    return <ResponsiveLine
      data={this.state.timeseries}
      margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
      xScale={{ type: 'point' }}
      yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: true, reverse: false }}
      curve="natural"
      axisTop={null}
      axisRight={null}
      axisBottom={{
        orient: 'bottom',
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: 'real-time device readings',
        legendOffset: 36,
        legendPosition: 'middle'
      }}
      axisLeft={{
        orient: 'left',
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: 'count',
        legendOffset: -40,
        legendPosition: 'middle'
      }}
      colors={{ scheme: 'nivo' }}
      pointSize={10}
      pointColor={{ theme: 'background' }}
      pointBorderWidth={2}
      pointBorderColor={{ from: 'serieColor' }}
      pointLabel="y"
      pointLabelYOffset={-12}
      useMesh={true}
      legends={[
        {
          anchor: 'bottom-right',
          direction: 'column',
          justify: false,
          translateX: 100,
          translateY: 0,
          itemsSpacing: 0,
          itemDirection: 'left-to-right',
          itemWidth: 80,
          itemHeight: 20,
          itemOpacity: 0.75,
          symbolSize: 12,
          symbolShape: 'circle',
          symbolBorderColor: 'rgba(0, 0, 0, .5)',
          effects: [
            {
              on: 'hover',
              style: {
                itemBackground: 'rgba(0, 0, 0, .03)',
                itemOpacity: 1
              }
            }
          ]
        }
      ]}
    />;
  }

  componentDidMount = () => {
    try {
      // const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL;
      const WEBSOCKET_PORT = process.env.REACT_APP_WEBSOCKET_PORT;
      const ws = new WebSocket(`ws://localhost:${WEBSOCKET_PORT}`);
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);        
        switch (data.type) {
          case "timeseries":
            this.timeSeriesHandler(data);
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
        <h4>Real-time Time Series Dashboard - {moment().format("DD/MM/YYYY")}</h4>
        {this.lineChart()}
      </>
    );
  }
}