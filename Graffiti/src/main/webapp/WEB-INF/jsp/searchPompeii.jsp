 <%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>Ancient Graffiti Project :: Search by Pompeii Map</title>
<%@ include file="/resources/common_head.txt" %>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.1.0/dist/leaflet.css"
  integrity="sha512-wcw6ts8Anuw10Mzh9Ytw4pylW8+NAD4ch3lqm9lzAsTxg0GFeJgoAtxuCLREZSC5lUXdVyo/7yfsqFjQ4S+aKw=="
  crossorigin=""/>

 <link rel="stylesheet" type="text/css" href="<%=request.getContextPath() %>/resources/css/details.css"/>
<link rel="stylesheet" href="<%=request.getContextPath() %>/resources/css/main.css" />
<link rel="stylesheet" href="C:\Users\lenovo\git\AGP_WA_Development\Graffiti\src\main\webapp\resources\js\leaflet-compass-master\src\leaflet-compass.css" />
<script type="text/javascript"
	src="<c:url value="/resources/js/pompeiiPropertyData.js"/>">
</script>

<script src="C:\Users\lenovo\git\AGP_WA_Development\Graffiti\src\main\webapp\resources\js\leaflet-compass-master\src\leaflet-compass.js"></script>

<style>

button{
	margin-top:200%;
}
</style>
</head>

<body>
<%@include file="header.jsp"%>

<script>
//Adjusts the positions of each element on-load based on the size of the window.
//This should be sufficient for most screens(most people do not use double screens like we have in the lab)
function setButton(){
	if(window.innerWidth!='undefined' && window.innerWidth!=null){
		var mapHeight=document.getElementById("pompeiimap").offsetHeight;
		var windowHeight=
		
		document.getElementById("pompeiimap").style.marginLeft=newLeftMargin.toString()+"px";
		
	}
	
}

</script>

<div class="container">
	<h2>Search Pompeii by Map</h2>
	<p>Click on one or more properties within the map, then hit the "Search" button below.</p>
	<div id="moreInfo"><button id="search" class="btn btn-agp">Search Properties</button></div>
	
	<script src="https://unpkg.com/leaflet@1.1.0/dist/leaflet.js"
  integrity="sha512-mNqn2Wg7tSToJhvHcqfzLMU6J4mkOImSPTxVZAdo+lcPlk+GhZmYgACEe0x35K7YzW1zJ7XyJV/TT1MrdXvMcA=="
  crossorigin=""></script>
	
	<div>
	<div id="newDiv"></div>
	<div id="pompeiimap" class="mapdiv"></div>
	
	</div>
	
	
</div>


<script type="text/javascript"
	src="<c:url value="/resources/js/pompeiiMap.js"/>"></script>
<script>
	window.initpompmap();
	
</script>
</body>
</html>