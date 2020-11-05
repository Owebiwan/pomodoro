import React from "react";
import TimerLengthControl from "./components/LC";
import "./App.scss";
/** NOTES:
/** Dependencies are React, ReactDOM, and
    Accurate_Interval.js by Squuege (external script
    to keep setInterval() from drifting over time &
    thus ensuring timer goes off at correct mark).
/** Utilizes embedded <Audio> tag to ensure audio
    plays when timer tab is inactive or browser is
    minimized ( rather than new Audio().play() ).
/** Audio of this fashion not supported on most
    mobile devices it would seem (bummer I know).
**/

// Accurate_Interval.js
// Thanks Squeege! For the elegant answer provided to this question:
// http://stackoverflow.com/questions/8173580/setinterval-timing-slowly-drifts-away-from-staying-accurate
// Github: https://gist.github.com/Squeegy/1d99b3cd81d610ac7351
// Slightly modified to accept 'normal' interval/timeout format (func, time).

const accurateInterval = function (fn, time) {
  var cancel, nextAt, timeout, wrapper;
  nextAt = new Date().getTime() + time;
  timeout = null;
  wrapper = function () {
    nextAt += time;
    timeout = setTimeout(wrapper, nextAt - new Date().getTime());
    return fn();
  };
  cancel = function () {
    return clearTimeout(timeout);
  };
  timeout = setTimeout(wrapper, nextAt - new Date().getTime());
  return {
    cancel: cancel,
  };
};

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      brkLength: 5,
      seshLength: 25,
      timerState: "stopped",
      timerType: "Session",
      timer: 1500,
      intervalID: "",
      alarmColor: { color: "white" },
      second: 0,
    };
    this.setBrkLength = this.setBrkLength.bind(this);
    this.setSeshLength = this.setSeshLength.bind(this);
    this.lengthControl = this.lengthControl.bind(this);
    this.timerControl = this.timerControl.bind(this);
    this.beginCountDown = this.beginCountDown.bind(this);
    this.decrementTimer = this.decrementTimer.bind(this);
    this.phaseControl = this.phaseControl.bind(this);
    this.warning = this.warning.bind(this);
    this.buzzer = this.buzzer.bind(this);
    this.switchTimer = this.switchTimer.bind(this);
    this.clockify = this.clockify.bind(this);
    this.reset = this.reset.bind(this);
  }
  setBrkLength(e) {
    this.lengthControl(
      "brkLength",
      e.currentTarget.value,
      this.state.brkLength,
      "Session"
    );
  }
  setSeshLength(e) {
    this.lengthControl(
      "seshLength",
      e.currentTarget.value,
      this.state.seshLength,
      "Break"
    );
  }
  lengthControl(stateToChange, sign, currentLength, timerType) {
    if (this.state.timerState === "running") {
      return;
    }
    if (this.state.timerType === timerType) {
      this.setState({ second: 0 });
      if (sign === "-" && currentLength !== 1) {
        this.setState({ [stateToChange]: currentLength - 1 });
      } else if (sign === "+" && currentLength !== 60) {
        this.setState({ [stateToChange]: currentLength + 1 });
      }
    } else if (sign === "-" && currentLength !== 1) {
      this.setState({ second: 0 });
      this.setState({
        [stateToChange]: currentLength - 1,
        timer: currentLength * 60 - 60,
      });
    } else if (sign === "+" && currentLength !== 60) {
      this.setState({ second: 0 });
      this.setState({
        [stateToChange]: currentLength + 1,
        timer: currentLength * 60 + 60,
      });
    }
  }
  timerControl() {
    if (this.state.timerState === "stopped") {
      this.beginCountDown();
      this.setState({ timerState: "running" });
    } else {
      this.setState({ timerState: "stopped" });
      if (this.state.intervalID) {
        this.state.intervalID.cancel();
      }
    }
  }
  beginCountDown() {
    this.setState({
      intervalID: accurateInterval(() => {
        this.decrementTimer();
        this.phaseControl();
      }, 1000),
    });
  }
  decrementTimer() {
    this.setState({ timer: this.state.timer - 1 });
    this.setState({ second: this.state.second + 1 });
  }
  phaseControl() {
    let timer = this.state.timer;
    this.warning(timer);
    this.buzzer(timer);
    if (timer < 0) {
      if (this.state.intervalID) {
        this.state.intervalID.cancel();
      }
      if (this.state.timerType === "Session") {
        this.beginCountDown();
        this.switchTimer(this.state.brkLength * 60, "Break");
      } else {
        this.beginCountDown();
        this.switchTimer(this.state.seshLength * 60, "Session");
      }
    }
  }
  warning(_timer) {
    if (_timer < 61) {
      this.setState({ alarmColor: { color: "#a50d0d" } });
    } else {
      this.setState({ alarmColor: { color: "white" } });
    }
  }
  buzzer(_timer) {
    if (_timer === 0) {
      this.audioBeep.play();
    }
  }
  switchTimer(num, str) {
    this.setState({
      timer: num,
      timerType: str,
      alarmColor: { color: "white" },
    });
  }
  clockify() {
    let minutes = Math.floor(this.state.timer / 60);
    let seconds = this.state.timer - minutes * 60;
    seconds = seconds < 10 ? "0" + seconds : seconds;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    return minutes + ":" + seconds;
  }
  reset() {
    this.setState({
      brkLength: 5,
      seshLength: 25,
      timerState: "stopped",
      timerType: "Session",
      timer: 1500,
      intervalID: "",
      alarmColor: { color: "white" },
      second: 0,
    });
    if (this.state.intervalID) {
      this.state.intervalID.cancel();
    }
    this.audioBeep.pause();
    this.audioBeep.currentTime = 0;
  }
  render() {
    let deg = 6;
    let secs = this.state.second * deg;
    let mins = secs / 60;
    let sc = {
      transform: `rotateZ(${secs}deg)`,
    };
    let mn = {
      transform: `rotateZ(${mins}deg)`,
    };
    return (
      <div id="container">
        <div className="main-title">
          P<span>o</span>m<span>o</span>d<span>o</span>r<span>o</span> Cl
          <span>o</span>ck
        </div>
        <TimerLengthControl
          addID="break-increment"
          length={this.state.brkLength}
          lengthID="break-length"
          minID="break-decrement"
          onClick={this.setBrkLength}
          title="Break Length"
          titleID="break-label"
        />
        <TimerLengthControl
          addID="session-increment"
          length={this.state.seshLength}
          lengthID="session-length"
          minID="session-decrement"
          onClick={this.setSeshLength}
          title="Session Length"
          titleID="session-label"
        />
        <div className="timer" style={this.state.alarmColor}>
          <div className="clock">
            <div className="min">
              <div className="mn" style={mn}></div>
            </div>
            <div className="sec">
              <div className="sc" style={sc}></div>
            </div>
          </div>
          <div className="timer-wrapper">
            <div id="timer-label">{this.state.timerType}</div>
            <div id="time-left">{this.clockify()}</div>
          </div>
        </div>
        <div className="timer-control">
          <button id="start_stop" onClick={this.timerControl}>
            <i className="fa fa-play fa-2x" />
            <i className="fa fa-pause fa-2x" />
          </button>
          <button id="reset" onClick={this.reset}>
            <i className="fa fa-refresh fa-2x" />
          </button>
        </div>
        <audio
          id="beep"
          preload="auto"
          ref={(audio) => {
            this.audioBeep = audio;
          }}
          src="https://raw.githubusercontent.com/freeCodeCamp/cdn/master/build/testable-projects-fcc/audio/BeepSound.wav"
        />
        <div className="footer">
          <a
            className="contact"
            target="blank"
            href="https://linkedin.com/in/godwin-obamina"
          >
            <button>
              by Beewan <i className="fa fa-linkedin-square"></i>
            </button>
          </a>
        </div>
      </div>
    );
  }
}
