import * as React from 'react';
import './App.css';

import ConfigurationAuditView from "./ConfigurationAuditView";

class App extends React.Component {
  public render() {
    return (
      <div>
        <ConfigurationAuditView />
      </div>
    );
  }
}

export default App;
