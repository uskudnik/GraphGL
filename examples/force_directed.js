var opt, graph;

function force_layout() {
	// console.log("force layout", this);
	
	var width = opt.width, height = opt.height;
	var nodes = graph.nodes;
	var edges = graph.edges;
	
	// TODO: make sure no two nodes are at identical positions
	// Position nodes at random positions
	for each(var node in nodes) {
		node.x = Math.random() * width - width/2;
		node.y = Math.random() * height - height/2;
	}
	
	postMessage({
		nodes: nodes,
		edges: edges
	})
	
	// console.log(this);
	// return this;
}

function onmessage(msg) {
	// console.log("w0k w0k", msg);
	// postMessage("forze wiwf az");
	// postMessage(msg.data);
	opt = msg.data.options;
	graph = {
		nodes: msg.data.nodes,
		edges: msg.data.edges
	};
	force_layout();
}