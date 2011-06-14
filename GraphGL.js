// var WIDTH = 400, 
// 	HEIGHT = 300;
// 	
// var VIEW_ANGLE = 45,
// 	ASPECT = WIDTH/HEIGHT,
// 	NEAR = 0.1,
// 	FAR = 10000;

function GraphGL(options) {
	var that = this; // needed due to a couple of clousers
		
	this.options = {
		// defaults
	}
	// merge defaults and passed in options; later
	
	// this.data = data;
	
	this.graph;
	this.layout_worker;
	
	this.options = options;
	this.events = {};
	
	var VIEW_ANGLE = 45,
		ASPECT = this.options.width / this.options.height,
		NEAR = 0.1, // object close then NEAR wont be seen
		FAR = 1000; // object further then FAR wont be seen
	
	this.renderer = new THREE.WebGLRenderer();
	this.camera = new THREE.Camera(
		VIEW_ANGLE,
		ASPECT,
		NEAR,
		FAR);
	
	this.scene = new THREE.Scene();
	
	// maybe camera should stay at 0, 0, 0 and object go away? or not - we won't need z coordinate anyway?
	this.camera.position.z = 1000;

	this.renderer.setSize(this.options.width, this.options.height);
		
	this.options.canvas.append(this.renderer.domElement);
	
	// Events
	this.events.mouse = {}; 	
	$(this.renderer.domElement).mousedown(function(ev){
		that.events.mouse.down = true;
		that.events.mouse.x = ev.pageX;
		that.events.mouse.y = ev.pageY;
	});
	$(this.renderer.domElement).bind("mouseup mouseleave", function(ev){
		that.events.mouse.down = false;
	});
	
	this.events.mouse_position = new THREE.Vector2();
	$(this.renderer.domElement).mousemove(function(ev){
		if (that.events.mouse.down){			
			var difX = (-1)*(ev.pageX - that.events.mouse.x);
			var difY = (ev.pageY - that.events.mouse.y);
			
			// console.log(difX, difY);
			that.camera.translateX(difX);
			that.camera.translateY(difY);
			that.renderer.render(that.scene, that.camera);
		}
		
		that.events.mouse.x = ev.pageX;
		that.events.mouse.y = ev.pageY;
		
		that.events.mouse_position.set(ev.pageX, ev.pageY);
		// console.log(that.events.mouse_position);
	});
	
	// use jquery smart events?
	// $(this.renderer.domElement).bind({
	// 		mousewheel: function(e) {
	// 			// All other browser
	// 			that.camera.position.z = that.camera.position.z + e.wheelDelta;
	// 			that.renderer.render(that.scene, that.camera);
	// 		},
	// 		DOMMouseScroll: function(e) {
	// 			// Firefox event
	// 			console.log(e, e.detail, e.HORIZONTAL_AXIS, e.VERTICAL_AXIS);
	// 			//var dir = e.detail;
	// 			//if
	// 			
	// 			that.camera.position.z = that.camera.position.z + e.detail*2; 
	// 			that.renderer.render(that.scene, that.camera);
	// 		}
	// 	});
	
	this.options.r0 = new THREE.Vector2(
		$(this.renderer.domElement).offset().left+this.options.width/2,
		$(this.renderer.domElement).offset().top+this.options.height/2);

	$(this.renderer.domElement).bind("mousewheel DOMMouseScroll",
		function(ev){						
			var difZ;
			
			if (ev.DOMMouseScroll) difZ = ev.detail; // Firefox
			else difZ = ev.wheelDelta;
			
			// console.log(that.events.mouse_position.x, that.events.mouse_position.y);
			var r = new THREE.Vector2();
			r.sub(that.events.mouse_position, that.options.r0);
			
			// Move to mouse cursor - still needs some work			
			that.camera.translateX((difZ / that.camera.position.z)*r.x);
			that.camera.translateY(-(difZ / that.camera.position.z)*r.y);
			
			that.camera.position.z = that.camera.position.z - difZ;
			
			that.renderer.render(that.scene, that.camera);
	});
	
	this.pointLight = new THREE.PointLight(0xFFFFFF);
	this.pointLight.position.x = 10;
	this.pointLight.position.y = 20;
	this.pointLight.position.z = 130;
	
	this.scene.addLight(this.pointLight);
	
	this.renderer.render(this.scene, this.camera);
}

function Graph() {}
Graph.prototype.nodes = new Object();
Graph.prototype.edges = new Object();
Graph.prototype.gl_nodes = {};
Graph.prototype.gl_edges = {};


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
		// Should enable arbitrary node data with only x, y being mandatory
		graph.nodes[node.attr("id")] = {
			label: node.attr("label"),
			x: 0,
			y: 0
		}
		
		graph.gl_nodes[node.attr("id")] = that.node(10);
	});
	// console.log(this.Graph);
	
	gexf.find("edge").each(function(i, edge){
		// console.log(edge);
		var edge = $(edge);
		graph.edges[edge.attr("id")] = {
			source: edge.attr("source"),
			target: edge.attr("target")
		}
		
		graph.gl_edges[edge.attr("id")] = that.edge(
				graph.gl_nodes[edge.attr("source")],
				graph.gl_nodes[edge.attr("target")]
			)
	});	
	// console.log("IMPORTED: ", graph);
	return graph;
}

GraphGL.prototype.node = function(radius) {
	// EXTREMELY __NOT__ OPTIMIZED
	// step one - circle
	// step two - square with gpu rendering
	var segmants = 16, rings = 16;
	
	var sphereMaterial = new THREE.MeshLambertMaterial({
		color: 0xCC0000
	});
	
	var sphere = new THREE.Mesh (
		new THREE.Sphere(radius, segmants, rings), sphereMaterial);
	
	sphere.position.x = 0;
	sphere.position.y = 0;
	
	this.scene.addChild(sphere);
	
	return sphere;
}

GraphGL.prototype.edge = function(node1, node2) {
	var lineMat = new THREE.LineBasicMaterial( { color: 0xff0000, opacity: 1, linewidth: 3 } );
	
	var geom = new THREE.Geometry();
	// geom.vertices.push( new THREE.Vertex( new THREE.Vector3(
	// 	node1.position.x, 
	// 	node1.position.y, 0
	// ) ) );
	geom.vertices.push (new THREE.Vertex(node1.position));
	geom.vertices.push(new THREE.Vertex(node2.position));
	// geom.vertices.push( new THREE.Vertex( new THREE.Vector3(
	// 	node2.position.x,
	// 	node2.position.y,
	// 	0
	// ) ) );
	
	var line = new THREE.Line(geom, lineMat);
	this.scene.addObject( line );
	return line; 
}



GraphGL.prototype.render = function() {
	mx = this.options.width - 100;
	my = this.options.height - 100;
	var node;
	var bb = this.graph.bounding_box;
	// console.log("=== BB ===");
	// console.log(bb.bottomleft.x, bb.topright.x);
	// console.log(bb.bottomleft.y, bb.topright.y);
	// console.log("=== === ===");
	for (var nindex in this.graph.nodes) {
		var node = this.graph.nodes[nindex];
		
		var x = (node.x)/(bb.topright.x-bb.bottomleft.x)*mx;
		var y = (node.y)/(bb.topright.y-bb.bottomleft.y)*my;
		
		// console.log("x: ", node.x, x);
		// console.log("y: :", node.y, y);
		// console.log("--- --- ---");
		
		this.graph.gl_nodes[nindex].position.x = x;
		this.graph.gl_nodes[nindex].position.y = y;
		
		
	}
	
	for (var eindex in this.graph.edges) {
		// console.log("EDGE: ", this.graph.edges[eindex]);
		var src = this.graph.edges[eindex].source;
		var trg = this.graph.edges[eindex].target;
		//console.log(this.graph.gl_edges[eindex].geometry.vertices[0].position);
	// console.log(this.graph.gl_edges[eindex].geometry.vertices[0].position);
	// console.log("nodez: ", this.graph.gl_nodes[src].position, this.graph.gl_nodes[trg].position);

	// this.graph.gl_edges[eindex].geometry.vertices[0].position = {
	// 	x: Math.random()*200,
	// 	y: Math.random()*200,
	// 	z: 0
	// }
		
		this.graph.gl_edges[eindex].geometry.vertices[0].position = this.graph.gl_nodes[src].position;				
		this.graph.gl_edges[eindex].geometry.vertices[1].position = this.graph.gl_nodes[trg].position;
		
		this.graph.gl_edges[eindex].geometry.__dirtyVertices = true;
	}
	
	// console.log("edge loc", this.graph.gl_edges[4].geometry.vertices[0].position);
	
	this.renderer.render(this.scene, this.camera);
	
	return this;
}

GraphGL.prototype.init = function(data, importer) {
	// This can be put off to webworkers...
	var that = this;
	
	this.graph = importer.call(this, data);
	this.layout_worker = new Worker(this.options.layout);
	this.layout_worker.postMessage(function() {
		return that.options.layoutSend.call(that);
	}());
	// this.layout_worker.onmessage = this.options.layoutUpdate;
	this.layout_worker.onmessage = function(msg) {
		that.options.layoutUpdate.call(that, msg.data);
	};

	return this;
}