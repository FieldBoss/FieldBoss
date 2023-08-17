  /* eslint-disable */
import React, { useState } from 'react';
import theDefault, * as XRPL from 'xrpl';
import './InspectionForm.css';
import ClipLoader from "react-spinners/ClipLoader";
import  polyLoadMaster from '../poly_load_master_peru.js';
import  pointLoadChild from '../point_load_child.js';
import  polyLoadChild from '../poly_load_child.js';
import L from "leaflet";
import { Buffer } from 'buffer';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { DataModel } from '@glazed/datamodel';
import { DIDDataStore } from '@glazed/did-datastore';
import { DID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver } from 'key-did-resolver';

let fileInput = true;
//the InspectionForm react component  
const InspectionForm = (props) => {
    const [loading, setLoading] = useState(false);  
    const [photourl, setPhotoUrl] = useState();

    //******// INITIALIZE/CONNECT XRPL
    const wallet = XRPL.Wallet.fromSeed("sEd7s2z2An6fo2ydznGHHXJxpqe4Rnf");
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
       
    //Connect to the Ceramic node - testnet
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
    const dataStore = new DIDDataStore({ ceramic, model: aliases });
    //******//

    let add = false;
    let selected = false;
    if (props.selected === true){selected = true};

    async function setCeramicData(theFormData, theGeom, theType, aSchema, flag) { 
        document.getElementById('selected').disabled = false;
        document.getElementById('new').disabled = false;
        document.getElementById('useclass').disabled = true;

        //GET - MERGE - SET
        let setGeom = {};
        if (theGeom != null){
            setGeom = await callGeom(theGeom, theType);
        } else {setGeom === "";}

        let masterArray = [], childArray = [];
        let masterData = await dataStore.get('MasterDefinition');
        let childData = await dataStore.get('ChildDefinition');
        let masterObj = {}, childObj = {};
        if (aSchema === 'MasterDefinition'){   //new plot is beiing created - child attributes will be nil
            masterObj = {
                "type": theType,
                "properties": {
                    "tokenid": theFormData.tokenid,
                    "assetid": theFormData.assetid,
                    "date": theFormData.date,
                    "useclass": theFormData.useclass,
                    "condition": theFormData.condition,
                    "density": theFormData.density,
                    "richness": theFormData.richness,
                    "production": theFormData.production,
                    "biomass": theFormData.biomass,
                    "inspector": theFormData.inspector,
                },
                "geometry": setGeom,
                "child": []
            }; 

            if (masterData === null){
                masterArray.push(masterObj)
                await dataStore.set(aSchema, {masterArray})    
            } else {
                //PERFORM MERGE of masterData WITH FORM DATA AS A JSON 
                masterArray.push(masterObj)
                for (var i = 0; i < masterData.masterArray.length; i++) {
                    masterArray.push(masterData.masterArray[i])
                } 
            
                await dataStore.set(aSchema, {masterArray})  //pin:true
            }
        } else if (aSchema === 'ChildDefinition'){    //this means a child token withing an existing plot is being created                                        
            //this object gets written to child schema
            childObj = {
                "type": theType,
                "properties": {
                    "tokenid": theFormData.tokenid,
                    "assetid": theFormData.assetid,
                    "date": theFormData.date,
                    "masterid": theFormData.masterid,
                    "condition": theFormData.condition,
                    "survival": theFormData.survival,
                    "richness": theFormData.richness,
                    "production": theFormData.production,
                    "diversity": theFormData.diversity,
                    "inspector": theFormData.inspector,
                }
            }; 

            if (childData === null){
                childArray.push(childObj)
            } else {
                //PERFORM MERGE of child Data WITH FORM DATA AS A JSON 
                childArray.push(childObj)
                for (var i = 0; i < childData.childArray.length; i++) {
                    childArray.push(childData.childArray[i])
                } 
            }
            //write to the child schema
            await dataStore.set(aSchema, {childArray})    //pin:true

            //now must find the masterData record that contains the child tokenid
            for (var ii = 0; ii < masterData.masterArray.length; ii++) {
                if (masterData.masterArray[ii].properties.tokenid === theFormData.masterid){
                    await masterData.masterArray[ii].child.push({
                        "type": theType,
                        "geometry": setGeom,
                        "tokenid": theFormData.tokenid
                    })
                } 
            }
            //write to the master schema
            await dataStore.set('MasterDefinition', masterData)
        }

        setLoading(false)  //stop progress spinner
        console.log('Data written to Ceramic database');
        if (flag === 2){window.location.reload(false);}
    }

    async function createNFT(ceramicURI) { 
        await client.connect();
        console.log("Connected to XRPL test blockchain");
        const txJSON = {
            TransactionType: "NFTokenMint",
            Account: wallet.classicAddress,
            NFTokenTaxon: 0,
            URI: Buffer.from(ceramicURI, 'utf8').toString('hex').toUpperCase()
        }
        const tx = await client.submitAndWait(txJSON, {wallet});

        console.log("NFT created");

        //get the tokenid of the new nft
        const nfts = await client.request({
        method: "account_nfts",
            account: wallet.classicAddress  
        })
        let tokenCount = 0;
        let myTokenID = '';
        for (var i = 0; i < nfts.result.account_nfts.length; i++) {
            if (nfts.result.account_nfts[i].nft_serial >= tokenCount){
                tokenCount = nfts.result.account_nfts[i].nft_serial;
                myTokenID = nfts.result.account_nfts[i].NFTokenID;
            }
        }
        return myTokenID;
    }

    async function createBatchSensorNFT(ceramicURI) { 
        await client.connect();
        console.log("Connected to XRPL test blockchain");
        const txJSON = {
            TransactionType: "NFTokenMint",
            Account: wallet.classicAddress,
            Flags: parseInt('11'),
            NFTokenTaxon: 0,
            URI: Buffer.from(ceramicURI, 'utf8').toString('hex').toUpperCase()
        }
        const tx = await client.submitAndWait(txJSON,{wallet});
        console.log("NFT created");

        //get the tokenid of the new nft
        const nfts = await client.request({
        method: "account_nfts",
            account: wallet.classicAddress  
        })
        let tokenCount = 0;
        let myTokenID = '';
        for (var i = 0; i < nfts.result.account_nfts.length; i++) {
            if (nfts.result.account_nfts[i].nft_serial >= tokenCount){
                tokenCount = nfts.result.account_nfts[i].nft_serial;
                 myTokenID = nfts.result.account_nfts[i].NFTokenID;
            }
        }
        return myTokenID;
    }

    //return tokenid of feature
    function getMasterToken(theAssetID, aData){
        for (var i = 0; i < aData.masterArray.length; i++) {
            if (aData.masterArray[i].properties.assetid.toString() === theAssetID.toString() && aData.masterArray[i].properties.tokenid != undefined){
                return aData.masterArray[i].properties.tokenid;
            } 
        } 
    }
    function getChildToken(theAssetID, aData){
        for (var i = 0; i < aData.childArray.length; i++) {
            if (aData.childArray[i].properties.assetid.toString() === theAssetID.toString() && aData.childArray[i].properties.tokenid != undefined){
                return aData.childArray[i].properties.tokenid;
            } 
        } 
    }

    //returns the number of NFTs in the current account
    async function callSerial(){
        const nfts = await client.request({
            method: "account_nfts",
            account: wallet.classicAddress
        })
        return nfts.result.account_nfts.length + 1;
    }

    async function callGeom(myGeom, myType){
        let polyArray = [];
        let lineArray = [];
        if (myType === 'marker'){
            let markerObj = {};
            markerObj.lat = +myGeom.lat.toFixed(6);
            markerObj.lng = +myGeom.lng.toFixed(6);
            return markerObj
        } else if (myType === 'polygon'){
            for (var i = 0; i < myGeom[0].length; i++) {
                let polyObj = {};
                polyObj.lat = +myGeom[0][i].lat.toFixed(6);
                polyObj.lng = +myGeom[0][i].lng.toFixed(6);
                polyArray.push(polyObj)
            }
            let polyArray2 = [];
            polyArray2.push(polyArray);
            return polyArray2
        } else if (myType === 'polyline'){
            for (var j = 0; j < myGeom.length; j++) {
                let lineObj = {};
                lineObj.lat = +myGeom[j].lat.toFixed(6);
                lineObj.lng = +myGeom[j].lng.toFixed(6);
                lineArray.push(lineObj)
            }
            return lineArray
        }
    }

    function disableFormControls(flag) {
        //enable/disable all drop-down controls on form except bmpid, date, inspector, and type
        document.getElementById("condition").disabled = flag;
        document.getElementById("deterioration").disabled = flag;
        document.getElementById("debris").disabled = flag;
        document.getElementById("erosion").disabled = flag;
        document.getElementById("sediment").disabled = flag;
    }

    function disableFormControls2(flag) {
        //enable/disable all drop-down controls on form except bmpid, date, inspector, and mastetoken
        document.getElementById("condition2").disabled = flag;
        document.getElementById("deterioration2").disabled = flag;
        document.getElementById("debris2").disabled = flag;
        document.getElementById("erosion2").disabled = flag;
        document.getElementById("sediment2").disabled = flag;
    }

    async function newID() {
        await client.connect();
        const nfts = await client.request({
            method: "account_nfts",
            account: wallet.classicAddress  
        })
        //get number of NFTs in the account
        return nfts.result.account_nfts.length + 1;
        client.disconnect();
    }

    function setCurrentDate() {
        let current_datetime = new Date()
        let formatted_date = current_datetime.getFullYear() + "-" + (current_datetime.getMonth() + 1) + "-" + current_datetime.getDate() + " " + current_datetime.getHours() + ":" + current_datetime.getMinutes() + ":" + current_datetime.getSeconds() 
        return formatted_date;
    }

    async function clickNewChild(event) {
        event.preventDefault();

        //check for a selected master feature
        let count = 0;
        props.imap.eachLayer(function (layer) {
            if (layer.options.color === 'yellow'){
                count++
            }
        });
       
        //filter out no selection at all or a child token is selected
        if (count === 0 || props.selectedStatus === "child") {
            selected = false;
            alert("Select a master feature on the map.");
            document.getElementById("masterformid").style.display="block";
            document.getElementById("childformid").style.display="none";
            //clear selected feature if there is one
            props.imap.eachLayer(function (layer) {
                if(layer.options.color === 'yellow'){
                    props.imap.removeLayer(layer)
                }
            });
            return
        } else {
            selected = true;
            add = true;

            document.getElementById("masterformid").style.display="none";
            document.getElementById("childformid").style.display="block";
            document.getElementById("childformid").hidden = false;

            document.getElementById("mastertoken").disabled = true;
            document.getElementById("mastertoken").selectedIndex = "-1";
            document.getElementById("condition2").selectedIndex = "-1";
            document.getElementById("deterioration2").selectedIndex = "-1";
            document.getElementById("debris2").selectedIndex = "-1";
            document.getElementById("sediment2").selectedIndex = "-1";
            document.getElementById("erosion2").selectedIndex = "-1";

            document.getElementById('new').style.backgroundColor = "rgb(167, 185, 170)";
            document.getElementById('selected').style.backgroundColor = "gray";
            document.getElementById("submit2").disabled = false;

            //clear the photo canvas and deactivate video control
            const canvas = document.getElementById("myCanvas");
            const context = canvas.getContext('2d', {willReadFrequently: true});
            context.clearRect(0, 0, canvas.width, canvas.height); 
            const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
            document.getElementById("video").srcObject = null;

            disableFormControls2(false);

            //remove items from date2 and bmpid2 and mastertoken select elements
            for (var k = 0; k < document.getElementById("date2").options.length; k++) { 
                document.getElementById("date2").remove(k);
            }
            for (var m = 0; m < document.getElementById("bmpid2").options.length; m++) { 
                document.getElementById("bmpid2").remove(m);
            }
            for (var m = 0; m < document.getElementById("mastertoken").options.length; m++) { 
            document.getElementById("mastertoken").remove(m);
            }
            //set the new bmpid and date and master token values
            document.getElementById("date2").add(new Option(setCurrentDate()));
            document.getElementById("bmpid2").add(new Option(await newID()));
            document.getElementById("mastertoken").add(new Option(props.selectedToken));

            fileInput = false;
        }
    }

    async function clickNewMaster(event) {
        event.preventDefault();

        add = true;
        selected = false;

        document.getElementById("masterformid").style.display="block";
        document.getElementById("childformid").style.display="none";
    
        document.getElementById('new').style.backgroundColor = "rgb(167, 185, 170)";
        document.getElementById('selected').style.backgroundColor = "gray";
        document.getElementById("submit").disabled = false;

        //remove previous yellow feature
        props.imap.eachLayer(function (layer) {
            if(layer.options.color === 'yellow'){
                props.imap.removeLayer(layer)
            }
        });

        //clear the photo canvas and deactivate video control
        const canvas = document.getElementById("myCanvas");
        const context = canvas.getContext('2d', {willReadFrequently: true});
        context.clearRect(0, 0, canvas.width, canvas.height); 
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        document.getElementById("video").srcObject = null;

        disableFormControls(false);

        document.getElementById("useclass").disabled = false;
        document.getElementById("useclass").selectedIndex = "-1";
        document.getElementById("condition").selectedIndex = "-1";
        document.getElementById("deterioration").selectedIndex = "-1";
        document.getElementById("debris").selectedIndex = "-1";
        document.getElementById("sediment").selectedIndex = "-1";
        document.getElementById("erosion").selectedIndex = "-1";
  
        //remove items from date and bmpid select elements
        for (var k = 0; k < document.getElementById("date").options.length; k++) { 
            document.getElementById("date").remove(k);
        }
        for (var m = 0; m < document.getElementById("bmpid").options.length; m++) { 
            document.getElementById("bmpid").remove(m);
        }
        //set the new bmpid and date values
        document.getElementById("date").add(new Option(setCurrentDate()));
        document.getElementById("bmpid").add(new Option(await newID()));
        fileInput = false;
    }

    const masterLoad = (event) => {
        disableFormControls(true);
        document.getElementById('selected').disabled = true;
        document.getElementById('new').disabled = true;
      //  document.getElementById('type').disabled = true;
        document.getElementById('submit').disabled = false;
        document.getElementById("masterformid").style.display="block";
        document.getElementById("childformid").style.display="none";
        fileInput = true;
    }

    const childLoad = (event) => {
        disableFormControls2(true);
        document.getElementById('selected').disabled = true;
        document.getElementById('new').disabled = true;
        document.getElementById('mastertoken').disabled = true;
        document.getElementById('submit2').disabled = false;
        fileInput = true;
    }

    const clickNewInspection = (event) => {
        add = false;
        //validate a feature selection on the map
        if (selected === true){
            disableFormControls(false);
            disableFormControls2(false);
            document.getElementById("useclass").disabled = false;
        
            //clear the select form elements
            document.getElementById("condition").selectedIndex = "-1";
            document.getElementById("deterioration").selectedIndex = "-1";
            document.getElementById("debris").selectedIndex = "-1";
            document.getElementById("sediment").selectedIndex = "-1";
            document.getElementById("erosion").selectedIndex = "-1";

            document.getElementById("condition2").selectedIndex = "-1";
            document.getElementById("deterioration2").selectedIndex = "-1";
            document.getElementById("debris2").selectedIndex = "-1";
            document.getElementById("sediment2").selectedIndex = "-1";
            document.getElementById("erosion2").selectedIndex = "-1";
        
            for (var k = 0; k < document.getElementById("date").options.length; k++) { 
                document.getElementById("date").remove(k);
            }
            for (var j = 0; j < document.getElementById("date2").options.length; j++) { 
                document.getElementById("date2").remove(k);
            }
            //set the date to current
            document.getElementById("date").add(new Option(setCurrentDate()));
            document.getElementById("date2").add(new Option(setCurrentDate()));
            document.getElementById('selected').style.backgroundColor = "rgb(167, 185, 170)";
            document.getElementById("submit").disabled = false;
            document.getElementById("submit2").disabled = false;
        } else {
            alert("Select a feature on the map.");
            document.getElementById('selected').style.backgroundColor = "gray";
            disableFormControls(true);
            disableFormControls2(true);
        }
        fileInput = false;
    };

    async function enableCamera(){
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        document.getElementById("video").srcObject = videoStream;

        const canvas = document.getElementById("myCanvas");
        const context = canvas.getContext('2d', {willReadFrequently: true});
        context.clearRect(0, 0, canvas.width, canvas.height); 
    }

    async function captureImage(){
        const canvas = document.getElementById("myCanvas");
        const video = document.getElementById("video")
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d', {willReadFrequently: true}).drawImage(video, 0, 0);
        const img = document.createElement('img');
        img.src = canvas.toDataURL();

        //const dataURL = canvas.toDataURL('image/jpeg', 0.1);
        //setPhotoUrl(dataURL);
        //console.log(photourl)
    }

    function deleteImage(){
        //document.getElementById("video").srcObject = null;
        const canvas = document.getElementById("myCanvas");
        const context = canvas.getContext('2d', {willReadFrequently: true});
        context.clearRect(0, 0, canvas.width, canvas.height); 

        //let canvasUrl = canvas.toDataURL('image/jpeg', 0.1);
        // Create an anchor, and set the href value to our data URL
        //const createEl = document.createElement('a');
        //createEl.href = canvasUrl;
        //console.log(createEl)
    }

    //event handler for childform submit
    async function childSubmit(event){
        event.stopPropagation();
        event.preventDefault();

        //call function to determine if there's a selection
        let subStatus = disableSubmit2();
        let defType = 'ChildDefinition';
        const childData = await dataStore.get(defType);

        if (fileInput === true) {
            //check for a selected master feature
            let count = 0;
            props.imap.eachLayer(function (layer) {
                if (layer.options.color === 'yellow'){
                    count++
                }
            });
            if (count === 0 || props.selectedStatus === "child") {
                alert("Select a master feature on the map.");
                return
            }
            // child points
            let tObj = {};
            for (var i = 0; i < pointLoadChild.loader.length; i++) {
                tObj = pointLoadChild.loader[i].geometry[0];
                let myID = await newID();
                //create an object containing the user specified data entered into the form
                const formData = {
                    tokenid: "x",
                    assetid: myID,
                    date: setCurrentDate(),
                    masterid: document.getElementById("mastertoken").value,
                    condition: pointLoadChild.loader[i].properties.condition,
                    survival: pointLoadChild.loader[i].properties.survival,
                    richness: pointLoadChild.loader[i].properties.richness,
                    production: pointLoadChild.loader[i].properties.production,
                    diversity: pointLoadChild.loader[i].properties.diversity,
                    inspector: pointLoadChild.loader[i].properties.inspector
                };

                setLoading(true)  //start progress spinner
                let NFTmint = await createBatchSensorNFT(aliases.schemas.ChildSchema);
                formData.tokenid = NFTmint;
                await setCeramicData(formData, tObj, 'marker', defType, 1);
            }
            //child polys
            for (var i = 0; i < polyLoadChild.loader.length; i++) {
                let tArray = [];
                for (var x = 0; x < polyLoadChild.loader[i].geometry.length; x++) {
                    tArray.push(polyLoadChild.loader[i].geometry[x]);
                }
                let tArray2 = []
                tArray2.push(tArray)
                let myID = await newID();
                //create an object containing the user specified data entered into the form
                const formData = {
                    tokenid: "x",
                    assetid: myID,
                    date: setCurrentDate(),
                    masterid: document.getElementById("mastertoken").value,
                    condition: polyLoadChild.loader[i].properties.condition,
                    survival: polyLoadChild.loader[i].properties.survival,
                    richness: polyLoadChild.loader[i].properties.richness,
                    production: polyLoadChild.loader[i].properties.production,
                    diversity: polyLoadChild.loader[i].properties.diversity,
                    inspector: polyLoadChild.loader[i].properties.inspector
                };

                setLoading(true)  //start progress spinner
                let NFTmint = await createBatchSensorNFT(aliases.schemas.MasterSchema);
                formData.tokenid = NFTmint;
                await setCeramicData(formData, tArray2, 'polygon', defType, 1);
            }
        } else if (fileInput === false && subStatus === false) {
            const formData = {
                tokenid: "x",
                assetid: event.target[0].value,
                date: event.target[1].value,
                masterid: event.target[2].value,
                condition: event.target[3].value,
                survival: event.target[4].value,
                richness: event.target[5].value,
                production: event.target[6].value,
                diversity: event.target[7].value,
                inspector: event.target[8].value
            };

            if (props.geometry != null) {     //new geometry (map feature) has been defined which will get inspected (create new NFT)    
                setLoading(true);
                let NFTdate = createNFT(aliases.schemas.ChildSchema)
                NFTdate.then(function(res) {
                    formData.tokenid = res;
                    setCeramicData(formData, props.geometry, props.geometrytype, defType, 2);
                })
            } else {   //selected map feature will get a new inspection added to ceramic
                setLoading(true);
                let myToken = getChildToken(formData.assetid, childData);
                formData.tokenid = myToken;
                await setCeramicData(formData, null, props.geometrytype, defType, 0);
            }
            disableFormControls2(true); 
        }
    }

    //event handler for masterform submit
    async function masterSubmit(event){
        event.stopPropagation();
        event.preventDefault();

        //call function to determine if there's a selection
        let subStatus = disableSubmit();
        let defType = 'MasterDefinition';
        const masterData = await dataStore.get(defType);
        if (fileInput === true) {
            for (var i = 0; i < polyLoadMaster.loader.length; i++) {
                let tArray = [];
                for (var x = 0; x < polyLoadMaster.loader[i].geometry.length; x++) {
                    tArray.push(polyLoadMaster.loader[i].geometry[x]);
                }
                let tArray2 = []
                tArray2.push(tArray)
       
                let myID = await newID();
                //create an object containing the user specified data entered into the form
                const formData = {
                    tokenid: "x",
                    assetid: myID,
                    date: setCurrentDate(),
                    useclass: polyLoadMaster.loader[i].properties.useclass,
                    condition: polyLoadMaster.loader[i].properties.condition,
                    density: polyLoadMaster.loader[i].properties.density,
                    richness: polyLoadMaster.loader[i].properties.richness,
                    production: polyLoadMaster.loader[i].properties.production,
                    biomass: polyLoadMaster.loader[i].properties.biomass,
                    inspector:polyLoadMaster.loader[i].properties.inspector
                };

                setLoading(true)  //start progress spinner
                let NFTmint = await createBatchSensorNFT(aliases.schemas.MasterSchema);
                formData.tokenid = NFTmint;
                await setCeramicData(formData, tArray2, 'polygon', defType, 1);
            }
        } else if (fileInput === false && subStatus === false) {
            const formData = {
                tokenid: "x", 
                assetid: event.target[0].value,
                date: event.target[1].value,
                useclass: event.target[2].value,
                condition: event.target[3].value,
                density: event.target[4].value,
                richness: event.target[5].value,
                production: event.target[6].value,
                biomass: event.target[7].value,
                inspector: event.target[8].value
            };

            //create NFTs and write to ceramic
            if (props.geometry != null) {     //new geometry (map feature) has been defined which will get inspected (create new NFT)    
                setLoading(true);  //start progress spinner
                let NFTmint = createNFT(aliases.schemas.MasterSchema)
                NFTmint.then(function(res) {
                    formData.tokenid = res;
                    setCeramicData(formData, props.geometry, props.geometrytype, defType, 2);
                })
            } else {    //selected map feature will get a new inspection added to ceramic
                setLoading(true);
                let masterToken = getMasterToken(formData.assetid, masterData);
                formData.tokenid = masterToken;
                await setCeramicData(formData, null, props.geometrytype, defType, 0);
            }
            disableFormControls(true); 
        }
    }

    function disableSubmit() {
        let sub = document.getElementById('submit');
        sub.disabled = true;
        document.getElementById('selected').disabled = true;
        document.getElementById('new').disabled = true;
        document.getElementById('submit').disabled = false;
        if (props.geometry === undefined && add === true && fileInput === false){
            alert("Add a master feature to the map before submitting.");
            return true;
        } else {
            document.getElementById('submit').disabled = true;
            return false;
        }
    }

    function disableSubmit2() {
        let sub = document.getElementById('submit2');
        sub.disabled = true;
        document.getElementById('selected').disabled = true;
        document.getElementById('new').disabled = true;
        document.getElementById('submit2').disabled = false;
        if (props.geometry === undefined && add === true && fileInput === false){
            alert("Add a child feature to the map before submitting.  Will be a child of the selected master");
            return true;
        } else {
        document.getElementById('submit2').disabled = true;
            return false;
        }
    }

    async function setLoad(){
        let defType = 'MasterDefinition';
        for (var i = 0; i < polyLoadMaster.loader.length; i++) {
            let tArray = [];
            for (var x = 0; x < polyLoadMaster.loader[i].geometry.length; x++) {
                tArray.push(polyLoadMaster.loader[i].geometry[x]);
            }
            let tArray2 = []
            tArray2.push(tArray)
       
            let myID = await newID();
            //create an object containing the default data entered into the form
            const formData = {
                tokenid: "x",
                assetid: myID,
                date: setCurrentDate(),
                useclass: polyLoadMaster.loader[i].properties.useclass,
                condition: polyLoadMaster.loader[i].properties.condition,
                density: polyLoadMaster.loader[i].properties.density,
                richness: polyLoadMaster.loader[i].properties.richness,
                production: polyLoadMaster.loader[i].properties.production,
                biomass: polyLoadMaster.loader[i].properties.biomass,
                inspector:polyLoadMaster.loader[i].properties.inspector
            };

            setLoading(true)  //start progress spinner
            let NFTmint = await createBatchSensorNFT(aliases.schemas.MasterSchema);
            formData.tokenid = NFTmint;
            await setCeramicData(formData, tArray2, 'polygon', defType, 1);
        }
        window.location.reload(false);
    }

    return ( 
    <>
    <div>
    <video autoPlay id="video"></video>
    <canvas id="myCanvas"></canvas>
    <img src="camera.png" alt="my image" onClick={enableCamera} style={{ position: "relative", left: "970px", height: "27px", top: "9px", width:"35px" }}/>
    <button id="capture" onClick={captureImage} style={{ position: "relative", borderRadius: "30%", backgroundColor: "#379c37", left: '770px', height: "20px", top: "11px", width:'20px' }}></button> 
    <button id="delete" onClick={deleteImage} style={{ position: "relative", borderRadius: "30%", backgroundColor: "#a52c24", left: '715px', height: "20px", top: "11px", width:'20px' }}></button>
    
    <button className='action-button' id='selected' onClick={clickNewInspection}>Inspect Selected</button>
    <button className='action-button2' id='new' onClick={clickNewMaster}>M+</button>
    <button className='action-button1' id='new' onClick={clickNewChild}>C+</button>
    {/* <button id="masterload" onClick={masterLoad}>M</button>
    <button id="childload" onClick={childLoad}>C</button> */}
          
    <form className="masterform" id="masterformid" onSubmit={masterSubmit}> 
        <div>
            <label style={{ position: "relative", width: "135px", top: "44px", right: "56px" }}>Master ID:</label>
            <select id="bmpid" required style={{ position: "relative", width: "95px", height: "25px", right: "45px", top: "43px", color: "blue", fontsize: "17px", fontweight: "bold" }} disabled></select>
        </div>
        <div>
            <label style={{ position: "relative", top: "52px", width: "135px", right: "84px", fontweight: "bold" }}>Inspection Date:</label>
            <select id="date" required style={{ position: "relative", width: "165px", height: "25px", left: "57px", top: "28px", color: "blue", fontsize: "17px", fontweight: "bold" }} disabled> </select>                   
        </div>
        <div>
            <label style={{ position: "relative", top: "38px", width: "135px", right: "87px", fontweight: "bold" }}>Land Use Class:</label>
            <select id="useclass" required style={{ position: "relative", width: "165px", height: "25px", left: "57px", top: "14px", color: "blue", fontsize: "17px", fontweight: "bold" }} disabled>
                <option value="Natural without human activities">Natural without human activities</option>
                <option value="Natural with human activities">Natural with human activities</option>
                <option value="Planted forest">Planted forest</option>
                <option value="Plantation for timber">Plantation for timber</option>
                <option value="Agroforestry">Agroforestry</option>
            </select>
        </div>
        <div>
            <label style={{ position: "relative", top: "23px", width: "145px", right: "77px", fontweight: "bold" }}>Overall Condition:</label>
            <select id="condition" required style={{ position: "relative", width: "140px", height: "25px", left: "70px", top: "-1px", color: "blue", fontsize: "17px", fontweight: "bold" }} disabled>
                <option value="Healthy">Healthy</option>
                <option value="Degraded">Degraded</option>
                <option value="Deforested">Deforested</option>
            </select>
        </div>
        <div>
            <label style={{ position: "relative", top: "8px", width: "165px", right: "84px", fontweight: "bold" }}>Canopy Density:</label>
            <select id="deterioration" required style={{ position: "relative", width: "140px", height: "25px", left: "70px", top: "-15px", color: "blue", fontsize: "17px", fontweight: "bold" }} disabled>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="N/A">N/A</option>
            </select>
        </div>
        <div>
            <label style={{ position: "relative", top: "-6px", width: "155px", right: "80px", fontweight: "bold" }}>Species Richness:</label>
            <select id="debris" required style={{ position: "relative", width: "140px", height: "25px", left: "70px", top: "-30px", color: "blue", fontsize: "17px", fontweight: "bold" }} disabled>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="N/A">N/A</option>
            </select>
        </div>
        <div>
            <label style={{ position: "relative", top: "-21px", width: "155px", right: "74px", fontweight: "bold" }}>Forest Productivity:</label>
            <select id="erosion" required style={{ position: "relative", width: "140px", height: "25px", left: "70px", top: "-44px", color: "blue", fontsize: "17px", fontweight: "bold" }} disabled>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="N/A">N/A</option>
            </select>
        </div>
        <div>
            <label style={{ position: "relative", top: "-36px", width: "175px", right: "58px", fontweight: "bold" }}>Above Ground Biomass:</label>
            <select id="sediment" required style={{ position: "relative", width: "115px", height: "25px", left: "82px", top: "-59px", color: "blue", fontsize: "17px", fontweight: "bold" }} disabled>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="N/A">N/A</option>
            </select>
        </div>
        <div>
            <label style={{ position: "relative", top: "-50px", width: "155px", right: "83px", fontweight: "bold" }}>Inspector Name:</label>
            <select id="inspector" required style={{ position: "relative", width: "160px", height: "25px", left: "60px", top: "-73px", color: "blue", fontsize: "17px", fontweight: "bold" }} disabled>
                <option value={"Forest Inspector #1"}>{"Forest Inspector #1"}</option>
            </select>
        </div>

        <div>
            <button type="submit" id="submit">Submit Master</button>
        </div>
        <ClipLoader
            color={'red'}
            loading={loading}
            cssOverride={{ position: "absolute", left: "215px", bottom: "11px", borderColor: "red"}}
            size={35}
        />
    </form>


    <form className="childform" id="childformid" onSubmit={childSubmit} hidden> 
        <div>
            <label style={{ position: "relative", width: "135px", top: "44px", right: "62px" }}>Child ID:</label>
            <select id="bmpid2" required style={{ position: "relative", width: "95px", height: "25px", right: "45px", top: "43px", color: "blue", fontsize: "17px", fontweight: "bold" }} disabled></select>
        </div>
        <div>
            <label style={{ position: "relative", top: "52px", width: "135px", right: "84px", fontweight: "bold" }}>Inspection Date:</label>
            <select id="date2" required style={{ position: "relative", width: "165px", height: "25px", left: "57px", top: "28px", color: "blue", fontsize: "17px", fontweight: "bold" }} disabled> </select>                   
        </div>
        <div>
            <label style={{ position: "relative", top: "38px", width: "135px", right: "90px", fontweight: "bold" }}>Master Token:</label>
            <select id="mastertoken" required style={{ position: "relative", width: "165px", height: "25px", left: "57px", top: "14px", color: "blue", fontsize: "17px", fontweight: "bold" }} disabled></select>
        </div>
        <div>
            <label style={{ position: "relative", top: "23px", width: "145px", right: "102px", fontweight: "bold" }}>Condition:</label>
            <select id="condition2" required style={{ position: "relative", width: "140px", height: "25px", left: "70px", top: "-1px", color: "blue", fontsize: "17px", fontweight: "bold" }} disabled>
                <option value="Healthy">Healthy</option>
                <option value="Degraded">Degraded</option>
                <option value="Threatened">Threatened</option>
            </select>
        </div>
        <div>
            <label style={{ position: "relative", top: "8px", width: "165px", right: "110px", fontweight: "bold" }}>Survival:</label>
            <select id="deterioration2" required style={{ position: "relative", width: "140px", height: "25px", left: "70px", top: "-15px", color: "blue", fontsize: "17px", fontweight: "bold" }} disabled>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="N/A">N/A</option>
            </select>
        </div>
        <div>
            <label style={{ position: "relative", top: "-6px", width: "155px", right: "80px", fontweight: "bold" }}>Species Richness:</label>
            <select id="debris2" required style={{ position: "relative", width: "140px", height: "25px", left: "70px", top: "-30px", color: "blue", fontsize: "17px", fontweight: "bold" }} disabled>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="N/A">N/A</option>
            </select>
        </div>
        <div>
            <label style={{ position: "relative", top: "-21px", width: "155px", right: "95px", fontweight: "bold" }}>Productivity:</label>
            <select id="erosion2" required style={{ position: "relative", width: "140px", height: "25px", left: "70px", top: "-44px", color: "blue", fontsize: "17px", fontweight: "bold" }} disabled>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="N/A">N/A</option>
            </select>
        </div>
        <div>
            <label style={{ position: "relative", top: "-36px", width: "175px", right: "81px", fontweight: "bold" }}>Species Diversity:</label>
            <select id="sediment2" required style={{ position: "relative", width: "115px", height: "25px", left: "82px", top: "-59px", color: "blue", fontsize: "17px", fontweight: "bold" }} disabled>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="N/A">N/A</option>
            </select>
        </div>
        <div>
            <label style={{ position: "relative", top: "-50px", width: "155px", right: "83px", fontweight: "bold" }}>Inspector Name:</label>
            <select id="inspector" required style={{ position: "relative", width: "160px", height: "25px", left: "60px", top: "-73px", color: "blue", fontsize: "17px", fontweight: "bold" }} disabled>
                <option value={"Forest Inspector #1"}>{"Forest Inspector #1"}</option>
            </select>
        </div>

        <div>
            <button type="submit" id="submit2">Submit Child</button>
        </div>
        <ClipLoader
            color={'red'}
            loading={loading}
            cssOverride={{ position: "absolute", left: "215px", bottom: "11px", borderColor: "red"}}
            size={35}
        />
    </form>
    <select id="loader" onChange={setLoad} style={{ position: "relative", width: "170px", height: "25px", left: "1110px", top: "-633px", color: "blue", fontsize: "15px", fontweight: "bold" }}>
        <option value="Healthy">Master Plots</option>
    </select>
    </div>
    </>
  );
} 
export default InspectionForm;



