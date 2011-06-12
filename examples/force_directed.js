// Kind-of middleware file for interfacing with springy

importScripts("../springy/springy.js");

var opt, graph, layout;

graph = new Graph();

function onmessage(msg) {	
	opt = msg.data.options;
	var nodes = msg.data.nodes;
	var edges = msg.data.edges;
	
	for (var nindex in nodes) {
		var node = graph.newNode({label: nodes[nindex].label});
	}
	
	for (var eindex in edges) {
		var e = edges[eindex];
		graph.newEdge(graph.nodeSet[e.source], graph.nodeSet[e.target]); // works magikally because all object properties are strings?
	}
	
	layout = new Layout.ForceDirected(graph, 400.0, 400.0, 0.5);
	
	layout.start(2000, function(){
		var g = {};
		g.bounding_box = layout.getBoundingBox();
		g.nodes = {};
		layout.eachNode(function(node, point){
			g.nodes[node.id] = {
				x: point.p.x,
				y: point.p.y
			}
		});
		
		postMessage(g);
	});
}