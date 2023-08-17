import React, { useState } from 'react';
import UserManual from '../UserManual/UserManual';
import ExtractJSON from '../ExtractJSON/ExtractJSON';
import'./Navbar.css';
import "bootstrap/dist/css/bootstrap.min.css";
import Button from 'react-bootstrap/Button';

function Navbar(props) {
  const [modalShowManual, setModalShowManual] = useState(false);
  const [modalShowJSON, setModalShowJSON] = useState(false);
    
  return (
    <>
    <div id="container">
      <div >
        <img src="FieldBoss_logo.png" alt="logo" style={{position: "absolute", top: "7px", width: "35px", left: "12px"}}/>
        <p><span style={{position: "absolute", fontSize: 30, fontFamily: "serif", top: "1px", color: "blue", left: "56px"}}>FieldBoss</span></p>
        <p><span style={{position: "absolute", fontSize: 18, fontFamily: "serif", top: "15px", color: "blue", left: "190px"}}>Tropical Forest Monitoring</span></p>
        <div>
          {['bottom'].map((placement) => (
            <Button id="extractJSON" variant="light" onClick={() => setModalShowJSON(true)}>Export GeoJSON</Button>
          ))}
        </div>
        <div>
          {['bottom'].map((placement) => (
            <Button id="login" variant="light">Load:</Button>
          ))}
        </div>
      </div>
    </div>
    <UserManual show={modalShowManual} onHide={() => setModalShowManual(false)}/>
    <ExtractJSON show={modalShowJSON} onHide={() => setModalShowJSON(false)}/>
    </>
  );
}

export default Navbar;