<%@ page language="java" contentType="text/html; charset=US-ASCII"
	pageEncoding="US-ASCII"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions"%>
<!DOCTYPE html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=US-ASCII">
<title>Ancient Graffiti Project :: Filter Results</title>
<link rel="stylesheet" type="text/css"
	href="<%=request.getContextPath()%>/resources/css/details.css" />
<%@include file="../../../resources/common_head.txt"%>
<script type="text/javascript"
	src="<c:url value="/resources/js/jquery.imagemapster-1.2.js" />"></script>
<script type="text/javascript"
	src="<c:url value="/resources/js/filterSearch.js"/>"></script>

<style>
th {
	font-weight: bold;
	color: maroon;
}
</style>
</head>
<body>
	<%@include file="/WEB-INF/jsp/header.jsp"%>
	<div class="container">

		<%
		if (request.getAttribute("pompeiiProperties") != null) {
		%>
			<h1>Pompeii Properties</h1>
			<div class="button_bar">
				<a href="<%=request.getContextPath()%>/properties/Pompeii/csv"
					id="pompeiiCSV">
					<button class="btn btn-agp right-align">Export as CSV</button>
				</a> <a href="<%=request.getContextPath()%>/properties/Pompeii/json"
					id="pompeiiJSON">
					<button class="btn btn-agp right-align">Export as JSON</button>
				</a>
			</div>
	
			<table class="table table-bordered table-striped" id="pompeiiTable"
				style="margin-bottom: 30px;">
				<tr>
					<th>City</th>
					<th>Insula</th>
					<th>Number</th>
					<th>Name</th>
					<th>Type</th>
					<th>URI</th>
				</tr>
				<c:forEach var="k" begin="${1}"
					end="${fn:length(requestScope.pompeiiProperties)}">
					<c:set var="prop" value="${requestScope.pompeiiProperties[k-1]}" />
					<tr>
						<td>${prop.insula.modernCity }</td>
						<td>${prop.insula.shortName}</td>
						<td>${prop.propertyNumber}</td>
						<td>${prop.propertyName}</td>
						<td><c:forEach var="l" begin="${1}"
								end="${fn:length(prop.propertyTypes)}">
								<c:set var="pt" value="${prop.propertyTypes[l-1]}" />
								${pt.name}
							</c:forEach></td>
						<td><a href="http://${prop.uri}">http://${prop.uri}</a></td>
					</tr>
				</c:forEach>
			</table>
		<%
		}
		if(request.getAttribute("herculaneumProperties") != null) {
		%>
		<h2>Herculaneum Properties</h2>
		<div class="button_bar">
				<a href="<%=request.getContextPath()%>/properties/Herculaneum/csv"
					id="csv">
					<button class="btn btn-agp right-align">Export as CSV</button>
				</a> <a href="<%=request.getContextPath()%>/properties/Herculaneum/json"
					id="csv">
					<button class="btn btn-agp right-align">Export as JSON</button>
				</a>
			</div>
	
			<table class="table table-bordered table-striped" id="herculaneumTable"
				style="margin-bottom: 30px;">
				<tr>
					<th>City</th>
					<th>Insula</th>
					<th>Number</th>
					<th>Name</th>
					<th>Type</th>
					<th>URI</th>
				</tr>
				<c:forEach var="m" begin="${1}"
					end="${fn:length(requestScope.herculaneumProperties)}">
					<c:set var="prop" value="${requestScope.herculaneumProperties[m-1]}" />
					<tr>
						<td>${prop.insula.modernCity }</td>
						<td>${prop.insula.shortName}</td>
						<td>${prop.propertyNumber}</td>
						<td>${prop.propertyName}</td>
						<td><c:forEach var="n" begin="${1}"
								end="${fn:length(prop.propertyTypes)}">
								<c:set var="pt" value="${prop.propertyTypes[n-1]}" />
								${pt.name}
							</c:forEach></td>
						<td><a href="http://${prop.uri}">http://${prop.uri}</a></td>
					</tr>
				</c:forEach>
			</table>
		<%
		}	
		%>


	</div>

</body>
</html>