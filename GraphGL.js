// var WIDTH = 400, 
// 	HEIGHT = 300;
// 	
// var VIEW_ANGLE = 45,
// 	ASPECT = WIDTH/HEIGHT,
// 	NEAR = 0.1,
// 	FAR = 10000;

// @see http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1000 / 60);
          };
})();


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
	
	this.updates_started = false;
	
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
	
	this.node_geometry = new THREE.Plane(1, 1, 1, 1);
	// this.node_material = new THREE.MeshBasicMaterial({color: 0xCC0000});
	this.node_material = new THREE.MeshShaderMaterial({
		vertexShader: $("#vertexShader").text(),
		fragmentShader: $("#fragmentShader").text()
	})
	
	// maybe camera should stay at 0, 0, 0 and object go away? or not - we won't need z coordinate anyway?
	// console.log("Z COORD: ", this.options.width / Math.tan(VIEW_ANGLE * Math.PI/180));
	this.camera.position.z = this.options.width / Math.tan(VIEW_ANGLE * Math.PI/180);

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
			
			console.log(that.camera, ev.detail);
			if (ev.DOMMouseScroll) difZ = ev.detail; // Firefox
			else difZ = ev.wheelDelta;
			
			// console.log(that.events.mouse_position.x, that.events.mouse_position.y);
			var r = new THREE.Vector2();
			r.sub(that.events.mouse_position, that.options.r0);
			
			// Move to mouse cursor - still needs some work			
			// that.camera.translateX((difZ / that.camera.position.z)*r.x);
			// that.camera.translateY(-(difZ / that.camera.position.z)*r.y);
			 
			// DISABLED zooming for time being
			// that.camera.position.z = that.camera.position.z - ev.detail*10;
			
			// that.renderer.render(that.scene, that.camera);
	});
	
	this.pointLight = new THREE.PointLight(0xFFFFFF);
	this.pointLight.position.x = 10;
	this.pointLight.position.y = 20;
	this.pointLight.position.z = 130;
	
	this.scene.addLight(this.pointLight);
	
	this.renderer.render(this.scene, this.camera);
}

function Graph() {}
Graph.prototype.nodes = {};
Graph.prototype.edges = {};
// Graph.prototype.gl_nodes = {};
// Graph.prototype.gl_edges = {};

Graph.prototype.node = function(data) {
	// need to be data, not just for label!
	
	// EXTREMELY __NOT__ OPTIMIZED
	// step one - square
	// step two - square with gpu rendering
	// var radius = 20, segmants = 16, rings = 16;
	// 
	// var sphereMaterial = new THREE.MeshLambertMaterial({
	// 	color: 0xCC0000
	// });
	// 
	// var node = new THREE.Mesh (
	// 	new THREE.Sphere(radius, segmants, rings), sphereMaterial);
	
	// no need to do it all the time? clone?
	
	// var square = new THREE.Geometry();
	// square.vertices.push(new THREE.Vertex(new THREE.Vector3(10, 10, 0)));
	// square.vertices.push(new THREE.Vertex(new THREE.Vector3(-10, 10, 0)));
	// square.vertices.push(new THREE.Vertex(new THREE.Vector3(10, -10, 0)));
	// square.vertices.push(new THREE.Vertex(new THREE.Vector3(-10, -10, 0)));
	// new THREE.Plane(10, 10, 10, 10),
	// new THREE.MeshShaderMaterial({
	// 	vertexShader: $("#vertexShader").text(),
	// 	fragmentShader: $("#fragmentShader").text()
	// })
	
	
	// new THREE.MeshShaderMaterial({
	// 	vertexShader: $("#vertexShader").text(),
	// 	fragmentShader: $("#fragmentShader").text()
	// })
	
	// var node = new THREE.Mesh (
	// 	square,
	// 	new THREE.MeshBasicMaterial({color: 0xCC0000})
	// );
	
	var node = new THREE.Mesh(this.node_geometry, this.node_material);
	
	node.position.x = 0;
	node.position.y = 0;
	node.scale = new THREE.Vector3( 20, 20, 20 );
	// node.scale = new THREE.Vector3( 40, 40, 40 );
	
	this.scene.addChild(node);
	node.data = {};
	node.data = data;
	
	return node;
};

Graph.prototype.edge = function(node1, node2) {
	var lineMat = new THREE.LineBasicMaterial( { color: 0xff0000, opacity: 0.7, linewidth: 1} );
	
	var geom = new THREE.Geometry();
	geom.vertices.push(new THREE.Vertex(node1.position));
	geom.vertices.push(new THREE.Vertex(node2.position));

	
	var line = new THREE.Line(geom, lineMat);
	this.scene.addObject( line );
	
	line.data = {
		source: node1.data.id,
		target: node2.data.id
	};
	
	// console.log(line);
	return line; 
}

GraphGL.prototype.update = function() {
	// console.log("running update");
	
	if (!this.graph.updated) {
		requestAnimFrame(this.update());
		return;
	}
	
	// mx = this.options.width - 100;
	// my = this.options.height - 100;
	// var node;
	
	// var bb = this.graph.bounding_box;
	// console.log(this.graph.bounding_box);
	// console.log("=== BB ===");
	// console.log(bb.bottomleft.x, bb.topright.x);
	// console.log(bb.bottomleft.y, bb.topright.y);
	// console.log("=== === ===");
	for (var nindex in this.graph.nodes) {		
		this.graph.nodes[nindex].position.x = this.graph.nodes[nindex].data.x;
		this.graph.nodes[nindex].position.y = this.graph.nodes[nindex].data.y;
	}
	
	for (var eindex in this.graph.edges) {
		// console.log("EDGE: ", this.graph.edges[eindex]);
		var src = this.graph.edges[eindex].data.source;
		var trg = this.graph.edges[eindex].data.target;
		
		// console.log("edge src, trg: ", src, trg);
		this.graph.edges[eindex].geometry.vertices[0].position = this.graph.nodes[src].position;				
		this.graph.edges[eindex].geometry.vertices[1].position = this.graph.nodes[trg].position;
		
		this.graph.edges[eindex].geometry.__dirtyVertices = true;
	}
		
	this.renderer.render(this.scene, this.camera);
	
	this.graph.updated = false;
	// requestAnimFrame(this.update());
	// return this;
}

GraphGL.prototype.init = function(data, importer) {
	// This can be put off to webworkers...
	var that = this;
	
	
	this.graph = importer.call(this, data);
	// this.import_worker = new Worker(this.options.importer);
	// this.import_worker.postMessage(this.options.import_data);
	
	// this.import_worker.onmessage = function(msg) {
	// 	console.log("from import worker: ", msg.data);
	// };
	
	this.layout_worker = new Worker(this.options.layout);
	this.layout_worker.postMessage(function() {
		return that.options.layoutSend.call(that);
	}());
	// this.layout_worker.onmessage = this.options.layoutUpdate;
	this.layout_worker.onmessage = function(msg) {
		that.options.layoutUpdate.call(that, msg.data);
		// if (!that.updates_started) {
			// can probably be done in a smarter fashion?
			that.update();
			that.updates_started = true;
		// }
	};
	
	this.layout_worker.onerror = function(event) {
	    console.log(event.message + " (" + event.filename + ":" + event.lineno + ")");
	};

	return this;
}

// GraphGL.prototype.render = function() {
// 	requestAnimFrame(this.update.call(this));
// }