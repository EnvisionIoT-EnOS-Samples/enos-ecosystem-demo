/* © 2020 Envision Digital. All Rights Reserved. */

import React from "react";
import Alert from "./components/Alert";
import Navbar from "./components/Navbar";
import Linechart from "./components/Linechart";

function App() {
  return (
    <>
      <Navbar />
      <br />
      <div className="row">
        <div className="col-md-9" style={{ height: "400px" }}>
          <Linechart />
        </div>
        <div className="col-md-3">
          <Alert />
        </div>
      </div>
    </>
  );
}

export default App;
