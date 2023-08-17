import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

const UserManual = (props) => {
  return (
    <Modal
      {...props} 
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          FieldBoss User Guide
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div id="top"></div>
        <h2 id="what-is-fieldboss"><u>Welcome to FieldBoss!</u></h2>
        <p><em><strong>FieldBoss</strong></em> is a prototype GIS application that incorporates Distributed Ledger Technology (Blockchain)
          into the process of collecting and storing spatial geometries (points, line, polygons).  Click
          a feature on the map to display a popup and click 'select' to view recent inspection data.  
          Zoom to your current location by clicking the 'globe' button and start collecting and reviewing spatial 
          data.  See 'Navigating the UI' for specific instructions. (Note: the default theme is Stormwater Inspection)  
          FieldBoss is adaptable and can be used to collect any type of data at any location.
        </p>
        <details open>
          <summary>Table of Contents</summary>
          <ol>
            <li><a href="#what-is-fieldboss">What Is FieldBoss</a></li>
            <li>
              <a href="#what-is-a-geo-located-nft">What Is A Geo-Located NFT</a>
              </li>
            <li>
              <a href="#about-the-project">A FieldBoss Use Case</a>
             
            </li>
            <li>
              <a href="#getting-started">Getting Started</a>
            </li>
            <li>
              <a href="#navigating-the-ui">Navigating the UI</a>
            </li>
            <li><a href="#built-with">Built With</a></li>
            <li><a href="#roadmap">Roadmap</a></li>
            <li><a href="#contact">Contact</a></li>
          </ol>
        </details>

        <h2 id="what-is-fieldboss">What Is FieldBoss</h2>
        <p><em><strong>FieldBoss</strong></em> is a mapping application that merges blockchain technology with popular open source GIS mapping tools through the use of geo-located XRPL NFTs. With FieldBoss, GIS applications are extended to include the real-time tokenization of 2d/3d unique geometries collected by field crews. By combining the analytical power of GIS (assets represented spatially) with the transparency, immutability, and security of blockchain technology we can show the spatial and temporal distribution of information which is securely stored on blockchain and distributed file systems.</p>
        <h2 id="what-is-a-geo-located-nft">What Is A Geo-Located NFT</h2>
        <p>GeoJSON is an open standard format (based on JSON format) designed for representing geographical features (geometries), along with their non-spatial attributes. The features include points, lines, polygons, and multi-part collections. A geo-located NFT contains spatial geometries stored in the XRP Ledger as GeoJSON.  The data describing the NFT is stored as related metadata in a distributed file system.  As a result, an NFT's location can be derived and plotted onto a map and non-spatial attributes assigned to the location.</p>
        <p>Geo-located XRPL NFTs adhere to the GeoJSON spatial data standard recognized by most GIS mapping applications which provides interoperability between FieldBoss and GIS.</p>
        <h2 id="about-the-project">A FieldBoss Use Case</h2>
        <p>The <em><strong>FieldBoss</strong></em> application is designed to be an easy to use map based data collection tool that incorporates the concept of decentralized spatial data collection and storage.  Built with interchangeable  React Components, it can be easily tailored for most field mapping needs.</p>
        <p>Here we present a <em><strong>FieldBoss</strong></em> use case showing how geo-located NFTs created on the XRP Ledger can be used in a field mapping application that performs and manages routine inspections of stormwater abatement structures (BMPs).  Each structure on the map is represented as a point, line, or polygon feature.  The geometry of these features is stored within an NFT on the XRP Ledger.  New structures can be added and existing structures can be inspected.  A record of all inspections (current and previous) for each feature is stored in a decentralized file system (Ceramic) and retrievable through the application's data form.    </p>
       
        <h2 id="getting-started">Getting Started</h2>
        <p>The <em><strong>FieldBoss</strong></em> application has been deployed on AWS as a web service available to all.  No installation or configuration is required.  This web service application serves as a demo and is designed to be a 'sandbox' that can be used to collect 'real data' in the field.</p>
        <ul>
          <li>Supported Browsers:  <ul>
          <li>Chrome  </li>
          <li>Brave  </li>
          <li>FireFox  </li>
          <li>Edge</li>
          <li>Not formatted for mobile phones  </li>
        </ul>
        </li>
        </ul>
        <h2 id="navigating-the-ui">Navigating the UI</h2>
        <p>This application uses the Testnet on the XRP Ledger.  A default account has been created for BMP Inspector #1 and the account details are embedded into the code.  As a result, no login is required and all XRP Ledger transactions will use that account.  In a production environment, each user (inspector/organization) will have a separate account on XRPL Mainnet and login will be required.</p>
        <p>The application UI is divided into 3 interacting components including the navigation bar, data form, and interactive map.  Following is a description of how to use the tools within each component:</p>
        <ol>
          <li><strong>Navigation Bar - </strong>Across the top is the navigation bar which has several useful tools:</li>
          <ul>
          <li><ins>Download GeoJSON</ins> - User can download all data from XRP Ledger and Ceramic for the current account into GeoJSON format which can be easily imported into desktop GIS applications</li>
          <li><ins>User Guide</ins> - Background and instructions for the FieldBoss application</li>
          <li><ins>Location</ins> - User can paste lat/long coordinates into the box to zoom map to that location or click the location button to zoom the map to the user's current location.</li>
          <li><ins>Login</ins> - Currently disabled</li>
        </ul>
          <li><strong>Data Form - </strong>On the right side of the display, the data form allows the user to interact with the attribute data specific to the features shown on the map.</li>
          <ul>
          <li><ins>Form</ins> - The data form element displays the specific inspection details of a selected feature from the map.  The form is read-only unless the user is adding  a new feature or inspecting an existing one.</li>
          <li><ins>Camera</ins> - The camera element uses the current device's built-in camera to allow the user to take a photo while performing an inspection and write the image to the decentralized database.  This functionalilty is currently disabled.  The images that you may see when using the application are for demonstration only.</li>
          </ul>
       
          <li><p><strong>Interactive Map - </strong>User will use the map interface to create new features (geometries) and/or select existing features to be inspected.</p>
          <ul>
          <li><ins>Create Feature</ins> - To create a new feature click on the 'Add BMP' button on the form.  The form will be pre-populated with the new BMP-id and the current date.  Fill out the form with the conditions pertaining to the feature (BMP structure) that you are adding.  Next, add the geometry to the map by selecting a geometry type from the toolbar on the left (point, line, or polygon).  Click on the map to create the geometry.  Next, click the 'Submit' button on the form.  A progress indicator will popup and when completed the display will refresh showing the new feature on the map.  A new geo-located XRPL NFT has been created and its related information from the form has been added to the distributed file system (Ceramic).</li>
          <li><ins>Select Feature</ins> - Existing features seen on the map can be selected with a mouse click which activates a popup window.  The popup window shows a list of past inspections on that feature with the most recent at the top.  The 'Select' button will highlight that feature on the map and populate the data form with details of the most recent inspection.  Once a feature is selected, a new inspection can be performed by clicking on the 'Inspect BMP' button which will allow the user to add current inspection details regarding the selected feature.  Click the 'Submit' button to commit the inspection to the decentralized database (Ceramic).  Also in the popup window is a link to the XRPL explorer which will show ledger details of the feature (geo-located NFT).</li>
        </ul>
          <p align="right">(<a href="#top">back to top</a>)</p>
          </li>
        </ol>
        <h2 id="built-with">Built With</h2>
        <ul>
          <li><a href="https://reactjs.org/">React</a> – a JavaScript library for building user interfaces</li>
          <li><a href="https://leafletjs.com/">Leaflet</a> – a popular open source JavaScript library for building web mapping applications</li>
          <li><a href="https://react-leaflet.js.org/">React Leaflet</a> - React components for Leaflet maps</li>
          <li><a href="https://xrpl.org/">xrpl.js</a> - Javascript library for integrating an app with the XRP Ledger,</li>
          <li>XRP Ledger(<a href="https://testnet.xrpl.org/">https://testnet.xrpl.org</a> - Testnet Data)</li>
          <li><a href="https://ceramic.network/">Ceramic</a> - a decentralized data network for Web3 applications</li>
          <li><a href="https://nodejs.org/en/">Node.js</a> - a cross-platform JavaScript runtime environment</li>
        </ul>
        <h2 id="roadmap">Roadmap</h2>
        <ul>
          <li>Add integration with IoT data sources</li>
          <li>Build mobile FieldBoss application using xrpl4j Java library</li>
          <li>Develop standardized schemas and user interfaces for ease of deployment</li>
          <li>Add integration with 3d scanned &#39;point clouds&#39; and other big data<p align="right">(<a href="#top">back to top</a>)</p></li>
        </ul>
        <h2 id="contact">Contact</h2>
        <p>Scott Randolph - <a href="mailto:&#98;&#x6c;&#111;&#99;&#107;&#108;&#97;&#x67;&#111;&#111;&#x6e;&#64;&#x67;&#109;&#97;&#x69;&#x6c;&#46;&#x63;&#111;&#x6d;">&#98;&#x6c;&#111;&#99;&#107;&#108;&#97;&#x67;&#111;&#111;&#x6e;&#64;&#x67;&#109;&#97;&#x69;&#x6c;&#46;&#x63;&#111;&#x6d;</a></p>
        <p>LinkedIn - <a href="https://www.linkedin.com/in/scott-randolph-2a4948236/">https://www.linkedin.com/in/scott-randolph-2a4948236/</a></p>
        
        <p align="right">(<a href="#top">back to top</a>)</p>

      </Modal.Body>
      <Modal.Footer>
        <Button onClick={props.onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
export default UserManual;