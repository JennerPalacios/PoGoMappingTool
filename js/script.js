var geocoder = null;
var map = null;
var circles = new Array();
var active_circle = null;
var loaded = false;
var click_callback_function = null;
if(typeof currentTool == "undefined")var currentTool = null;

function init() {
	var mapDiv = document.getElementById('map_canvas');
	var data_loaded = false;
	
	if(typeof map_options == 'undefined'){
		map_options = {
			center: new google.maps.LatLng(47.606325,-122.332639),
			zoom: 13,
			drawingControl: true,
			cursor: "crosshair"
		};
	}

	map = new google.maps.Map(mapDiv, setMapOptions(map_options));
	mapPrototypes();
	
	geocoder = new google.maps.Geocoder();
	setMapClickCallbackFunction(map_click_function);
	setMapDoubleClickCallbackFunction(map_double_click_function);
	setMapClickListeners();
	setMapMouseCallbackFunction(map_mousemove_function)
	setMapMouseListeners();
	initiateDrawingsArray();
	
	loaded=true;
	startDM();
	if(currentTool == "polygon" && !data_loaded)setDrawingMode(currentTool);
	if(currentTool == "polyline" && !data_loaded)setDrawingMode(currentTool);
	if(typeof page_url != "undefined")displaySaveLink(page_url,"comeback_link");
}

var map_click_function = function(clickedPoint){
	if(currentTool == "circle")createCircle(clickedPoint,getInputRadius(),{'editable':true,'draggable':true});
	if(currentTool == "polyline" && mouse_draw){
		mouseTraceClick(clickedPoint);
	}
}

var map_double_click_function = function(clickedPoint){
	if(currentTool == "polyline" && mouse_draw){
		addToWorkingLine(clickedPoint);
		saveWorkingLine();
	}
}

var map_mousemove_function = function(clickedPoint){
	drawMouseTraceLine(clickedPoint);
}

function zoomToAddress(addressSelector){
	var address = $(addressSelector).val();
	getLocation(address, function(response, status) {
		if (!response || status != google.maps.GeocoderStatus.OK){
			alert(address + " not found");
		}
		else{
			var l = response[0]; //choose first location
			point = l.geometry.location;
			zoomToLocation(point);
		}
	});

}

function getLocation(address, callback){
	if (geocoder) {
		geocoder.geocode({ 'address': address}, callback);
	}
	else{
		console.error("Geocoder is null.")
	}
}

function showAddress(addressSelector) {
	var radius;
	var address = $(addressSelector).val();
	getLocation(address, function(response, status) {
		if (!response || status != google.maps.GeocoderStatus.OK){
			alert(address + " not found");
		}
		else{
			var l = response[0];//choose first location
			point = l.geometry.location;
			if(currentTool == "circle"){
				radius = getInputRadius();
				if(radius){
					createCircle(point, radius, {'editable':true,'draggable':true});
					zoomToShape(current_shape);
				}
			}
			else{
				var l = response[0];//choose first location
				point = l.geometry.location;
				placeSearchedAddressMark(point);
			}
		}
	});
}

/* */
function createCircleTool(map,center,name){
	if(!radius){
		return false;
	}

	var distanceWidget = new DistanceWidget(map,center,name,arguments[3]);

	google.maps.event.addListener(distanceWidget, 'distance_changed', function() {
	  displayInfo(distanceWidget);
	  setInputRadius(distanceWidget)
	});

	google.maps.event.addListener(distanceWidget, 'position_changed', function() {
	  displayInfo(distanceWidget);
	});
	
	circles.push(distanceWidget); console.info(distanceWidget);

	if(active_circle)active_circle.set("active",false);

	active_circle = distanceWidget;
	saveLink();
	if(loaded && circles.length==1)zoomToAllCircles();
}

/* */

function createInitialCircles(map, circles){
	len = circles.length;
	for(i=0;i<len;i++){
		circle = circles[i];
		point = new google.maps.LatLng(circle[1], circle[2]);
		createCircleTool(map,point,"",circle[0]);
		modifyActiveCircle(circle[0],circle[3],circle[4],circle[5])
	}
	loaded = true;
	zoomToAllCircles();
}





var lastClickTime;
var clckTimeOut;
var addressMarker;


function validHexColor(color){
	return  /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(color);
}
function setMapOptions(options,update){
	if(typeof update == "undefined")update = false;
	if(typeof options == "undefined" || !options)options = new Array();
	if(typeof options['center'] == "undefined" || update)options['center']  = new google.maps.LatLng(40, -84);
	if(typeof options['zoom'] == "undefined")options['zoom'] = 1;
	if(typeof options['mapTypeId'] == "undefined")options['mapTypeId'] = google.maps.MapTypeId.ROADMAP;
	if(typeof options['tilt'] == "undefined" || update)options['tilt'] = 0;
	return options
}
function mapPrototypes(){
	//define get bounds function in initialize so we can add google maps dynamically
	if (!google.maps.Polygon.prototype.getBounds)
	google.maps.Polygon.prototype.getBounds = function() {
	  var path = this.getPath();
	  var bounds = new google.maps.LatLngBounds();
	  for (var i = 0; i < path.getLength(); i++) {
		bounds.extend(path.getAt(i));
	  }
	  return bounds;
	}
	if (!google.maps.Polyline.prototype.getBounds)
	google.maps.Polyline.prototype.getBounds = function() {
	  var path = this.getPath();
	  var bounds = new google.maps.LatLngBounds();
	  for (var i = 0; i < path.getLength(); i++) {
		bounds.extend(path.getAt(i));
	  }
	  return bounds;
	}
}

function setMapClickCallbackFunction(new_func){
	map_click_callback_function = new_func;
}

function setMapDoubleClickCallbackFunction(new_func){
	map_double_click_callback_function = new_func;
}

function setMapClickListeners(){
	google.maps.event.addListener(map, 'click', function(event) {
		mapClick(event.latLng);
	});
	google.maps.event.addListener(map, 'dblclick', function(event) {
		mapClick(event.latLng);
		if(map_double_click_callback_function)map_double_click_callback_function(event.latLng);
	});
}

function setMapMouseCallbackFunction(new_func){
	map_mousemove_callback_function = new_func;
}

function setMapMouseListeners(){
	google.maps.event.addListener(map, 'mousemove', function(event) {
		if(typeof map_mousemove_callback_function == "function")map_mousemove_callback_function(event.latLng);
	});
}

function mapClick(clickedPoint)
{
	//catches the second click from the map listener when the shape listener fires a click
	var d = new Date();
	var clickTime = d.getTime();
	var clickInterval = clickTime - lastClickTime;
	if(clickInterval<10){
		return 0;
	}
	else lastClickTime=clickTime;

	//stops a single click if there is a double click
	if (clckTimeOut){
		window.clearTimeout(clckTimeOut);
		clckTimeOut = null;
		//doubleclick
	}
	else{
		clckTimeOut = window.setTimeout(function(){singleClick(clickedPoint)},500);
	}
}

function singleClick(clickedPoint){
	window.clearTimeout(clckTimeOut);
	clckTimeOut = null;
	if(typeof map_click_callback_function == "function")map_click_callback_function(clickedPoint);
}