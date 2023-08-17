import "./Location.css";
import L from "leaflet";

const ToggleSwitch = (props) => {
    let myLayerGroup = L.layerGroup([]);

    function goToCurrent(){
        props.imap.locate({setView: false, maxZoom: 16});
        props.imap.on('locationfound', onLocationFound);
    }

    function onLocation(){
        let locString = document.getElementById("loc").value;
        let locArray = locString.split(",")
        props.imap.setView([locArray[0], locArray[1]], 12);
    }

    function onLocationFound(e) {
        var radius = 20;
        myLayerGroup = L.layerGroup([L.marker(e.latlng), L.circle(e.latlng, radius)]);
        myLayerGroup.addTo(props.imap);
       
        //zoom to location
        var lat = e.latlng.lat;
        var lng = e.latlng.lng;
        var zoom = 16;
        props.imap.setView([lat, lng], zoom);
        document.getElementById("loc").value = lat + ',' + lng;
    }

    return (
        <>
        <input type="text" className="location" id="loc" onChange={onLocation} value='-3.179759915802777, -59.04756794611799'/>
        <img src="globe.png" alt="my image" onClick={goToCurrent} style={{ position: "relative", left: "795px", height: "24px", top: "-660px", width:"24px" }}/>
        <span style={{position: "relative", top: "-659px", left: "500px"}} z-index= "400">Location:</span>
        </>
    );
}
export default ToggleSwitch; 