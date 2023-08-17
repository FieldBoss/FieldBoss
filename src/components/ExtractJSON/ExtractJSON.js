import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { Buffer } from 'buffer';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { DIDDataStore } from '@glazed/did-datastore';
import { DID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver } from 'key-did-resolver';
import theDefault, * as XRPL from 'xrpl';

const ExtractJSON = (props) => {
  const [myjson, setMyjson] = useState(); 

  //******// INITIALIZE/CONNECT XRPL
  const wallet = XRPL.Wallet.fromSeed("sEdV79onW4ag5zC2hu9v7ad2ZHrUMiC");
  const client = new XRPL.Client("wss://s.altnet.rippletest.net:51233");
  //******//

  //******// INITIALIZE/CONNECT CERAMIC 
  //set up and authorize a DID (decentralized identifier)
  const privateKey = 'e89b10e72176dd6514470465c2ce3929b1ed55f40e0b3c8383098deb032dc1e7'
  const mySeed = Buffer.from(privateKey, 'hex');
      
  // Create and authenticate the DID specific to the privateKey
  const did = new DID({
      provider: new Ed25519Provider(mySeed), 
      resolver: getResolver(),
  }) 
  did.authenticate()
      
  // Connect to the Ceramic node - testnet
  const ceramic = new CeramicClient('https://ceramic-clay.3boxlabs.com')
  ceramic.did = did
     
  //set up datamodel
  const aliases = {
    schemas: {
        GeometrySchema: 'ceramic://k3y52l7qbv1frxpwrtewxt97500tv6j7cw7lrzknw62mzd57aszs2qxnnijtev9c0'
    },
    definitions: {
        GeometryDefinition: 'kjzl6cwe1jw147035m39bw6gc9l1spfk6x6jux5zremy9wc3g3cwq4grn3uqx53',
    },
    tiles: {},
}
  const dataStore = new DIDDataStore({ ceramic, model: aliases })

  async function getJSON(){
    //get ceramic data
    let allJSON = {};
    allJSON = await dataStore.get("GeometryDefinition");
    
    //get no. of unique occurences in allJSON
    let fArray = [];
    for (var z = 0; z < allJSON.geomArray.length; z++) {
     fArray.push(allJSON.geomArray[z].props.hashid)
    }
    let uniqueCeramicArray = [...new Set(fArray)];

    //get geometries from XRPL, array of XRPL transactions on the current account
    await client.connect();
    const txs = await client.request({
        method: "account_tx",
        account: wallet.classicAddress  
    })

    let coordsObj = {};
    let coordsArray = [];
    for (var i = 0; i < txs.result.transactions.length-1; i++) {
      if (txs.result.transactions[i].tx.Memos !== undefined){
        let data = txs.result.transactions[i].tx.Memos[0].Memo.MemoData;
        coordsObj = JSON.parse(Buffer.from(data, "hex").toString("utf-8"));
        let hash = txs.result.transactions[i].tx.hash;
        coordsObj.hashID = hash;
        coordsArray.push(coordsObj);
      } 
    }
  
    //set schema template
    let featureSchema = {
     "type": "FeatureCollection",
     "features": []
    }
   
    //m
    let myType = "", myID = "", myHash = "";
    for (var j = 0; j < uniqueCeramicArray.length; j++) { 
    //for (var j = 0; j < allJSON.geomArray.length; j++) {
      let myCoords = [];
      myID = coordsArray[j].assetID;
      myHash = coordsArray[j].hashID;
      if (coordsArray[j].type === 'polygon') {
        let tmpArray = [];
        myType = "Polygon";
        for (var k = 0; k < JSON.stringify(coordsArray[j].coordinates[0].length); k++) {
          let subArray = [];
          let myLng = JSON.stringify(coordsArray[j].coordinates[0][k].lng, null, 2); 
          let myLat = JSON.stringify(coordsArray[j].coordinates[0][k].lat, null, 2); 
          subArray.push(+myLng);
          subArray.push(+myLat);
          tmpArray.push(subArray);
        }
        myCoords.push(tmpArray);
      } else if (coordsArray[j].type === 'marker'){
          myType = "Point";
          myCoords.push(+coordsArray[j].coordinates.lng);
          myCoords.push(+coordsArray[j].coordinates.lat);
      } else if (coordsArray[j].type === 'polyline'){
          myType = "LineString";
          for (var m = 0; m < JSON.stringify(coordsArray[j].coordinates.length); m++) {
            let subArray = [];
            let myLng = JSON.stringify(coordsArray[j].coordinates[m].lng, null, 2); 
            let myLat = JSON.stringify(coordsArray[j].coordinates[m].lat, null, 2); 
            subArray.push(+myLng);
            subArray.push(+myLat);
            myCoords.push(subArray);
          }
      }
   
      let goSchema =  {
        "type": "Feature",
        "properties": {
          "Date": allJSON.geomArray[j].props.date,
          "PlotId": myID,
          "HashId": myHash,
          "Useclass": allJSON.geomArray[j].props.type,
          "Condition": allJSON.geomArray[j].props.debris,
          "Density": allJSON.geomArray[j].props.erosion,
          "Richness": allJSON.geomArray[j].props.sediment,
          "production": allJSON.geomArray[j].props.condition,
          "Biomass": allJSON.geomArray[j].props.deterioration,
          "Inspector": "Billy Reuben"
        },
        "geometry": {
          "type": myType,
          "coordinates": myCoords
        }
      }
      featureSchema.features.push(goSchema)
    }
    
    //concatenate everything into a single block
    setMyjson(JSON.stringify(featureSchema, null, 2));

    client.disconnect();
  }

   async function setJSON(){
    navigator.clipboard.writeText(myjson);
   }

  return (
    <Modal
      {...props}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Button onClick={getJSON}>Load</Button>
        <h5>----{'>'}</h5>
        <Button onClick={setJSON}>Copy to Clipboard</Button>
      </Modal.Header>
      <Modal.Body>
        <h5>Extract Account Data as GeoJSON</h5>
        <p>{myjson}</p>
      </Modal.Body>
    </Modal>
  );
}
export default ExtractJSON;