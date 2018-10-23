//global variables
var drawings = null;
var current_shape = null;
var drawingManager = null;
var temp_shape = null;

var mouse_draw = false;
var drag_line_start_point = null;
var mouseTraceLine = null;
var mouseMoveTraceHandler = null;
var workingLine = null;




function startDM(options){
	drawingSettings = setDefaultDrawingOptions(options);
	drawingManager = new google.maps.drawing.DrawingManager({
		drawingMode: null,
		drawingControl: true,
		drawingControlOptions: {
			position: google.maps.ControlPosition.TOP_CENTER,
			drawingModes: [
				google.maps.drawing.OverlayType.POLYGON,
				google.maps.drawing.OverlayType.POLYLINE
			]
		},
		polygonOptions: drawingSettings,
		polylineOptions: drawingSettings
	});
	drawingManager.setMap(map);
	google.maps.event.addListener(drawingManager, 'overlaycomplete', function(event) {
		changeCurrentDrawing(null);
		if(event.type == google.maps.drawing.OverlayType.POLYGON || event.type == google.maps.drawing.OverlayType.POLYLINE) {
			if(event.type == google.maps.drawing.OverlayType.POLYGON)event.overlay.drawing_type = "polygon";
			if(event.type == google.maps.drawing.OverlayType.POLYLINE)event.overlay.drawing_type = "polyline";
			addPolygonEvents(event.overlay);
			if(event.type == google.maps.drawing.OverlayType.POLYGON)drawings['polygons'].push(event.overlay);
			if(event.type == google.maps.drawing.OverlayType.POLYLINE)drawings['polylines'].push(event.overlay);
			setDrawingMode(null);
			displayDrawingInfo(event.overlay);
		}
		else if(event.type == google.maps.drawing.OverlayType.RECTANGLE) {
			drawingManager.setDrawingMode(null);
		}
	});
	createDrawingSettingEvents();
}

function addPolygonEvents(polygon){
	google.maps.event.addListener(polygon.getPath(), 'set_at', function() {
	  displayDrawingInfo(polygon);
	});
	google.maps.event.addListener(polygon.getPath(), 'insert_at', function() {
	  displayDrawingInfo(polygon);
	});
	google.maps.event.addListener(polygon.getPath(), 'remove_at', function() {
	  displayDrawingInfo(polygon);
	});
	google.maps.event.addListener(polygon, 'click', function () {
		changeCurrentDrawing(polygon);
		displayDrawingInfo(polygon);
	});
}

function createDrawingSettingEvents(){
	getFillControl().change( function () {
		updateDMSettings()
	});
	getStrokeControl().change( function () {
		updateDMSettings()
	});
	$("#only-show-border-map-control").change( function () {
		updateDMSettings()
	});
}

function setDrawingMode(mode){
	if(typeof mode == "undefined" || !mode)drawingManager.setDrawingMode(null);
	else{
		switch (mode) {
		  case "polygon":
		  case google.maps.drawing.OverlayType.POLYGON:
			drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
			break;
		  case "polyline":
		  case google.maps.drawing.OverlayType.POLYLINE:
		  	saveWorkingLine();
		  	mouse_draw = true;
		  	setMapDrawingModeOptions("on");
		  	changeCurrentDrawing(null);
			break;
		  default:
			drawingManager.setDrawingMode(null);
			break;
		}
	}
}

function updateDMSettings(options){
	drawingSettings = setDefaultDrawingOptions(options, true);
	drawingManager.setOptions({
		circleOptions: drawingSettings,
		polygonOptions: drawingSettings,
		polylineOptions: drawingSettings
	});
}

function isCurrentlyDrawing(){
	if(typeof drawingManager != "undefined" && drawingManager){
		if(drawingManager.getDrawingMode()!=null)return true;
	}
	return false;
}


function initiateDrawingsArray(){
	drawings = {};
	drawings['circles'] = new Array();
	drawings['polygons'] = new Array();
	drawings['polylines'] = new Array();
	drawings['markers'] = new Array();
}

function clearDrawings(){
	if(typeof drawings != "undefined" && drawings){
		for (var key in drawings){
			for(var i=0;i<drawings[key].length;i++){
				drawings[key][i].setMap(null);
				drawings[key][i] = null;
			}
		}
	}
	initiateDrawingsArray();
}

function changeCurrentDrawing(new_shape){
	if(current_shape)current_shape.setOptions({editable:false,draggable:false});
	if(typeof new_shape != "undefined" && new_shape){
		current_shape = new_shape;
		new_shape.setOptions({editable:true,draggable:true});
	}
}

function setDefaultDrawingOptions(options,update){
	if(typeof update == "undefined")update = false;
	if(typeof options == "undefined" || !options)options = new Array();
	if(typeof options['strokeColor'] == "undefined" || update)options['strokeColor']  = getStrokeColor();
	if(typeof options['strokeOpacity'] == "undefined")options['strokeOpacity'] = 0.8;
	if(typeof options['strokeWeight'] == "undefined")options['strokeWeight'] = 1;
	if(typeof options['fillColor'] == "undefined" || update)options['fillColor'] = getFillColor();
	if(typeof options['fillOpacity'] == "undefined" || update)options['fillOpacity'] = getFillOpacity();
	if(typeof options['geodesic'] == "undefined" || update)options['geodesic'] = false;
	if(typeof options['editable'] == "undefined")options['editable'] = false;
	if(typeof options['draggable'] == "undefined")options['draggable'] = false;
	
	return options;
}

function createCircle(latLng,radius,options){
	options = setDefaultDrawingOptions(options);
	options['map']=map;
	options['center']=latLng;
	options['radius']=radius;

	var circle = new google.maps.Circle(options);
	circle.drawing_type = "circle";
	if(options['editable'])changeCurrentDrawing(circle);
	else changeCurrentDrawing(null);
	google.maps.event.addListener(circle, 'center_changed', function () {
		displayDrawingInfo(circle);
	});
	google.maps.event.addListener(circle, 'radius_changed', function () {
		displayDrawingInfo(circle);
	});
	google.maps.event.addListener(circle, 'click', function () {
		changeCurrentDrawing(circle);
		displayDrawingInfo(circle);
	});
	drawings['circles'].push(circle);
	displayDrawingInfo(circle);
}

function createSpawn(latLng,radius,options){
	options = setDefaultDrawingOptions(options);
	options['map']=map;
	options['center']=latLng;
	options['radius']=radius;
	var circle = new google.maps.Circle(options);
}

function createMarker(latLng,name,icon){
	options = [];
	options['map']=map;
	options['position']=latLng;
	options['name']=name;
	options['icon']=icon;
	options['draggable']=false;
	
	var marker = new google.maps.Marker(options);
	marker.drawing_type = "marker";
	if(options['draggable'])changeCurrentDrawing(marker);
	else changeCurrentDrawing(null);
	google.maps.event.addListener(marker, 'center_changed', function () {
		displayDrawingInfo(marker);
	});
	google.maps.event.addListener(marker, 'radius_changed', function () {
		displayDrawingInfo(marker);
	});
	google.maps.event.addListener(marker, 'click', function () {
		changeCurrentDrawing(marker);
		displayDrawingInfo(marker);
	});
	drawings['markers'].push(marker);
	displayDrawingInfo(marker);
}

function createPolygon(points,options,type){
	if(typeof type == "undefined")type = "polygon";
	if(type != "polygon" &&  type != "polyline")return false
	options = setDefaultDrawingOptions(options);
	options['map']=map;
	var path = new Array();
	for(i=0;i<points.length;i++){
		path.push({lat:points[i][0], lng:points[i][1]});
	}
	options['path']=path;
	if(type == "polygon")var polygon = new google.maps.Polygon(options);
	if(type == "polyline")var polygon = new google.maps.Polyline(options);
	polygon.drawing_type = type;
	addPolygonEvents(polygon);
	if(type == "polygon")drawings['polygons'].push(polygon);
	if(type == "polyline")drawings['polylines'].push(polygon);
	return true;
}

function removeActiveDrawing(){
	changeCurrentDrawing(null)
	removeDrawing(current_shape);
}

function removeDrawing(shape){
	if(!shape)return;
	shape.set("map",null);
	var drawing_type = getDrawingTypeOfShape(shape);
	if(typeof shape != "undefined" && shape){
		var shapes = null;
		switch(drawing_type){
			case "circle":
			case "polygon":
			case "polyline":
				shapes = drawings[drawing_type + 's'];
				break;
			default:
				console.log("Drawing type '" + drawing_type +"' not recognized.");
		}
		if(shapes){
			len = shapes.length;
			for(i=0;i<len;i++){
				if(shape==shapes[i]){
					shapes.splice(i, 1);
					shape=null;
					displayDrawingInfo(shape);
				}
			}
		}
	}
}

function updateActiveDrawingOptions(){
	console.log('update');
	updateDrawingOptions(current_shape,{editable:true,draggable:true});
	displayDrawingInfo(current_shape);
}

function updateDrawingOptions(shape,options){
	console.log(shape);
	if(!shape)return;
	drawing_type = getDrawingTypeOfShape(shape);
	var newOptions = setDefaultDrawingOptions(options,true);
	if(drawing_type == "circle"){
		if(typeof getInputRadius == "function"){
			radius = getInputRadius();
			if(radius && $.isNumeric(radius) && radius>0)newOptions['radius']=radius;
		}
	}
	shape.setOptions(newOptions);
}

function displayDrawingInfo(shape,element_id){
	if(typeof element_id == "undefined")element_id = 'info';
	var info = document.getElementById(element_id);
	if(shape && shape.map){
		var drawing_type = getDrawingTypeOfShape(shape);
		if(drawing_type == "circle" || typeof shape.radius != "undefined"){
			if(typeof setInputRadius == "function")setInputRadius(shape);
			info.innerHTML = '<i>Loc: <input type="text" onClick="this.select()" value="'+shape.getCenter().lat().toFixed(6)+","+shape.getCenter().lng().toFixed(6)+'" /> <small>with ' + shape.radius.toFixed(2) + "m radius</small></i>";
		}
		if(drawing_type == "marker"){
			info.innerHTML = '<i>Selected Location: <input type="text" onClick="this.select()" value="'+shape.getPosition().lat().toFixed(6)+','+shape.getPosition().lng().toFixed(6)+'" /></i>';
		}
		if(drawing_type == "polygon"){
			var fenceArea=getAreaData(shape).split(" "), fensePerimeter=getPerimeterData(shape).split(" ");
			for(var coord=0;coord<shape.latLngs.b[0].b.length;coord++){
				console.info(shape.latLngs.b[0].b[coord].lat()+","+shape.latLngs.b[0].b[coord].lng());
			}
			info.innerHTML = fenceArea[0]+": <i>"+fenceArea[1]+"</i>m | "+fensePerimeter[0]+": <i>"+fensePerimeter[1]+"</i>m";
		}
		if(drawing_type == "polyline"){
			var info_text = getPerimeterData(shape);
			info.innerHTML = info_text;
		}
	}
	else info.innerHTML = '';
	if(typeof display_save_link == "undefined" || display_save_link){
		if(typeof page_url != "undefined"){
			displaySaveLink(page_url,"comeback_link");
		}
	}
}

function getStrokeControl(){
	var colorPicker =  $("#border-map-control");
	if(colorPicker.length === 0){
		colorPicker = $("#line-color-map-control");
	}
	return colorPicker;
}

function getFillControl(){
	var colorPicker =  $("#circle-map-control");
	if(colorPicker.length === 0){
		colorPicker = $("#area-map-control");
	}
	return colorPicker;
}

function getStrokeColor(){
	var colorPicker = getStrokeControl();
	var color = "#" + colorPicker.val();
	if(validHexColor(color))return color;
	else return "#000000";
}
function getFillColor(){
	var colorPicker = getFillControl();
	var color = "#" + colorPicker.val();
	if(validHexColor(color))return color;
	else return "#000000";
}
function getFillOpacity(){
	if($("#only-show-border-map-control").is(":checked"))return 0.0
	else return 0.1;
}

//using the form return the radius selected in meters
function getInputRadius(){
	var radius = parseFloat($("input#radius-map-control").val());
	if(radius.length<1 || !$.isNumeric(radius)){
		alert("Enter a numeric radius");
		return false;
	}

	var radius_unit = $("select#radius-unit-map-control").val();
	switch(radius_unit){
		case "Meters": return radius;
		case "KM": return radius*1000;
		case "Feet": return radius*0.3048;
		case "Miles": return radius*1609.34;
		default :
		{
			alert("Invalid radius unit");
			return false;
		}
	}
}

function setInputRadius(circle){
	var meters, input_value, radius_unit;

	if(typeof circle != "undefined"){
		meters = circle.radius;
		input_value = 1000;
		radius_unit = $("select#radius-unit-map-control").val();

		switch(radius_unit){
			case "Meters":  { input_value = meters;				break;}
			case "KM": { input_value = meters/1000;			break;}
			case "Feet": { input_value = meters*3.28084;		break;}
			case "Miles": { input_value = meters*0.000621371;  break;}
			default :
			{
				alert("Invalid radius unit");
			}
		}
		//$("input#radius-map-control").val(input_value.toFixed(2));
	}
}

function displaySaveLink(url, display_field){
	circle_define_string = "";
	if(typeof url == "undefined")return false;
	if(typeof display_field == "undefined")display_field = comeback_link;
	var url_arguments = "";
	if(loaded && typeof drawings != "undefined"){
		if(typeof drawings["circles"] != "undefined" && drawings["circles"].length > 0){
			var circles = drawings["circles"];
			len = circles.length;
			if(len>0){
				data = new Array();
				for(i=0;i<len;i++){
					var c = circles[i];
					data[i] = new Array();
					data[i].push(parseFloat(c.radius.toFixed(2)));
					data[i].push(parseFloat(c.getCenter().lat().toFixed(7)));
					data[i].push(parseFloat(c.getCenter().lng().toFixed(7)));
					data[i].push(c.fillColor);
					data[i].push(c.strokeColor);
					data[i].push(c.fillOpacity);
				}
				circle_define_string = encodeURIComponent(JSON.stringify(data));
				url_arguments += "circles=" + circle_define_string;
			}
		}
		if(typeof drawings["polygons"] != "undefined" && drawings["polygons"].length > 0){
			var polygons = drawings["polygons"];
			len = polygons.length;
			if(len>0){
				data = new Array();
				for(i=0;i<len;i++){
					var p = polygons[i];
					data[i] = new Array();
					data[i].push(getPathArray(p));
					data[i].push(p.fillColor);
					data[i].push(p.strokeColor);
					data[i].push(p.fillOpacity);
				}
				polygon_define_string = encodeURIComponent(JSON.stringify(data));
				if(url_arguments.length)url_arguments+="&";
				url_arguments += "polygons=" + polygon_define_string;
			}
		}
		if(typeof drawings["polylines"] != "undefined" && drawings["polylines"].length > 0){
			var polygons = drawings["polylines"];
			len = polygons.length;
			if(len>0){
				data = new Array();
				for(i=0;i<len;i++){
					var p = polygons[i];
					data[i] = new Array();
					data[i].push(getPathArray(p));
					data[i].push(p.strokeColor);
				}
				polyline_define_string = encodeURIComponent(JSON.stringify(data));
				if(url_arguments.length)url_arguments+="&";
				url_arguments += "polylines=" + polyline_define_string;
			}
		}
		url = url + "?" + url_arguments;
		$("#"+display_field).html(url);
	}
}

function loadShapes(type,data_array){
	var i=0;
	if(typeof data_array == undefined || !data_array)data_array = new Array();
	
	
	if(type==="circles"){
		for(i=0;i<data_array.length;i++){
			circle = data_array[i];
			createCircle(new google.maps.LatLng(circle[1], circle[2]),circle[0],{'fillColor':circle[3],'strokeColor':circle[4],fillOpacity:circle[5]});
		}
		i=0
	}
	if(type==="spawnpoints"){
		for(i=0;i<data_array.length;i++){
			circle = data_array[i];
			createSpawn(new google.maps.LatLng(circle[1], circle[2]),5,{'fillColor':'#660000','strokeColor':'#330000',fillOpacity:circle[5]});
		}
		i=0
	}
	
	if(type==="polygons"){
		if(data_array!=undefined){
			for(i=0;i<data_array.length;i++){
				polygon = data_array[i];
				createPolygon(polygon[0],{'fillColor':polygon[1],'strokeColor':polygon[2],'fillOpacity':polygon[3]},"polygon");
			}
		}
		i=0
	}
	if(type==="polylines"){
		if(data_array!=undefined){
			for(i=0;i<data_array.length;i++){
				polygon = data_array[i];
				createPolygon(polygon[0],{'strokeColor':polygon[1]},"polyline");
			}
		}
		i=0
	}
	if(type==="gyms"){
		if(data_array!=undefined){
			for(i=0;i<data_array.length;i++){
				marker = data_array[i];
				createMarker(new google.maps.LatLng(marker[1], marker[2]),i,marker[6]);
			}
		}
	}
	if(type==="pokestops"){
		if(data_array!=undefined){
			for(i=0;i<data_array.length;i++){
				marker = data_array[i];
				createMarker(new google.maps.LatLng(marker[1], marker[2]),i,marker[6]);
				console.info(marker);
			}
		}
	}
	loaded = true;
	//zoomToAllShapes();
}


function zoomToAllShapes(){
	bounds = new google.maps.LatLngBounds();
	var circles = drawings["circles"];
	len = circles.length;
	if(len>0){
		data = new Array();
		for(i=0;i<len;i++){
			var c = circles[i];
			bounds.union(c.getBounds());
		}
	}
	var polygons = drawings["polygons"];
	len = polygons.length;
	if(len>0){
		data = new Array();
		for(i=0;i<len;i++){
			var c = polygons[i];
			bounds.union(c.getBounds());
		}
	}
	var polygons = drawings["polylines"];
	len = polygons.length;
	if(len>0){
		data = new Array();
		for(i=0;i<len;i++){
			var c = polygons[i];
			bounds.union(c.getBounds());
		}
	}
	map.fitBounds(bounds);
}

function zoomToShape(shape){
	if(shape)map.fitBounds(shape.getBounds());
}

function getPathArray(polygon,return_type){
	if(typeof return_type == "undefined")return_type = "array";
	var drawing_type = getDrawingTypeOfShape(polygon);
	points  = polygon.getPath();
	path = [];
	for(var i=0;i<points.length;i++){
		if(return_type == "object_array")path.push(points.getAt(i));
		if(return_type == "array")path.push(new Array(points.getAt(i).lat(),points.getAt(i).lng()));
	}
	if(drawing_type=="polygon" && points.length>2 && (points.getAt(0).lat() != points.getAt(points.length-1).lat() || points.getAt(0).lng() != points.getAt(points.length-1).lng())){
		if(return_type == "object_array")path.push(points.getAt(0));
		if(return_type == "array")path.push(new Array(points.getAt(0).lat(),points.getAt(0).lng()));
	}
	var cleanPath = jQuery.extend([],path);
	return cleanPath;
}

function getAreaData(shape,return_type){
	if(typeof return_type == "undefined")return_type = "text";
	drawing_type = getDrawingTypeOfShape(shape);
	if(drawing_type == "polygon"){
		var polyPoints  = shape.getPath();
		//area calculation
		var meters = google.maps.geometry.spherical.computeArea(polyPoints);
		var kilometer = meters/1000000;
		var miles = meters * 0.000000386102159;
		var acre = meters * 0.000247105381;
		var feet = meters * 10.7639104;

		if(return_type == "text")info = "Area " + meters.toFixed(0) + " meters<sup>2</sup>, " + feet.toFixed(0) + " feet<sup>2</sup> " + acre.toFixed(2) + " acres " + miles.toFixed(3) + " miles<sup>2</sup> " + kilometer.toFixed(3) + " km<sup>2</sup>";
	}
	return info;
}

function getPerimeterData(shape,return_type){
	if(typeof return_type == "undefined")return_type = "text";
	drawing_type = getDrawingTypeOfShape(shape);
	if(drawing_type == "polygon" || drawing_type == "polyline"){
		var path  = shape.getPath();
		//area calculation
		meters = google.maps.geometry.spherical.computeLength(path);
		if(meters>100)extra_decimal=0;
		if(meters<100)extra_decimal=1;
		if(meters<10)extra_decimal=2;
		feet = meters * 3.28084;
		kilometer = meters/1000;
		miles = meters * 0.000621371192;
		if(drawing_type == "polygon")info = "Perimeter ";
		if(drawing_type == "polyline")info = "Distance ";
		if(return_type == "text")info += meters.toFixed(extra_decimal) + " meters , " + feet.toFixed(extra_decimal) + " feet " + miles.toFixed(3) + " miles " + kilometer.toFixed(3) + " km";
	}
	return info;
}

function getDrawingTypeOfShape(shape){
	var drawing_type = null;
	if(typeof shape.drawing_type != "undefined")drawing_type = shape.drawing_type;
	else if(typeof shape.radius != "undefined")drawing_type = "circle";
	return drawing_type;
}

function clearWorkingLine(){
	if(typeof workingLine != "undefined" && workingLine){
		workingLine.setMap(null);
		workingLine = null;
	}
}

function saveWorkingLine(){
	if(typeof workingLine != "undefined" && workingLine){
		addPolygonEvents(workingLine);
		drawings["polylines"].push(workingLine);
		workingLine = null;
		var polyline = drawings["polylines"][(drawings["polylines"].length-1)];
		addPolygonEvents(polyline);
		changeCurrentDrawing(polyline);
	}
	displayDrawingInfo(workingLine);
	turnOffMouseTrace();
}

function addToWorkingLine(point){
	if(typeof workingLine != "undefined" && workingLine){
		var path = workingLine.getPath();
		path.push(point);
	}
	else if(typeof mouseTraceLine != "undefined" && mouseTraceLine){
		var path = mouseTraceLine.getPath();
		startWorkingLine(path.getAt(0),point);
	}
}

function startWorkingLine(start,end){
	options = setDefaultDrawingOptions();
	options['map']=map;
	options['path'] = new Array({lat:start.lat(), lng:start.lng()},{lat:end.lat(),lng:end.lng()});
	options['clickable'] = false;
	workingLine = new google.maps.Polyline(options);
	workingLine.drawing_type = "polyline"
}

function turnOnMouseTrace(start_point){
	clearMouseTraceLine();
	drag_line_start_point = start_point;
	mouse_draw = true;
	setMapDrawingModeOptions("on");
}

function turnOffMouseTrace(){
	clearMouseTraceLine();
	drag_line_start_point = null;
	mouse_draw = false;
	setMapDrawingModeOptions("off");
	snap_points = null;
}

function setMapDrawingModeOptions(mode){
	if(mode=="on"){
		setAllDrawingsClickable(false);
		map.setClickableIcons(false);
		map.setOptions({draggableCursor:'crosshair'});
	}
	if(mode=="off"){
		setAllDrawingsClickable(true);
		map.setClickableIcons(true);
		map.setOptions({draggableCursor:''});
	}
}

function mouseTraceClick(point){
	var save_it = false;
	if(mouseTraceLine){
		new_point = snapMouseTracePoint(point)
		if(new_point.changed){
			point = new_point.point;
			save_it = true;
		}
		addToWorkingLine(point);
		if(save_it)saveWorkingLine();
		else editMouseTraceStartPoint(point);
	}
	else turnOnMouseTrace(point);
}

function clearMouseTraceLine(){
	if(mouseTraceLine){
		google.maps.event.removeListener(mouseMoveTraceHandler);
		mouseTraceLine.setMap(null);
		mouseTraceLine = null;
	}

}

function editMouseTraceStartPoint(point){
	if(mouseTraceLine){
		var path = new Array({lat:point.lat(), lng:point.lng()},{lat:point.lat(),lng:point.lng()});
		mouseTraceLine.setOptions({path:path});
	}
}

function drawMouseTraceLine(end_point,info_element_id){
	if(typeof info_element_id == "undefined")info_element_id = 'info';
	var info = document.getElementById(info_element_id);
	var save_it = false;
	if(mouseTraceLine){
		var path = mouseTraceLine.getPath();
		new_point = snapMouseTracePoint(end_point);
		if(new_point.changed){
			end_point = new_point.point;
		}
		path.pop();
		path.push(end_point);
		var info_text = "Section " + getPerimeterData(mouseTraceLine);
		if(workingLine){
			path = workingLine.getPath();
			path.push(end_point);
			info_text += "<br/>Whole line " + getPerimeterData(workingLine);
			path.pop();
		}
		info.innerHTML = info_text;
	}
	else{
		if(mouse_draw && drag_line_start_point){
			options = setDefaultDrawingOptions();
			options['map']=map;
			options['path'] = new Array({lat:drag_line_start_point.lat(), lng:drag_line_start_point.lng()},{lat:end_point.lat(),lng:end_point.lng()});
			options['clickable'] = false;
			mouseTraceLine = new google.maps.Polyline(options);
			mouseTraceLine.drawing_type = "polyline"
			mouseMoveTraceHandler = google.maps.event.addListener(mouseTraceLine, 'mousemove', function(e) {
				google.maps.event.trigger(map, "mousemove", e);
			});
			snap_points = new Array(drag_line_start_point);
		}
	}
}

function snapMouseTracePoint(test_point){
	if(test_point && typeof snap_points != "undefined" && snap_points){
		if( workingLine && workingLine.getPath().length>2){
			index_array = findPointsInPixelRange(5, test_point, snap_points);
			if(index_array){
				if(index_array.length == 1){
					return {point:snap_points[index_array[0][0]],changed:true};
				}
			}
		}
	}
	return {point:test_point,changed:false};;
}

function removeLastPointFromWorkingLine(){
	if(workingLine){
		path = workingLine.getPath();
		path.pop();
		var newTraceStartPoint = path.pop();
		path.push(newTraceStartPoint);
		editMouseTraceStartPoint(newTraceStartPoint);
	}
}

function setDrawingClickable(shape,clickable){
	var drawing_type = getDrawingTypeOfShape(shape);
	if(drawing_type)shape.setOptions({clickable:clickable});
	else shape.setOptions({clickable:clickable});//TODO: add other calls here is needed
}

function setAllDrawingsClickable(clickable){
	var circles = drawings["circles"];
	len = circles.length;
	var markers = drawings["markers"];
	len = markers.length;
	for(i=0;i<len;i++)setDrawingClickable(circles[i],clickable);
	var polygons = drawings["polygons"];
	len = polygons.length;
	for(i=0;i<len;i++)setDrawingClickable(polygons[i],clickable);
	var polygons = drawings["polylines"];
	len = polygons.length;
	for(i=0;i<len;i++)setDrawingClickable(polygons[i],clickable);
}
