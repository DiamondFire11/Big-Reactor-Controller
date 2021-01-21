import './App.css';
import React, {Component} from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import {FaTags, FaGlobeAmericas, FaPowerOff, FaBolt, FaFireAlt, FaAtom, FaThermometerHalf, FaRecycle, FaGasPump, FaBatteryThreeQuarters} from "react-icons/fa";


const Header = () => (
    <header className="App-header">
      <p>Extreme Reactors PID Controller</p>
    </header>
);


class Body extends Component {

  state = {
      loading: true,
      selector: 0,
      reactors: [],
  };


  async componentDidMount() {
    const url = 'https://api-diamondfire11.ngrok.io';
    const response = await fetch(url);
    const data = await response.json();

    console.log(data);
    this.setState({loading:false, reactors:data});
  }

  handleClick = (e) => {
      let selector = this.state.selector;
      e.preventDefault();
      alert(`New PID Gains:\n Proportional - ${this.state.reactors[selector].pidOptions.Kp}\n Integral - ${this.state.reactors[selector].pidOptions.Ki}\n Derivative - ${this.state.reactors[selector].pidOptions.Kd}`);
  }

  updateData = (e) => {
      // Shadow Copy Array & grab array selector value
      let selector = this.state.selector;
      let reactors = [...this.state.reactors];
      let reactor = {...reactors[this.state.selector]};

      // Edit PID option
      reactor.pidOptions.[e.target.name] = e.target.value;
      reactors[selector] = reactor;

      // Update state
      this.setState({reactors});
  };

  decrementSelector = () => {
      if(this.state.selector > 0){
          const newIndex = this.state.selector - 1;
          this.setState({selector:newIndex});
      }
  }

  incrementSelector = () => {
      if(this.state.selector < this.state.reactors.length - 1){
          const newIndex = this.state.selector + 1;
          this.setState({selector:newIndex});
      }
  }

  render() {
      return (
        <div className="App-body">
            <div className="reactorPane">
                {this.state.loading || this.state.reactors.length === 0 ?
                    <div className="App-reactorData-container">
                        <div className="App-reactorData">
                            <div className="spinner" />
                            <span>Fetching Server Data...</span>
                        </div>
                    </div>
                    :
                    <div className="App-reactorData-container">
                        <Button className="App-reactorSelector-left" onClick={this.decrementSelector}><i className="arrow left"/></Button>
                        <div className="App-reactorData">
                            <div className="App-reactorData-wrapper">
                                <div className="App-reactorData-title"><h3><FaTags /></h3>&nbsp;&nbsp;{this.state.reactors[this.state.selector].name}</div>
                                <div className="App-reactorData-title"><h3><FaGlobeAmericas /></h3>&nbsp;&nbsp;{this.state.reactors[this.state.selector].world}</div>
                            </div>
                            <div className="App-reactorData-wrapper">
                                {this.state.reactors[this.state.selector].reactorStatus.isActive ?
                                    <div className="App-reactorData-item">
                                        <div className="status-tooltip" data-title="Reactor Status" data-tooltip="Current operating status of the reactor">
                                            <FaPowerOff />
                                            <div>Online</div>
                                        </div>
                                    </div>
                                    :
                                    <div className="App-reactorData-item">
                                        <div className="status-tooltip" data-title="Reactor Status" data-tooltip="Current operating status of the reactor">
                                            <FaPowerOff />
                                            <div>Offline</div>
                                        </div>
                                    </div>
                                }
                                <div className="App-reactorData-item">
                                    <div className="App-tooltip" data-title="Energy Production" data-tooltip="Current reactor RF output">
                                        <div><FaBolt /></div>
                                        <div>{parseFloat(this.state.reactors[this.state.selector].reactorStatus.rfProduced).toFixed(2)} RF/t</div>
                                    </div>
                                </div>
                                <div className="App-reactorData-item">
                                    <div className="App-tooltip" data-title="Fuel Burn-Up" data-tooltip="Current rate in which the reactor uses fuel">
                                        <div><FaFireAlt /></div>
                                        <div>{parseFloat(this.state.reactors[this.state.selector].reactorStatus.wasteProduced).toFixed(2)} mB/t</div>
                                    </div>
                                </div>
                            </div>
                            <div className="App-reactorData-wrapper">
                                <div className="App-reactorData-item">
                                    <div className="App-tooltip" data-title="Fuel Reactivity" data-tooltip="Current rate in which fuel is converted to RF">
                                        <div><FaAtom /></div>
                                        <div>{parseFloat(this.state.reactors[this.state.selector].reactorStatus.reactivity).toFixed(2)}%</div>
                                    </div>
                                </div>
                                <div className="App-reactorData-item">
                                    <div className="App-tooltip" data-title="Core Temp" data-tooltip="Current temperature inside reactor core">
                                        <div><FaThermometerHalf /></div>
                                        <div>{parseFloat(this.state.reactors[this.state.selector].reactorStatus.temp).toFixed(2)} °C</div>
                                    </div>
                                </div>
                                <div className="App-reactorData-item">
                                    <div className="App-tooltip" data-title="Waste" data-tooltip="Current amount of waste in the reactor">
                                        <div><FaRecycle /></div>
                                        <div>{parseFloat(this.state.reactors[this.state.selector].reactorStatus.wasteLevel).toFixed(2)} mB</div>
                                    </div>
                                </div>
                            </div>
                            <div className="App-reactorData-wrapper">
                                <div className="App-reactorData-energy">
                                    <FaBatteryThreeQuarters />
                                    <progress value={this.state.reactors[this.state.selector].reactorStatus.energySaturation*100} max="100"/>
                                    <span>{parseFloat(this.state.reactors[this.state.selector].reactorStatus.energySaturation*100).toFixed(2)}%</span>
                                </div>
                                <div className="App-reactorData-fuel">
                                    <FaGasPump />
                                    <progress value={(this.state.reactors[this.state.selector].reactorStatus.fuelLevel)/(this.state.reactors[this.state.selector].reactorStatus.fuelMax)*100} max="100"/>
                                    <span>{parseFloat((this.state.reactors[this.state.selector].reactorStatus.fuelLevel)/(this.state.reactors[this.state.selector].reactorStatus.fuelMax)*100).toFixed(2)}%</span>
                                </div>
                            </div>
                        </div>
                        <Button className="App-reactorSelector-right" onClick={this.incrementSelector}><i className="arrow right"/></Button>
                    </div>
                }
            </div>
            <div className="App-pidForm-container">
                <p className="App-pidForm-title">PID Gain Tuner</p>
                <Form className="App-pidForm">
                    <Form.Group controlId="proportional">
                        <Form.Label>Proportional</Form.Label>
                        <br/>
                        <Form.Control
                            className="formStd"
                            name="Kp"
                            placeholder="Proportional"
                            onChange={e => this.updateData(e)}
                        />
                    </Form.Group>
                    <Form.Group controlId="integral">
                        <Form.Label>Integral</Form.Label>
                        <br/>
                        <Form.Control
                            className="formStd"
                            name="Ki"
                            placeholder="Integral"
                            onChange={e => this.updateData(e)}
                        />
                    </Form.Group>
                    <Form.Group controlId="derivative">
                        <Form.Label>Derivative</Form.Label>
                        <br/>
                        <Form.Control
                            className="formStd"
                            name="Kd"
                            placeholder="Derivative"
                            onChange={e => this.updateData(e)}
                        />
                    </Form.Group>

                    <Button className="App-pidSubmit" onClick={this.handleClick}>
                        Commit Gains
                    </Button>
                </Form>
            </div>
        </div>
    );
  }
}


class App extends Component {
  render() {
    return (
      <div className="App">
        <Header />
        <Body />
      </div>
    );
  }
}

export default App;
