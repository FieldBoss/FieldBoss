 /* eslint-disable */
import React, { useState, useEffect } from 'react';
import theDefault, * as XRPL from 'xrpl';
import './Mapper.css';
import InspectionForm from '../InspectionForm/InspectionForm';
import Location from "../Location/Location";
import Navbar from '../Navbar/Navbar';
import L from "leaflet";
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { MapContainer, Marker, Polygon, Polyline, Popup, TileLayer, FeatureGroup, LayersControl } from "react-leaflet";
import { EditControl } from 'react-leaflet-draw';
import { Buffer } from 'buffer';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { DataModel } from '@glazed/datamodel';
import { DIDDataStore } from '@glazed/did-datastore'; 
import { DID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver } from 'key-did-resolver';  
import markerIconBlue from './iconblue.png';

//set default marker icon
delete L.Icon.Default.prototype._getIconUrl; 
L.Icon.Default.mergeOptions({
  iconUrl: require('leaflet/dist/images/marker-icon.png')
}); 
 
//serve -s build
//the Mapper react component
const Mapper = () => {  
    const [map, setMap] = useState(null);
    const [selected, setSelected] = useState(false);
    const [geom, setGeom] = useState();
    const [selectToken, setSelectToken] = useState();
    const [selectStatus, setSelectStatus] = useState();
    const [geomtype, setGeomType] = useState();
    const [pointJSON, setPointJSON] = useState([]);
    const [polylineJSON, setPolylineJSON] = useState([]);
    const [polygonJSON, setPolygonJSON] = useState([]);
   
    //default location
    //const position = [-3.1427300644999203, -58.98868560949072];  //amazon
    const position = [-12.96854958, -71.48242130];  //peru

    const myObj = {
        "geometry": {
            "coordinates": [] 
        },
        "properties": { 
            "tokenid": "00"
        }  
    } 

    //******// INITIALIZE/CONNECT XRPL
    const wallet = XRPL.Wallet.fromSeed("sEd7s2z2An6fo2ydznGHHXJxpqe4Rnf");
    const client = new XRPL.Client("wss://s.altnet.rippletest.net:51233");
    //******/

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
            MasterSchema: 'ceramic://k3y52l7qbv1frymdaw5hwjzgz2znsvkcj7eslsbtdxo5yudosui5l79it03u14a9s',
            ChildSchema: 'ceramic://k3y52l7qbv1frxlylngrgp40czvu4e0snk2be9qmw94ld3c7qaidjnq5cy6n3203k'
        },
        definitions: {
            MasterDefinition: 'kjzl6cwe1jw145cm9tm1kqd7scx0x3mms3y3ge0l3lo2j8xlqso4wc4z0cu6msm',
            ChildDefinition: 'kjzl6cwe1jw1483a04ra2xo9bdwomkyql02ruyeh0fycjhjfxpy5tdh2jwt13fr'
        },
        tiles: {},
    }
    const dataStore = new DIDDataStore({ ceramic, model: aliases })
    //******//

    const redIcon = new L.Icon({
        iconUrl: markerIconBlue,
        iconSize: [10, 10]
    });
    const [markericon, setMarkerIcon] = useState(redIcon);

    const geomCreated = (e) => {
		let type = e.layerType;
		if (type === "marker") { 
			//console.log(type, e);
            setGeom(e.layer._latlng);
            setGeomType(type); 
		} else {
            setGeom(e.layer._latlngs);
            setGeomType(type);
		} 
	};

    //define a blank layergroup.
    let myLayerGroup = L.layerGroup([]);

    async function viewRecent(e, mytoken, defType){
        e.stopPropagation();

        document.getElementById("selected").disabled = false;
        document.getElementById('new').style.backgroundColor = "gray";
        document.getElementById("submit").disabled = true;
        document.getElementById("submit2").disabled = true;

        document.getElementById("condition").disabled = true;
        document.getElementById("deterioration").disabled = true;
        document.getElementById("debris").disabled = true;
        document.getElementById("erosion").disabled = true;
        document.getElementById("sediment").disabled = true;
        document.getElementById("useclass").disabled = true;
        document.getElementById("condition2").disabled = true;
        document.getElementById("deterioration2").disabled = true;
        document.getElementById("debris2").disabled = true;
        document.getElementById("erosion2").disabled = true;
        document.getElementById("sediment2").disabled = true;
        document.getElementById("mastertoken").disabled = true;

        //manage listbox selection on date
        let selectDate = ""
        switch(defType) {
            case "point":
                selectDate = getPoint();
                break;
            case "line":
                selectDate = getLine();
                break;
            case "poly":
                selectDate = getPoly();
                break;
            default:
        }
        let myDate = selectDate;    //initialize date variable

        //query for
        if (defType === 'poly' && document.getElementById("bmp3").innerHTML.includes('Master ID')){  
            setSelectToken(mytoken.tokenid);    //state var to be passed to child
            setSelectStatus('master');

            document.getElementById("masterformid").style.display="block";
            document.getElementById("childformid").style.display="none";
            document.getElementById("childformid").hidden = false;

            const masterData = await dataStore.get('MasterDefinition');
            for (var k = 0; k < document.getElementById("date").options.length; k++) { 
                document.getElementById("date").remove(k);
            }
            for (var m = 0; m < document.getElementById("bmpid").options.length; m++) { 
                document.getElementById("bmpid").remove(m);
            }
            for (var i = 0; i < masterData.masterArray.length; i++) { 
                if (masterData.masterArray[i].properties.tokenid === mytoken.tokenid && masterData.masterArray[i].properties.date === myDate) {   
                    //set values for select elements on form
                    document.getElementById("bmpid").add(new Option(masterData.masterArray[i].properties.assetid)),
                    document.getElementById("date").add(new Option(myDate)),  
                    document.getElementById("useclass").value = masterData.masterArray[i].properties.useclass,   
                    document.getElementById("condition").value = masterData.masterArray[i].properties.condition, 
                    document.getElementById("deterioration").value = masterData.masterArray[i].properties.density, 
                    document.getElementById("debris").value = masterData.masterArray[i].properties.richness,
                    document.getElementById("erosion").value = masterData.masterArray[i].properties.production,
                    document.getElementById("sediment").value = masterData.masterArray[i].properties.biomass
                }   
            } 
        } else if (defType === 'poly' && document.getElementById("bmp3").innerHTML.includes('Child ID')){
            document.getElementById("masterformid").style.display="none";
            document.getElementById("childformid").style.display="block";
            document.getElementById("childformid").hidden = false;

            setSelectStatus('child');
            const childData = await dataStore.get('ChildDefinition');
            for (var k = 0; k < document.getElementById("date2").options.length; k++) { 
                document.getElementById("date2").remove(k);
            }
            for (var m = 0; m < document.getElementById("bmpid2").options.length; m++) { 
                document.getElementById("bmpid2").remove(m);
            }
            for (var i = 0; i < childData.childArray.length; i++) { 
                if (childData.childArray[i].properties.tokenid === mytoken.tokenid && childData.childArray[i].properties.date === myDate) {    
                    //set values for select elements on form
                    let init = childData.childArray[i].properties.masterid.length - 16;
                    let tok = childData.childArray[i].properties.masterid.slice(init, childData.childArray[i].properties.masterid.length);
                    document.getElementById("bmpid2").add(new Option(childData.childArray[i].properties.assetid)),  
                    document.getElementById("date2").add(new Option(myDate)), 
                    document.getElementById("mastertoken").add(new Option(tok)),
                    document.getElementById("condition2").value = childData.childArray[i].properties.condition, 
                    document.getElementById("deterioration2").value = childData.childArray[i].properties.survival, 
                    document.getElementById("debris2").value = childData.childArray[i].properties.richness,
                    document.getElementById("erosion2").value = childData.childArray[i].properties.production,
                    document.getElementById("sediment2").value = childData.childArray[i].properties.diversity
                }   
            }
        } else if (defType === 'point' && document.getElementById("bmp1").innerHTML.includes('Child ID')){
            document.getElementById("masterformid").style.display="none";
            document.getElementById("childformid").style.display="block";
            document.getElementById("childformid").hidden = false;

            setSelectStatus('child');
            const childData = await dataStore.get('ChildDefinition');
            for (var k = 0; k < document.getElementById("date2").options.length; k++) { 
                document.getElementById("date2").remove(k);
            }
            for (var m = 0; m < document.getElementById("bmpid2").options.length; m++) { 
                document.getElementById("bmpid2").remove(m);
            }
            for (var i = 0; i < childData.childArray.length; i++) { 
                if (childData.childArray[i].properties.tokenid === mytoken.tokenid && childData.childArray[i].properties.date === myDate) {    
                    //set values for select elements on form
                    let init = childData.childArray[i].properties.masterid.length - 16;
                    let tok = childData.childArray[i].properties.masterid.slice(init, childData.childArray[i].properties.masterid.length);
                    document.getElementById("bmpid2").add(new Option(childData.childArray[i].properties.assetid)),  
                    document.getElementById("date2").add(new Option(myDate)), 
                    document.getElementById("mastertoken").add(new Option(tok)),
                    document.getElementById("condition2").value = childData.childArray[i].properties.condition, 
                    document.getElementById("deterioration2").value = childData.childArray[i].properties.survival, 
                    document.getElementById("debris2").value = childData.childArray[i].properties.richness,
                    document.getElementById("erosion2").value = childData.childArray[i].properties.production,
                    document.getElementById("sediment2").value = childData.childArray[i].properties.diversity
                }   
            } 
        } else if (defType === 'point' && document.getElementById("bmp1").innerHTML.includes('Master ID')){
            document.getElementById("masterformid").style.display="block";
            document.getElementById("childformid").style.display="none";
            document.getElementById("childformid").hidden = true; 

            setSelectStatus('master');
            const masterData = await dataStore.get('MasterDefinition');
            for (var k = 0; k < document.getElementById("date").options.length; k++) { 
                document.getElementById("date").remove(k);
            }
            for (var m = 0; m < document.getElementById("bmpid").options.length; m++) { 
                document.getElementById("bmpid").remove(m);
            }
            for (var i = 0; i < masterData.masterArray.length; i++) { 
                if (masterData.masterArray[i].properties.tokenid === mytoken.tokenid && masterData.masterArray[i].properties.date === myDate) {    
                    //set values for select elements on form
                    document.getElementById("bmpid").add(new Option(masterData.masterArray[i].properties.assetid))
                    document.getElementById("date").add(new Option(myDate)),  
                    document.getElementById("useclass").value = masterData.masterArray[i].properties.useclass,   
                    document.getElementById("condition").value = masterData.masterArray[i].properties.condition, 
                    document.getElementById("deterioration").value = masterData.masterArray[i].properties.density, 
                    document.getElementById("debris").value = masterData.masterArray[i].properties.richness,
                    document.getElementById("erosion").value = masterData.masterArray[i].properties.production,
                    document.getElementById("sediment").value = masterData.masterArray[i].properties.biomass
                }   
            } 
        }

        //remove previous yellow feature
        map.eachLayer(function (layer) {
            if(layer.options.color === 'yellow'){
                map.removeLayer(layer)
            }
        });

        //set selected feature to color = yellow
        if (defType === "point"){
            setGeomType("marker");  
            getPointData().then((result) => {
                for (var j = 0; j < result.length; j++) { 
                    if (result[j].properties.tokenid === mytoken.tokenid) {
                        myLayerGroup.eachLayer(function(layer) {myLayerGroup.removeLayer(layer);});
                        const circlemarker = new L.circleMarker([result[j].geometry.coordinates[1], result[j].geometry.coordinates[0]]);
                        let myStyle = {color: 'yellow'};
                        circlemarker.setStyle(myStyle);
                        myLayerGroup = L.layerGroup([circlemarker]);
                        map.addLayer(myLayerGroup);
                    } 
                }      
            }); 
        } else if (defType === "poly"){ 
            setGeomType("polygon");
            getPolygonData().then((result) => {
                for (var j = 0; j < result.length; j++) { 
                    if (result[j].properties.tokenid === mytoken.tokenid) {
                        myLayerGroup.eachLayer(function(layer) {myLayerGroup.removeLayer(layer);});
                        const polygon = L.polygon([result[j].geometry.coordinates]);
                        let myStyle = {color: 'yellow', weight: 6, fillColor: '#1c9099',};
                        polygon.setStyle(myStyle);
                        myLayerGroup = L.layerGroup([polygon])
                        map.removeLayer(myLayerGroup);
                        map.addLayer(myLayerGroup)
                        polygon.bringToBack();
                    }
                }      
            })
        } else if (defType === "line"){ 
            setGeomType("polyline");   
            getPolylineData().then((result) => {
                for (var j = 0; j < result.length; j++) { 
                    if (result[j].properties.tokenid === mytoken.tokenid) {
                        myLayerGroup.eachLayer(function(layer) {myLayerGroup.removeLayer(layer);});
                        const polyline = new L.Polyline([result[j].geometry.coordinates]);
                        let myStyle = {color: 'yellow', weight: 6};
                        polyline.setStyle(myStyle);
                        myLayerGroup = L.layerGroup([polyline]);
                        map.addLayer(myLayerGroup)
                        polyline.bringToBack();
                    }
                }      
            })
        }
        setSelected(true);

        //add photo to the canvas
        let canv = document.getElementById("myCanvas");
        let context = canv.getContext('2d', {willReadFrequently: true}); 
        let imageObj = new Image();
        if (defType === "point"){
            imageObj.src = 'https://blocklagoon.mypinata.cloud/ipfs/QmdpLtW98TwwjghKtroorRUmnXfw9AUXXycHDgsZLANAFL';
        } else if (defType === "line"){ 
            imageObj.src = 'https://blocklagoon.mypinata.cloud/ipfs/QmcX899Sk2J8jeUBJT1QVzVb7uGGAd28Yu23cLgW8XJqwv';
        } else if (defType === "poly"){
            imageObj.src = 'https://blocklagoon.mypinata.cloud/ipfs/QmVBDnka7NdqfEFKJyqBmSipZkJAd54rc7WGhLVcyT7Ncs';
        }
        
        let fitImageOn = function(canv, imageObj) {
            let imageAspectRatio = imageObj.width / imageObj.height;
            let canvasAspectRatio = canv.width / canv.height;
            let renderableHeight, renderableWidth, xStart, yStart;
            renderableHeight = canv.height;
            renderableWidth = imageObj.width * (renderableHeight / imageObj.height);
            xStart = (canv.width - renderableWidth) / 2;
            yStart = 0;
            context.drawImage(imageObj, xStart-36, yStart-20, renderableWidth+73, renderableHeight+30);
        };
 
        imageObj.onload = function() {
            fitImageOn(canv, imageObj)
        };
    }

    function getPoint(){
        return document.getElementById('pointlist').value
    }
    function getLine(){
        return document.getElementById('polylinelist').value
    }
    function getPoly(){
        return document.getElementById('polygonlist').value
    }

    async function loadPopup(mytoken, defType){
        const childData = await dataStore.get('ChildDefinition');
        document.getElementById('selected').style.backgroundColor = "gray";
        let dta = [];
        let uniqueChars = [];
        if (childData != null){
            for (var i = 0; i < childData.childArray.length; i++) { 
                if (childData.childArray[i].properties.tokenid === mytoken.tokenid){
                    dta.push(childData.childArray[i].properties.date);
                    switch(defType) {
                        case "point":
                            document.getElementById("bmp1").innerHTML = "Child ID: " + childData.childArray[i].properties.assetid;
                        break;
                        case "line":
                            document.getElementById("bmp2").innerHTML = "Child ID: " + childData.childArray[i].properties.assetid;
                        break;
                        case "poly":
                            document.getElementById("bmp3").innerHTML = "Child ID: " + childData.childArray[i].properties.assetid;
                            break;
                        default:
                    }
                }          
            } uniqueChars = [...new Set(dta)];    //remove dups from array
        }
        //************************************************************************************
        const masterData = await dataStore.get('MasterDefinition');
        let dta2 = [];
        let uniqueChars2 = [];
        for (var i = 0; i < masterData.masterArray.length; i++) { 
            if (masterData.masterArray[i].properties.tokenid === mytoken.tokenid){
                dta2.push(masterData.masterArray[i].properties.date);
                switch(defType) {
                    case "point":
                        document.getElementById("bmp1").innerHTML = "Master ID: " + masterData.masterArray[i].properties.assetid;
                      break;
                    case "line":
                        document.getElementById("bmp2").innerHTML = "Master ID: " + masterData.masterArray[i].properties.assetid;
                      break;
                    case "poly":
                        document.getElementById("bmp3").innerHTML = "Master ID: " + masterData.masterArray[i].properties.assetid;
                        break;
                    default:
                }
            }      
        }  uniqueChars2 = [...new Set(dta2)];    
        //**************************************************************************************/
    
        //add previous inspected dates to listbox
        let showList = "";
        if (defType === "point"){
            showList = "pointlist";
        } else if (defType === "line"){ 
            showList = "polylinelist";
        } else if (defType === "poly"){
            showList = "polygonlist"
        }

        document.getElementById(showList).innerHTML = "";  //clear the listbox
        for (var n = 0; n < uniqueChars.length; n++) { 
            let optn = document.createElement("OPTION");
            optn.text = uniqueChars[n]; 
            optn.value = uniqueChars[n]; 
            document.getElementById(showList).options.add(optn);
        }
        for (var n = 0; n < uniqueChars2.length; n++) { 
            let optn = document.createElement("OPTION");
            optn.text = uniqueChars2[n]; 
            optn.value = uniqueChars2[n]; 
            document.getElementById(showList).options.add(optn);
        }
        document.getElementById(showList).options[0].selected = true;
    }
        

    async function getPointData() {
        //get total no. of nfts in account
        await client.connect();
        const nfts = await client.request({
            method: "account_nfts",
                account: wallet.classicAddress  
        })

        let geometryArray = [];
        const myData = await dataStore.get('MasterDefinition');
        for (var i = 0; i < nfts.result.account_nfts.length; i++) {
            for (var j = 0; j < myData.masterArray.length; j++) {
                //this if statement will map master point features
                if (myData.masterArray[j].child.length === 0 && myData.masterArray[j].properties.tokenid === nfts.result.account_nfts[i].NFTokenID){
                    let geomObj = structuredClone(myObj);
                    geomObj.geometry.coordinates[0] = myData.masterArray[j].geometry.lng;
                    geomObj.geometry.coordinates[1] = myData.masterArray[j].geometry.lat;
                    geomObj.properties.tokenid = myData.masterArray[j].properties.tokenid;
                    geometryArray.push(geomObj);
                }

                //this for/if statement will map child point features
                for (var k = 0; k < myData.masterArray[j].child.length; k++) {
                    if (myData.masterArray[j].child.length > 0 && myData.masterArray[j].child[k].tokenid === nfts.result.account_nfts[i].NFTokenID){
                        let geomObj = structuredClone(myObj);
                        geomObj.geometry.coordinates[0] = myData.masterArray[j].child[k].geometry.lng;
                        geomObj.geometry.coordinates[1] = myData.masterArray[j].child[k].geometry.lat;
                        geomObj.properties.tokenid = myData.masterArray[j].child[k].tokenid;
                        geometryArray.push(geomObj);
                    }
                }
            }
        } 

        //remove any null geometries
        let geometryArray2 = [];
        for (var v = 0; v < geometryArray.length; v++) {
            if (geometryArray[v].geometry.coordinates[0] != null){ 
                geometryArray2.push(geometryArray[v]);
            }
        }
        return geometryArray2
    }

    async function getPolygonData() {
        //get total no. of nfts in account
        await client.connect();
        const nfts = await client.request({
            method: "account_nfts",
                account: wallet.classicAddress  
        })

        let geometryArray = [];
        const myData = await dataStore.get('MasterDefinition');

        for (var i = 0; i < nfts.result.account_nfts.length; i++) {
            //need to get the tokenids related to geomArray[i].type = poly
            for (var j = 0; j < myData.masterArray.length; j++) {
                //following is for master polys
                if (myData.masterArray[j].properties.tokenid === nfts.result.account_nfts[i].NFTokenID && myData.masterArray[j].type === 'polygon' && Array.isArray(myData.masterArray[j].geometry)){
                    let geomObj = structuredClone(myObj);
                    for (var k = 0; k < myData.masterArray[j].geometry[0].length; k++) {
                        let tempArray = []
                        tempArray.push(myData.masterArray[j].geometry[0][k].lat)
                        tempArray.push(myData.masterArray[j].geometry[0][k].lng)
                        geomObj.geometry.coordinates[k] = tempArray
                    }
                    geomObj.properties.tokenid = myData.masterArray[j].properties.tokenid;
                    geometryArray.push(geomObj);
                }
                
                //following is for child polys  
                for (var k = 0; k < myData.masterArray[j].child.length; k++) {
                    let geomObj = structuredClone(myObj);
                    if (myData.masterArray[j].child.length > 0 && myData.masterArray[j].child[k].tokenid === nfts.result.account_nfts[i].NFTokenID){
                        if (myData.masterArray[j].child[k].type === 'polygon'){
                            for (var p = 0; p < myData.masterArray[j].child[k].geometry[0].length; p++) {
                                geomObj.geometry.coordinates.push(myData.masterArray[j].child[k].geometry[0][p]);
                            }
                            geomObj .properties.tokenid = myData.masterArray[j].child[k].tokenid;
                        }
                    } 
                    geometryArray.push(geomObj);
                }
            }
        } 
        return geometryArray    
    }

    async function getPolylineData() {
        //get total no. of nfts in account
        await client.connect();
        const nfts = await client.request({
            method: "account_nfts",
                account: wallet.classicAddress  
        })
   
        let geometryArray = [];
        const myData = await dataStore.get('MasterDefinition');
        for (var i = 0; i < nfts.result.account_nfts.length; i++) {
            //need to get the tokenids related to geomArray[i].type = 'marker
            for (var j = 0; j < myData.geomArray.length; j++) {
                if (myData.geomArray[j].properties.tokenid === nfts.result.account_nfts[i].NFTokenID && myData.geomArray[j].type === 'polyline'){
                 
                    let geomObj = {
                        "geometry": {
                            "coordinates": []
                        },
                        "properties": { 
                            "tokenid": "00"
                        }  
                    }

                    for (var k = 0; k < myData.geomArray[j].geometry[0].length; k++) {
                        let tempArray = []
                        tempArray.push(myData.geomArray[j].geometry[0][k].lat)
                        tempArray.push(myData.geomArray[j].geometry[0][k].lng)
                        geomObj.geometry.coordinates[k] = tempArray
                    }
                    geomObj.properties.tokenid = myData.geomArray[j].properties.tokenid;
                    geometryArray.push(geomObj);
                }
            }
        } 
        return geometryArray 
    }

    //ON APP LOAD, DISPLAY ALL NFTs ON MAP
    useEffect(() => {  
        // getPolylineData().then((result) => { 
        //     console.log(JSON.stringify(result, null, 2))
        //     setPolylineJSON(result)
        // }).catch(e => {
        //    console.log(e);
        // });
        getPointData().then((result) => { 
            setPointJSON(result)
        }).catch(e => {
            console.log(e);
        }); 
        getPolygonData().then((result) => { 
            setPolygonJSON(result)
        }).catch(e => {
            console.log(e)
        }); 

        document.getElementById("submit").disabled = true;
        document.getElementById("useclass").selectedIndex = "-1";
        document.getElementById("condition").selectedIndex = "-1";
        document.getElementById("deterioration").selectedIndex = "-1";
        document.getElementById("debris").selectedIndex = "-1";
        document.getElementById("sediment").selectedIndex = "-1";
        document.getElementById("erosion").selectedIndex = "-1";
    },[])
    
    //marker react component
    const MarkerData = () => {
        return pointJSON.map(({properties: {tokenid}, geometry: {coordinates}}) => 
        ( 
        <div key={tokenid}>
            <Marker
                position={[coordinates[1], coordinates[0]]}
                icon={markericon}
                eventHandlers={{
                    click: (e) => {loadPopup({tokenid}, "point");} 
                }}> 
                <Popup>
                <img src="XRPL_ledger.png" style={{position: "absolute", top: "10px", width: "200px", left: "10px"}}/>
                <a href={"https://testnet.xrpl.org/nft/" + {tokenid}.tokenid}
                        style={{position: "absolute", top: "45px", width: "150px", left: "60px"}}>
                        XRPL NFT Explorer
                    </a>
                    <span id="bmp1" style={{position: "absolute", top: "83px", width: "155px", left: "30px", fontWeight: "800"}}></span>
                    <button id="view" className="popbtn" onClick={(e) => viewRecent(e, {tokenid}, "point")}>Select</button>
                    <p><span style={{position: "absolute", fontSize: 13, top: "121px", left: "30px"}}>Inspection history</span></p>
                    <select id="pointlist" onChange={getPoint} size="4" style={{position: "absolute", top: "140px", width: "160px", left: "30px"}}></select>
                </Popup> 
            </Marker> 
        </div>   
        ));
    }

    //polyline react component
    const PolylineData = () => {
        return polylineJSON.map(({properties: {tokenid}, geometry: {coordinates}}) => 
        ( 
        <div key={tokenid}>
            <Polyline
                positions={coordinates}
                color={"#11d6f0"}
                weight={'3'}
                eventHandlers={{
                    click: (e) => {loadPopup({tokenid}, "line");}
                }}>
                <Popup>
                <img src="XRPL_ledger.png" style={{position: "absolute", top: "10px", width: "200px", left: "10px"}}/>
                    <a href={"https://testnet.xrpl.org/nft/" + {tokenid}.tokenid}
                        style={{position: "absolute", top: "45px", width: "150px", left: "60px"}}>
                        XRPL NFT Explorer
                    </a>
                    <span id="bmp2" style={{position: "absolute", top: "83px", width: "155px", left: "30px", fontWeight: "800"}}></span>
                    <button id="view" className="popbtn" onClick={(e) => viewRecent(e, {tokenid}, "line")}>Select</button>
                    <p><span style={{position: "absolute", fontSize: 13, top: "121px", left: "30px"}}>Inspection history</span></p>
                    <select id="polylinelist" onChange={getLine} size="4" style={{position: "absolute", top: "140px", width: "160px", left: "30px"}}></select>
                </Popup>
            </Polyline>
        </div> 
        ));        
    }

    //polygon react component
    const PolygonData = () => {
        return polygonJSON.map(({properties: {tokenid}, geometry: {coordinates}}) => 
        ( 
        <div key={tokenid}>
            <Polygon 
                positions={coordinates}
                color="#11d6f0"
                weight= '3'
                fillOpacity='0'
                eventHandlers={{
                    click: (e) => {loadPopup({tokenid}, "poly");}   
                }}>
                <Popup>
                <img src="XRPL_ledger.png" style={{position: "absolute", top: "10px", width: "200px", left: "10px"}}/>
                    <a href={"https://testnet.xrpl.org/nft/" + {tokenid}.tokenid}
                        style={{position: "absolute", top: "45px", width: "150px", left: "60px"}}>
                        XRPL NFT Explorer
                    </a>
                    <span id="bmp3" style={{position: "absolute", top: "83px", width: "155px", left: "30px", fontWeight: "800"}}></span>
                    <button id="view" className="popbtn" onClick={(e) => viewRecent(e, {tokenid}, "poly")}>Select</button>
                    <p><span style={{position: "absolute", fontSize: 13, top: "121px", left: "30px"}}>Inspection history</span></p>
                    <select id="polygonlist" onChange={getPoly} size="4" style={{position: "absolute", top: "140px", width: "160px", left: "30px"}}></select>
                </Popup>
            </Polygon>
        </div> 
        )); 
    }

    return (
        <>
    <div className="map" id="map"></div>
        <MapContainer id="map-container" ref={setMap} center={position} zoom={15}>
            <LayersControl>
                <LayersControl.BaseLayer name="Streets" checked>
                    <TileLayer
                      url="https://{s}.tile.osm.org/{z}/{x}/{y}.png"
                      attribution="&copy; <a href=https://osm.org/copyright>OpenStreetMap</a> contributors"
                    />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Satellite" checked>
                    <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png"
                        attribution='&copy; <a href="Esri &mdash">Esri</a>'
                        maxNativeZoom = '25'
                        maxZoom = '25'
                    />
                </LayersControl.BaseLayer>
                
            </LayersControl>
            <FeatureGroup>
                <EditControl position="topleft" disabled={true} onCreated={geomCreated} edit={{edit: true, remove: true}} draw={{circle: false, rectangle: false, circlemarker: false}}/>
            </FeatureGroup> 
            <MarkerData/>
            <PolylineData/>
            <PolygonData/>
        </MapContainer>
        <Navbar imap={map}/>
        <InspectionForm 
            geometry={geom} 
            geometrytype={geomtype} 
            selected={selected} 
            imap={map} 
            selectedToken={selectToken} 
            selectedStatus={selectStatus}
        /> 
        <Location imap={map}/>
        </>
    ); 
}
export default Mapper;