function import_gexf(data) {
var that = this;
var gexf;
console.log("gexf");

var graph = new Graph();

gexf = $(data);


// Will need to be recursive
// console.log(that.Graph);
gexf.find("node").each(function(i, node){
var node = $(node);

// console.log(node);
graph.nodes[node.attr("id")] = graph.node.call(that, {
id: node.attr("id"),
label: node.attr("label")
}); // should be more robust?
});

gexf.find("edge").each(function(i, edge){
// console.log(edge);
var edge = $(edge);

graph.edges[edge.attr("id")] = graph.arcEdge.call(that,
	graph.nodes[edge.attr("source")],
	graph.nodes[edge.attr("target")]);
});
console.log("GENERATED GRAPH: ", graph);
return graph;
}