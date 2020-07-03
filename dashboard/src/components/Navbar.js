/* © 2020 Envision Digital. All Rights Reserved. */

import React, { Component } from "react";

export default class Navbar extends Component {
  render() {
    return (
      <>
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
          <a className="navbar-brand" href="https://www.envision-group.com/en/index.html"
            target="_blank" rel="noopener noreferrer"
            style={{ background: "#fff" }}>
            <img src="https://dmci2txd56hv9.cloudfront.net/materials/95622/origin/6bd801d04240c000bf032b9464ecc775_origin.png"
              width="100px"
              alt="envision-logo" />
          </a>
          <button className="navbar-toggler" type="button"
            data-toggle="collapse" data-target="#navbarColor03"
            aria-controls="navbarColor01" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarColor03">
            <ul className="navbar-nav ml-auto my-2 my-lg-0">
              <li className="nav-item active">
                <a className="nav-link" href="/">Home <span className="sr-only">(current)</span></a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="https://www.envision-group.com/en/enos.html"
                  target="_blank" rel="noopener noreferrer">EnOS Product</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="https://developer.envisioniot.com/"
                  target="_blank" rel="noopener noreferrer">EnOS Developer Center</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="https://envision-digital.com/"
                  target="_blank" rel="noopener noreferrer">Envision Digital</a>
              </li>
            </ul>
          </div>
        </nav>
        <div className="row">
          <div className="col-sm-12">
            <br />
            <h1 className="text-center">Real-time Device Dashboard</h1>
            <br />
            <p className="lead text-center">
              This is a demo dashboard that stream real-time device information from EnOS Cloud.<br />
              The measurement is read from a virtual device to EnOS Cloud before publishing to this dashboard.
            </p>
          </div>
        </div>
      </>
    );
  }
}