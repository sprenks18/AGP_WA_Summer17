var pompeiiMap;

var SELECTED_COLOR = '#800000';
var DEFAULT_COLOR = '#FEB24C';
var wallBorderColor='black';
var wallFillColor='black';

function initPompeiiMap(moreZoom=false,showHover=true,colorDensity=true,interactive=true,propertyIdToHighlight=0,propertyIdListToHighlight=[],zoomOnOneProperty) {
	// this just sets my access token
	var mapboxAccessToken = 'pk.eyJ1IjoibWFydGluZXphMTgiLCJhIjoiY2lxczduaG5wMDJyc2doamY0NW53M3NnaCJ9.TeA0JhIaoNKHUUJr2HyLHQ';
	var borderColor;
	var southWest = L.latLng(40.746, 14.48),
	northEast = L.latLng(43.754, 15.494),
	bounds = L.latLngBounds(southWest, northEast);
	
	var propertyLayer, pompeiiWallsLayer, pompeiiInsulaLayer;
	
	var currentZoomLevel;
	var showInsulaMarkers;
	
	console.log( propertyIdToHighlight);
	console.log(propertyIdListToHighlight);
	
	var REGIO_VIEW_ZOOM=16;
	// The minimum zoom level to show insula view instead of property
	// view (smaller zoom level means more zoomed out)
	var INSULA_VIEW_ZOOM = 17;
	var INDIVIDUAL_PROPERTY_ZOOM=19;
	
	currentZoomLevel=16;
	/*
	 * if(moreZoom){ currentZoomLevel=17; } else{ currentZoomLevel=16; }
	 */
	
	var totalInsulaGraffitisDict=new Array();
	// The list of active insula markers.
	// Can be iterated through to remove all markers from the map(?)
	var insulaMarkersList=[];
	var regioMarkersList=[];
	
	// I see the clicked areas collection, but what about the rest of the items?
	// Are they just obscurely stored by Leaflet or GeoJSON?
	var clickedAreas = [];
	// A list filled with nested list of the full name, id, and short name of
	// each insula selected.
	var clickedInsula=[];
		
	// Holds the center latitudes and longitudes of all insula on the map.
	var insulaCentersDict=[];
	var insulaGroupIdsList=[];
	var insulaShortNamesDict=[];
	
	// Variables for all things regio:
	var regioCentersDict={};
	var regioNamesList=[];
	var graffitiInEachRegioDict={};
		
	// Shows or hides insula labels depending on zoom levels and if the map is
	// interactive
	function dealWithLabelsAndSelection(){
		if(interactive){
			if(!insulaViewZoomThresholdReached() && !regioViewZoomThresholdReached()){
				updateBorderColors();
			}
			else if(regioViewZoomThresholdReached()){
				removeInsulaLabels();
				displayRegioLabels();
			}
			else if(insulaViewZoomThresholdReached()) {
				removeRegioLabels();
				displayInsulaLabels();
			}
			else {
				displayInsulaLabels();
			}
		}
	}
	
	// Centers the map around a single property
	function showCloseUpView(){
		if(propertyIdToHighlight){
			var newCenterCoordinates=[];
			propertyLayer.eachLayer(function(layer){
				if(layer.feature!=undefined){
					if(layer.feature.properties.Property_Id==propertyIdToHighlight){
						newCenterCoordinates=layer.getBounds().getCenter();
						propertyLayer.setView(newCenterCoordinates,INDIVIDUAL_PROPERTY_ZOOM);
					}
				}	
			});
		}
		else if(propertyIdListToHighlight.length==1){
			var newCenterCoordinates=[];
			var idOfListHighlight=propertyIdListToHighlight[0];
			insulaLayer.eachLayer(function(layer){
				if(layer.feature!=undefined){
					if(layer.feature.properties.insula_id==idOfListHighlight){
						newCenterCoordinates=layer.getBounds().getCenter();
						pompeiiMap.setView(newCenterCoordinates,INDIVIDUAL_PROPERTY_ZOOM);
					}
				}
			});
		}
	}
	
	// Builds the global list of insula ids.
	function makeInsulaIdsListShortNamesList(){
		var currentInsulaId=183;
		pompeiiInsulaLayer.eachLayer(function(layer){
			if(layer.feature!=undefined){
				if(layer.feature.properties.insula_id!=currentInsulaId){
					if(insulaGroupIdsList.indexOf(currentInsulaId)==-1){
						insulaGroupIdsList.push(currentInsulaId);
					}
				}
				currentInsulaId=layer.feature.properties.insula_id;
				insulaShortNamesDict[currentInsulaId]=layer.feature.properties.insula_short_name;	
			}
		});
	}
	
	function makeListOfRegioNames(){
		var someName;
		pompeiiInsulaLayer.eachLayer(function(layer){
			if(layer.feature!=undefined){
				someName=layer.feature.properties.insula_short_name.split(".")[0];
				if(regioNamesList.indexOf(someName)==-1){
					regioNamesList.push(someName);
				}
			}
		});
	}
	
	function makeTotalRegioGraffitiDict(){
		var currentNumberOfGraffiti;
		var currentRegioName;
		var regioNamesSoFar=[];
		pompeiiInsulaLayer.eachLayer(function(layer){
			if(layer.feature!=undefined){
				currentRegioName=layer.feature.properties.insula_short_name.split(".")[0];
				currentNumberOfGraffiti=layer.feature.properties.number_of_graffiti;
				if(regioNamesSoFar.indexOf(currentRegioName)==-1){
					regioNamesSoFar.push(currentRegioName);
					graffitiInEachRegioDict[currentRegioName]=currentNumberOfGraffiti;
				}
				else{
					graffitiInEachRegioDict[currentRegioName]+=currentNumberOfGraffiti;
				}
			}
		});
	}
	
	
	// Builds the dictionary of the graffiti in each insula
	// This works well as graffiti numbers should not change over the session.
	// Modifies the clojure wide variable once and only once at the beginning of
	// the program
	function makeTotalInsulaGraffitiDict(){
		totalInsulaGraffitisDict=new Array();
		pompeiiInsulaLayer.eachLayer(function(layer){
			if(insulaViewZoomThresholdReached() && layer.feature!=undefined){
				graffitiInLayer=layer.feature.properties.number_of_graffiti;
				currentInsulaNumber=layer.feature.properties.insula_id;
				if(totalInsulaGraffitisDict[currentInsulaNumber]!=undefined){
					totalInsulaGraffitisDict[currentInsulaNumber]+=graffitiInLayer;
				}
				else{
					totalInsulaGraffitisDict[currentInsulaNumber]=graffitiInLayer;
				}
			}
		});
	}
	
	// Meant to show the insula short name labels at the given x/y coordinates
	// (given as a normal list in Java array form)
	function showALabelOnMap(xYCoordinates,textToDisplay,textSize="small", markerType){
		var myIcon= L.divIcon({ 
		    // iconSize: new L.Point(0, 0),
			// iconSize:0,
			className: "labelClass",
		    html: textToDisplay
		});
		
		var myMarker;
		myMarker=new L.marker([xYCoordinates[1], xYCoordinates[0]], {icon: myIcon}).addTo(pompeiiMap);
		
		if(markerType=="insula") {
			insulaMarkersList.push(myMarker);
		} else if (markerType=="regio") {
			regioMarkersList.push(myMarker)
		}
	}
	
	// Removes each of the insula labels from the map.
	// Meant to be used for when the user zooms past the zoom threshold.
	// Stopped being used due to recommendations at the demo.
	function removeInsulaLabels(){
		var i=0;
		for(i;i<insulaMarkersList.length;i++){
			pompeiiMap.removeLayer(insulaMarkersList[i]);
		}
	}
	
	function removeRegioLabels(){
		var i=0;
		for(i;i<regioMarkersList.length;i++){
			pompeiiMap.removeLayer(regioMarkersList[i]);
		}
	}
	
	// Shows the short names of each insula in black
	// at the center ccoordinates.
	function displayInsulaLabels(){
		var i;
		var insulaId;
		var insulaCenterCoordinates;
		var shortInsulaName;
		// Alerts are working console.log is not(why?)
		for(i=0;i<insulaGroupIdsList.length;i++){
			insulaId=insulaGroupIdsList[i];
			insulaCenterCoordinates=insulaCentersDict[insulaId];
			shortInsulaName=insulaShortNamesDict[insulaId];
			if(insulaCenterCoordinates!=null){
				showALabelOnMap(insulaCenterCoordinates,shortInsulaName, "small", "insula");
			}
		}
	}
	
	function displayRegioLabels(){
		var i;
		var regioCenterCoordinates;
		var regioName;
		for(i=0;i<regioNamesList.length;i++){ 
			regioName=regioNamesList[i];
			regioCenterCoordinates=regioCentersDict[regioName];
			if(regioCenterCoordinates!=null){
				showALabelOnMap(regioCenterCoordinates,regioName,"large", "regio");
			}
		}
	}
	
	function addMoreLatLng(oldList,newList){
		oldList=[oldList[0]+newList[0],oldList[1]+newList[1]];
		return oldList;
	}
	
	// This way will take more compiler time.
	// Trying to do it inside make center dict was too confusing/complex for me.
	function makeTotalPropsPerRegioDict(totalPropsSoFarDict){
		var regioList=[];
		var currentRegio;
		var currentCount;
		pompeiiInsulaLayer.eachLayer(function(layer){
			if(layer.feature!=undefined){
				currentRegio=layer.feature.properties.insula_short_name.split(".")[0];
				
				if(regioList.indexOf(currentRegio)==-1){
					currentCount=1;
					totalPropsSoFarDict[currentRegio]=currentCount; 
					regioList.push(currentRegio);
				}
				else{
					currentCount=totalPropsSoFarDict[currentRegio];
					totalPropsSoFarDict[currentRegio]=currentCount+1;
				}
			}
		});
		return totalPropsSoFarDict;
	}
	
	// Works like the maker for insula centers dict but for Regio instead.
	// Needed to account for the fact that Regio were not ordered one to the
	// other in database.
	function makeRegioCentersDict(){
		var currentRegioName;
		var latLngList;
		var totalPropsSoFarDict={};
		var regioNamesSoFar=[];
		var currentRegioName;
		totalPropsSoFarDict=makeTotalPropsPerRegioDict(totalPropsSoFarDict);
		pompeiiInsulaLayer.eachLayer(function(layer){
			if(layer.feature!=undefined){
				currentRegioName=layer.feature.properties.insula_short_name.split(".")[0];
				if(regioNamesSoFar.indexOf(currentRegioName)==-1){
					regioNamesSoFar.push(currentRegioName);
					if(layer.feature.geometry.coordinates!=undefined){
						regioCentersDict[currentRegioName]=findCenter(layer.feature.geometry.coordinates[0]);
					}
					else{
						regioCentersDict[currentRegioName]=0;
					}
				}
				else{
					if(layer.feature.geometry.coordinates!=undefined){
						regioCentersDict[currentRegioName]=addMoreLatLng(regioCentersDict[currentRegioName],[findCenter(layer.feature.geometry.coordinates[0])[0],findCenter(layer.feature.geometry.coordinates[0])[1]]);
					}
				}
			}
		});
		for(var key in regioCentersDict){
			var div=[regioCentersDict[key][0]/totalPropsSoFarDict[key],regioCentersDict[key][1]/totalPropsSoFarDict[key]];
			regioCentersDict[key]=div;
		}
	}
	
	// This function gets and returns a "dictionary" of the latitude and
	// longitude of each insula given its id(as index).
	// Used to find where to place the labels of each insula on the map, upon
	// iteration through this list.
	function makeInsulaCentersDict(){
		var currentInsulaNumber;
		// Manually set as the first insula id for pompeii
		var oldInsulaNumber=-1; 
		var xSoFar=0;
		var ySoFar=0;
		var latLngList;
		var currentCoordinatesList;
		var propertiesSoFar=0;
		pompeiiInsulaLayer.eachLayer(function(layer){
			propertiesSoFar+=1;
			if(layer.feature!=undefined && interactive){
				currentInsulaNumber=layer.feature.properties.insula_id;
				currentCoordinatesList=layer.feature.geometry.coordinates;
				if(currentInsulaNumber==oldInsulaNumber){
					currentInsulaNumber=layer.feature.properties.insula_id;
					// If a change in insula number has occurred, find the
					// center of the coordinates and add them to the dictionary
					var i=0;
					// This passes in the coordinates list for just one property
					// in the insula which are then added
					xAndYAddition=findCenter(currentCoordinatesList[0]);
					xSoFar+=xAndYAddition[0];
					ySoFar+=xAndYAddition[1];
				}
				else{
					// Add to dictionary:
					// Both divisions are required
					latLngList=[xSoFar/propertiesSoFar,ySoFar/propertiesSoFar];
					// This treats the currentInsulaNumber as a key to the
					// dictionary
					
					insulaCentersDict[oldInsulaNumber]=latLngList;
					// Reset old variables:
					xSoFar=0;
					ySoFar=0;
					propertiesSoFar=0;
					oldInsulaNumber=currentInsulaNumber;
					// This passes in the coordinates list for just one property
					// in the insula which are then added
					xAndYAddition=findCenter(currentCoordinatesList[0]);
					xSoFar+=xAndYAddition[0];
					ySoFar+=xAndYAddition[1];
				}
			}
		});
	}
	
	// Uses math to directly find and return the latitude and longitude of the
	// center of a list of coordinates.
	// Returns a list of the latitude, x and the longitude, y
	function findCenter(coordinatesList){
		var i=0;
		var x=0;
		var y=0
		var pointsSoFar=0;
		for(i;i<coordinatesList.length;i++){
			x+=coordinatesList[i][0];
			y+=coordinatesList[i][1];
			pointsSoFar+=1;
		}
		return [x/pointsSoFar,y/pointsSoFar];
	}
	
	// Responsible for showing the map view on the insula level.
	function dealWithInsulaLevelPropertyView(){
		if((regioViewZoomThresholdReached() || insulaViewZoomThresholdReached()) && colorDensity) {
			if(propertyLayer._map) {
				propertyLayer.remove(pompeiiMap);
			}
			pompeiiInsulaLayer.addTo(pompeiiMap);
			pompeiiInsulaLayer.eachLayer(function(layer){
				if(regioViewZoomThresholdReached() && layer.feature!=undefined){
					regioName=layer.feature.properties.insula_short_name.split(".")[0];
					numberOfGraffitiInGroup=graffitiInEachRegioDict[regioName];
					// numberOfGraffitiInGroup=layer.feature.properties.number_of_graffiti;
					newFillColor=getFillColor(numberOfGraffitiInGroup);
					layer.setStyle({fillColor:newFillColor});
					layer.setStyle({color: getFillColor(numberOfGraffitiInGroup)});
				} else if(insulaViewZoomThresholdReached() && layer.feature!=undefined && !regioViewZoomThresholdReached()) {
					currentInsulaNumber=layer.feature.properties.insula_short_name;
					// numberOfGraffitiInGroup=totalInsulaGraffitisDict[currentInsulaNumber];
					numberOfGraffitiInGroup=layer.feature.properties.number_of_graffiti;
					newFillColor=getFillColor(numberOfGraffitiInGroup);
					layer.setStyle({fillColor:newFillColor});
					layer.setStyle({color: getFillColor(numberOfGraffitiInGroup)});
				}
			});
		}
		
		// Resets properties when user zooms back in
		if (!insulaViewZoomThresholdReached() && colorDensity){
			if(pompeiiInsulaLayer._map) {
				pompeiiInsulaLayer.remove(pompeiiMap);
			}
			propertyLayer.addTo(pompeiiMap);
			propertyLayer.eachLayer(function(layer){
				if (layer.feature!=undefined) {
					layer.setStyle({color: getBorderColorForCloseZoom(layer.feature)});
					graffitiInLayer=layer.feature.properties.Number_Of_Graffiti;
					layer.setStyle({fillColor: getFillColor(graffitiInLayer)});
					layer.setStyle({color: getFillColor(graffitiInLayer)});
				}
			});
		}
		
		/*
		 * propertyLayer.eachLayer(function(layer){
		 * if(insulaViewZoomThresholdReached() && layer.feature!=undefined &&
		 * !regioViewZoomThresholdReached()){
		 * currentInsulaNumber=layer.feature.properties.insula_id;
		 * numberOfGraffitiInGroup=totalInsulaGraffitisDict[currentInsulaNumber];
		 * newFillColor=getFillColor(numberOfGraffitiInGroup);
		 * layer.setStyle({fillColor:newFillColor}); layer.setStyle({color:
		 * getFillColor(numberOfGraffitiInGroup)}); } else
		 * if(regioViewZoomThresholdReached() && colorDensity &&
		 * layer.feature!=undefined && layer.feature.properties.PRIMARY_DO){
		 * regioName=layer.feature.properties.PRIMARY_DO.split(".")[0];
		 * numberOfGraffitiInGroup=graffitiInEachRegioDict[regioName];
		 * newFillColor=getFillColor(numberOfGraffitiInGroup);
		 * layer.setStyle({fillColor:newFillColor}); layer.setStyle({color:
		 * getFillColor(numberOfGraffitiInGroup)}); } else if(layer.feature &&
		 * !layer.feature.properties.PRIMARY_DO){
		 * layer.setStyle({fillColor:'pink'}); } // Resets properties when user
		 * zooms back in if (!insulaViewZoomThresholdReached() && colorDensity &&
		 * layer.feature!=undefined){ layer.setStyle({color:
		 * getBorderColorForCloseZoom(layer.feature)});
		 * graffitiInLayer=layer.feature.properties.Number_Of_Graffiti;
		 * layer.setStyle({fillColor: getFillColor(graffitiInLayer)});
		 * layer.setStyle({color: getFillColor(graffitiInLayer)}); } else if(
		 * layer.feature && !layer.feature.properties.PRIMARY_DO){
		 * layer.setStyle({fillColor:'pink'}); } });
		 */
	}
	
	function regioViewZoomThresholdReached(){
		currentZoomLevel=pompeiiMap.getZoom();
		return (currentZoomLevel<=REGIO_VIEW_ZOOM && colorDensity);
	}
	
	function insulaViewZoomThresholdReached(){
		currentZoomLevel=pompeiiMap.getZoom();
		return (currentZoomLevel<=INSULA_VIEW_ZOOM && colorDensity);
	}
	
	function isPropertySelected(feature) {
		return feature.properties.clicked == true || feature.properties.Property_Id==propertyIdToHighlight || propertyIdListToHighlight.indexOf(feature.properties.Property_Id)>=0;
	}
	
	function isInsulaSelected(feature) {
		return feature.properties.clicked == true || feature.properties.insula_id==propertyIdToHighlight || propertyIdListToHighlight.indexOf(feature.properties.insula_id)>=0;
	}
	
	function getBorderColorForCloseZoom(feature){
		if (isPropertySelected(feature)) {
			return 'black';
		}
		return 'white';
	}
	
	function updateBorderColors(){
		pompeiiInsulaLayer.eachLayer(function(layer){
			if(layer.feature!=undefined && layer.feature.properties.clicked ){
				borderColor=getBorderColorForCloseZoom(layer.feature);
			}
		});
	}
	
	// Sets the style of the portions of the map. Color is the outside borders.
	// There are different colors for
	// clicked or normal fragments. When clicked, items are stored in a
	// collection. These collections will have the color
	// contained inside of else.
	function propertyStyle(feature) {
		borderColor=getBorderColorForCloseZoom(feature);
		if( isPropertySelected(feature)) {
			fillColor = SELECTED_COLOR;
		}
		else if( colorDensity ) {
			fillColor = getFillColor(feature.properties.Number_Of_Graffiti);
		} else {
			fillColor=getFillColorForFeature(feature);
		}
		return { 
	    	fillColor:fillColor,
	        weight: 1,
	        opacity: 1,
	        color: fillColor,
	        fillOpacity: 0.7,
	    };
	}
	
	function insulaStyle(feature) {
		borderColor=getBorderColorForCloseZoom(feature);
		if( isInsulaSelected(feature) && (feature.properties.insula_short_name == "I.8" || feature.properties.insula_short_name == "VII.12")) {
			fillColor = SELECTED_COLOR;
		}
		else if (colorDensity && regioViewZoomThresholdReached())  {
			regioName=feature.properties.insula_short_name.split(".")[0];
			numberOfGraffitiInGroup=graffitiInEachRegioDict[regioName];
			fillColor = getFillColor(numberOfGraffitiInGroup);
		}
		else if( colorDensity && insulaViewZoomThresholdReached()) {
			fillColor = getFillColor(feature.properties.number_of_graffiti);
		} 
		else {
			fillColor=getFillColorForFeature(feature);
		}
		return { 
	    	fillColor:fillColor,
	        weight: 1,
	        opacity: 1,
	        color: fillColor,
	        fillOpacity: 0.7,
	    };
	}
	
	function wallStyle(feature) {
		return { 
	    		fillColor: wallFillColor,
	        weight: 1,
	        opacity: 1,
	        color: wallBorderColor,
	        fillOpacity: 0.7,
	    };
	}
	
	function getFillColorForFeature(feature){
		// If the property is selected and there is no colorDensity, make the
		// fill color be maroon(dark red).
		if(isInsulaSelected(feature) && (feature.properties.insula_short_name == "I.8" || feature.properties.insula_short_name == "VII.12")){
			return SELECTED_COLOR;
		} 
		// an orangey-yellow
		return DEFAULT_COLOR;
	}
	
	function getFillColor(numberOfGraffiti){
		if(colorDensity){
			return numberOfGraffiti <= 2   ? '#FFEDC0' :
			   numberOfGraffiti <= 5   ? '#FFEDA0' :
			   numberOfGraffiti <= 10  ? '#fed39a' :
			   numberOfGraffiti <= 20  ? '#fec880' :
			   numberOfGraffiti <= 30  ? '#FEB24C' :
			   numberOfGraffiti <= 40  ? '#fe9b1b' :
			   numberOfGraffiti <= 60  ? '#fda668' :
		       numberOfGraffiti <= 80  ? '#FD8D3C' :
			   numberOfGraffiti <= 100 ? '#fd7a1c' :
		       numberOfGraffiti <= 130 ? '#fc6c4f' :
			   numberOfGraffiti <= 160 ? '#FC4E2A' :
			   numberOfGraffiti <= 190 ? '#fb2d04' :
			   numberOfGraffiti <= 210 ? '#ea484b' :
			   numberOfGraffiti <= 240 ? '#E31A1C' :
			   numberOfGraffiti <= 270 ? '#b71518' :
			   numberOfGraffiti <= 300 ? '#cc0029' :
			   numberOfGraffiti <= 330 ? '#b30024' :
			   numberOfGraffiti <= 360 ? '#99001f' :
			   numberOfGraffiti <= 390 ? '#80001a' :
			   numberOfGraffiti <= 420 ? '#660014' :
			   numberOfGraffiti <= 460 ? '#4d000f' :
			   numberOfGraffiti <= 500 ? '#33000a' :
										 '#000000';
		}
		
		// an orangey-yellow
		return DEFAULT_COLOR;
	}
	
	// Sets color for properties which the cursor is moving over.
	function highlightFeature(e) {
		if(interactive){
			var layer = e.target;
			layer.setStyle({
				color:'maroon',
				strokeWidth:"100"
			});
		
			if (!L.Browser.ie && !L.Browser.opera) {
				layer.bringToFront();
			}
			info.update(layer.feature.properties);
		}
	}
	
	// Sets color for properties which the cursor is moving over.
	function highlightInsula(e) {
		if(interactive ){
			if( e.target.feature.properties.insula_short_name == "I.8" || 
					e.target.feature.properties.insula_short_name == "VII.12") {
				var layer = e.target;
				layer.setStyle({
					color:'maroon', fillcolor: 'maroon',
					strokeWidth:"150"
				});

				if (!L.Browser.ie && !L.Browser.opera) {
					layer.bringToFront();
				}
				info.update(layer.feature.properties);
			}
		}
	}
	
	// Sorts items based on whether they have been clicked
	// or not. If they have been and are clicked again, sets to false and vice
	// versa.
	function showDetails(e) {
		if(interactive){
			if(!insulaViewZoomThresholdReached()){
				var layer = e.target;
				if (layer.feature.properties.clicked != null) {
					layer.feature.properties.clicked = !layer.feature.properties.clicked;
				} else {
					layer.feature.properties.clicked = true;
				}
				if (!L.Browser.ie && !L.Browser.opera) {
			        layer.bringToFront();
			    }
				clickedAreas.push(layer);
				info.update(layer.feature.properties);
			}
			else if(! regioViewZoomThresholdReached()){
				checkForInsulaClick(e.target);
			}
		}
	}
	
	// Sorts items based on whether they have been clicked
	// or not. If they have been and are clicked again, sets to false and vice
	// versa.
	// This version is for insula click compatibility only. When we introduce
	// property clicks,
	// it will need redesign.
	function showInsulaDetails(e) {
		if(interactive){
			var layer = e.target;
			if (layer.feature.properties.clicked != null) {
				layer.feature.properties.clicked = !layer.feature.properties.clicked;
				if(layer.feature.properties.clicked == false) {
					resetHighlight(e);
					var index = clickedAreas.indexOf(layer);
					if(index > -1) {
						clickedAreas.splice(index, 1);
					}
				} else {
					e.target.setStyle({fillColor:SELECTED_COLOR});
					clickedAreas.push(layer);
				}
			} else {
				layer.feature.properties.clicked = true;
				e.target.setStyle({fillColor:SELECTED_COLOR});
				clickedAreas.push(layer);
			}
			if (!L.Browser.ie && !L.Browser.opera) {
		        layer.bringToFront();
		    }
			info.update(layer.feature.properties);
		}
	}
	
	// Returns a new array with the contents of the previous index absent
	// We must search for a string in the array because, again, indexOf does not
	// work for nested lists.
	function removeStringedListFromArray(someArray,stringPortion){
		var newArray=[];
		var i;
		for(i=0;i<someArray.length;i++){
			if(""+someArray[i]!=stringPortion){
				newArray.push(someArray[i]);
			}
		}
		return newArray;
	}
	
	// On click, sees if a new insula id # has been selected. If so, adds it to
	// the list of selected insula.
	function checkForInsulaClick(clickedProperty){
		// Clicked property is a layer
		// layer.feature.properties.insula_id
		
		// indexOf does not work for nested lists. Thus, we have no choice but
		// to use it with strings.
		var clickedInsulaAsString=""+clickedInsula;
		var clickedInsulaFullName=clickedProperty.feature.properties.insula_full_name;
		var clickedInsulaId=clickedProperty.feature.properties.insula_id;
		var clickedInsulaShortName=clickedProperty.feature.properties.insula_short_name;
		var targetInsulaString=""+[clickedInsulaFullName,clickedInsulaId,clickedInsulaShortName];
		var indexOfInsulaName=clickedInsulaAsString.indexOf(targetInsulaString);
		// Only adds the new id if it is already in the list
		
		if(indexOfInsulaName==-1){
			clickedInsula.push([clickedInsulaFullName,clickedInsulaId,clickedInsulaShortName]);
		}
		// Otherwise, removed the insula id from the list to deselect it
		else{
			clickedInsula=removeStringedListFromArray(clickedInsula,targetInsulaString);
		}
	}
	
	// Used on click for insula level view in place of display selected regions
	// In charge of the right information only, does not impact the actual map
	function displayHighlightedInsula(){
		var html = "<strong>Selected Insula:</strong><ul>";
		var numberOfInsulaSelected=clickedInsula.length;
		for (var i=0; i<numberOfInsulaSelected; i++) {
			html += "<li>"+clickedInsula[i][0] + ", " +
					"<p>"+totalInsulaGraffitisDict[clickedInsula[i][1]]+" graffiti</p>"+ "</li>"
		}
		html += "</ul>";
		// Checks to avoid error for element is null.
		var elem = document.getElementById("selectionDiv");
		if(typeof elem !== 'undefined' && elem !== null) {
			document.getElementById("selectionDiv").innerHTML = html;
		}
	}
	
	function displayHighlightedRegio(){
		/*
		 * var html = "<table><tr><th>Selected Regio:</th></tr>"; var
		 * numberOfInsulaSelected=clickedInsula.length; for (var i=0; i<numberOfInsulaSelected;
		 * i++) { html += "<tr><td><li>"+clickedInsula[i][0] + ", " + "<p>"+totalInsulaGraffitisDict[clickedInsula[i][1]]+"
		 * graffiti</p>"+ "</li></td></tr>" } html += "</table"; //Checks
		 * to avoid error for element is null. var elem =
		 * document.getElementById("selectionDiv"); if(typeof elem !==
		 * 'undefined' && elem !== null) {
		 * document.getElementById("selectionDiv").innerHTML = html; }
		 */
	}
	
	
	// Used to reset the color, size, etc of items to their default state (ie.
	// after being clicked twice)
	function resetHighlight(e) {
		if(interactive && !insulaViewZoomThresholdReached()){
			propertyLayer.resetStyle(e.target);
			info.update();
		} else if (interactive && insulaViewZoomThresholdReached()) {
			pompeiiInsulaLayer.resetStyle(e.target);
			info.update();
		}
	}

	// Calls the functions on their corresponding events for EVERY feature
	function onEachPropertyFeature(feature, layer) {
	    layer.on({
	        mouseover: highlightFeature,
	        mouseout: resetHighlight,
	        click: showDetails,
	    });
	}
	
	function onEachInsulaFeature(feature, layer) {
	    layer.on({
	        mouseover: highlightInsula,
	        mouseout: resetHighlight,
	        click: showInsulaDetails,
	    });
	}
	
	function onEachWallFeature(feature, layer) {
	    layer.on({
	    });
	}
	
	var info = L.control();
	info.onAdd = function(map) {
		// create a div with a class "info"
		this._div = L.DomUtil.create('div', 'info'); 
	    this.update();
	    return this._div;
	};
	
	// method that we will use to update the control based on feature properties
	// passed
	function updateHoverText(){
		// TODO: Only do for the properties?
		info.update = function (props) {
			if(showHover){
				if(!props) 
					this._div.innerHTML = 'Hover over property to see name';
				else if(props.insula_full_name)
					this._div.innerHTML = props.insula_full_name;
			}
		};
		info.addTo(pompeiiMap);
	}
	
	// Marks all properties inside of selected insula as selected by
	// adding them to the clickedInsula list.
	function selectPropertiesInAllSelectedInsula(uniqueClicked){
		if(interactive){
			var i=0;
			var currentInsulaId;
			var currentInsula;
			var listOfSelectedInsulaIds=[];
			for(i;i<clickedInsula.length;i++){
				currentInsula=clickedInsula[i];
				currentInsulaId=currentInsula[1];
				listOfSelectedInsulaIds.push(currentInsulaId);	
			}
			pompeiiInsulaLayer.eachLayer(function(layer){
				if(layer.feature!=undefined){
					if(listOfSelectedInsulaIds.indexOf(layer.feature.properties.insula_id)!=-1 && !uniqueClicked.includes(layer)){
						uniqueClicked.push(layer);
						layer.feature.properties.clicked=true;
					}
				}
			});
		}
		return uniqueClicked;
	}
	
	// Used to acquire all of the items clicked for search(red button "Click
	// here to search).
	// Does this by iterating through the list of clicked items and adding them
	// to uniqueClicked, then returning uniqueClicked.
	function getUniqueClicked() {
		var uniqueClicked = [];
		var listInSelectedInsula;
		var length = clickedAreas.length;
		for (var i = 0; i < length; i++) {
			var insula = clickedAreas[i];
			if (!uniqueClicked.includes(insula)) {
				uniqueClicked.push(insula)
			}
		}
		return uniqueClicked;
	}
	
	/*
	 * // Collects the ids of the clicked item objects (the property id).
	 * function collectClicked() { var propIdsOfClicked = [];
	 * 
	 * var selectedProps = getUniqueClicked(); var length =
	 * selectedProps.length; for (var i=0; i<length; i++) { var property =
	 * selectedProps[i]; var propertyID =
	 * property.feature.properties.Property_Id;
	 * propIdsOfClicked.push(propertyID); } return propIdsOfClicked; }
	 */
	
	function collectClicked() {
		var insulaIdsOfClicked = [];
		
		var selectedInsulae = getUniqueClicked();
		var length = selectedInsulae.length;
		for (var i=0; i<length; i++) {
			var property = selectedInsulae[i];
			var insulaID = property.feature.properties.insula_id;
			if(property.feature.properties.insula_short_name == "I.8" || 
					property.feature.properties.insula_short_name == "VII.12") {
				insulaIdsOfClicked.push(insulaID);
			}
		}
		return insulaIdsOfClicked;
	}
	
	// creates url to call for searching when the user clicks the search button.
	function searchForProperties() {
		var highlighted = collectClicked();
		var argString = "";
		if (highlighted.length > 0){
			for (var i = 0; i < highlighted.length; i++) {
				argString = argString + "insula=" + highlighted[i] + "&";
			}
			window.location = "results?" + argString;
			return true;
		}
		else {
			document.getElementById("hidden_p").style.visibility = "visible";
		}
	}
	
	/*
	 * // Displays the Selected Properties and their corresponding information
	 * in // an HTML table formatted. // Achieved by mixing html and javascript,
	 * accessing text properties of the // regions(items). function
	 * displayHighlightedRegions() { // when you click on the map, it updates
	 * the selection info if(!insulaViewZoomThresholdReached()){ var
	 * clickedAreasTable = getUniqueClicked(); var html = "<strong>Selected
	 * Properties:</strong><ul>"; var length = clickedAreasTable.length; for
	 * (var i=0; i<length; i++) { var property = clickedAreasTable[i]; if
	 * (property.feature.properties.clicked &&
	 * property.feature.properties.PinP_Addre) { html += "<li>"
	 * +property.feature.properties.Property_Name + ", " +
	 * property.feature.properties.PinP_Addre + "<p>"+property.feature.properties.Number_Of_Graffiti+"
	 * graffiti</p>"+ "</li>"; } } html += "</ul>"; // Checks to avoid
	 * error for element is null. var elem =
	 * document.getElementById("selectionDiv"); if(typeof elem !== 'undefined' &&
	 * elem !== null) { document.getElementById("selectionDiv").innerHTML =
	 * html; } } else if( !regioViewZoomThresholdReached()){
	 * displayHighlightedInsula(); var clickedAreasTable = getUniqueClicked(); } }
	 */
	
	function displayHighlightedRegions() {
		// when you click on the map, it updates the selection info
		var clickedAreasTable = getUniqueClicked();
		var html = "<strong>Selected Insulae:</strong><ul>";
		var length = clickedAreasTable.length;
		for (var i=0; i<length; i++) {
			var property = clickedAreasTable[i];
			if (property.feature.properties.clicked && (property.feature.properties.insula_short_name == "I.8" || 
										property.feature.properties.insula_short_name == "VII.12")) {
				html += "<li>" +property.feature.properties.insula_full_name + ",<p>"+property.feature.properties.number_of_graffiti+" graffiti</p>"+ "</li>";
			}
		}
		html += "</ul>";
		// Checks to avoid error for element is null.
		var elem = document.getElementById("selectionDiv");
		  	if(typeof elem !== 'undefined' && elem !== null) {
		  		document.getElementById("selectionDiv").innerHTML = html;
		  	}
	}	
	
	pompeiiMap = new L.map('pompeiimap', {
		center: [40.750950, 14.488600],
		zoom: currentZoomLevel,
		minZoom: REGIO_VIEW_ZOOM,
		maxZoom: INSULA_VIEW_ZOOM, /*
									 * can change this when we want the property
									 * view as well
									 */
		maxBounds: bounds
	});
	
	propertyLayer = L.geoJson(pompeiiPropertyData, { style: propertyStyle, onEachFeature: onEachPropertyFeature });
	// propertyLayer.addTo(pompeiiMap);
	
	pompeiiWallsLayer = L.geoJson(pompeiiWallsData, {style: wallStyle, onEachFeature: onEachWallFeature});
	pompeiiWallsLayer.addTo(pompeiiMap);
	
	// Syncs with mapbox
	// var mapboxUrl =
	// 'https://api.mapbox.com/styles/v1/martineza18/ciqsdxkit0000cpmd73lxz8o5/tiles/256/{z}/{x}/{y}?access_token='
	// + mapboxAccessToken;
	// var grayscale = new L.tileLayer(mapboxUrl, {id: 'mapbox.light',
	// attribution: 'Mapbox Light'});
	// pompeiiMap.addLayer(grayscale);
	
	pompeiiInsulaLayer = L.geoJson(pompeiiInsulaData, { style: insulaStyle, onEachFeature: onEachInsulaFeature });
	pompeiiInsulaLayer.addTo(pompeiiMap);
	
	var insulaLevelLegend = L.control({position: 'bottomright'});

	insulaLevelLegend.onAdd = function (map) {

		var div = L.DomUtil.create('div', 'info legend'),
			/*
			 * This was the original ranges list. Simply add or remove the numbers to manipulate the ranges on the legend. -Hammad
			 * grades = [0, 5, 10, 20, 30, 40, 60, 80, 100, 130, 160, 190, 210, 240, 270, 300, 330, 360, 390, 420, 460, 500],
			*/
			grades = [0, 5, 10, 20, 30, 40, 60, 80, 100, 130, 160],
			labels = [],
			from, to;
		
		labels.push(
				'<i style="background:' + getFillColor(0) + '"></i> ' + 0);
		
		for (var i = 0; i < grades.length; i++) {
			from = grades[i];
			to = grades[i + 1];

			labels.push(
				'<i style="background:' + getFillColor(from + 1) + '"></i> ' +
				(from+1) + (to ? '&ndash;' + to : '+'));
		}

		div.innerHTML = labels.join('<br>');
		return div;
	};

		
	if( interactive && colorDensity){ 
		// Insula Functions:
		makeInsulaCentersDict(); 
		makeTotalInsulaGraffitiDict();
		makeInsulaIdsListShortNamesList(); 

		// Regio Functions:
		makeRegioCentersDict(); 
		makeTotalRegioGraffitiDict();
		makeListOfRegioNames();

		dealWithLabelsAndSelection(); 
		insulaLevelLegend.addTo(pompeiiMap);
		pompeiiMap.addControl(new L.Control.Compass({autoActive: true, position: "bottomleft"})); 
	}
	 
	// A listener for zoom events.
	pompeiiMap.on('zoomend', function(e) {
		dealWithInsulaLevelPropertyView();
		dealWithLabelsAndSelection();
	});
	dealWithInsulaLevelPropertyView();
	
	updateHoverText();
	
	showCloseUpView();
	
	// Handles the events
	var el = document.getElementById("search");
	if(el!=null){
		el.addEventListener("click", searchForProperties, false);
	}
	
	var el2 = document.getElementById("pompeiimap");
	if(el2!=null){
		el2.addEventListener("click", displayHighlightedRegions, false);
	}
	
}