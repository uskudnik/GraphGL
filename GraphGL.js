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
		
	// Default options
	this.options = {
		canvas: {},
		nodes: {
			backgroundColor: 0xA0FF00,
			scale: 20
		}
	}
		
	// merge defaults and specified options options
	for (var np in options) {
		this.options[np] = options[np];
	}
		
	this.graph = new Graph();
	this.layout_worker;
	
	this.events = {};
	this.rendering_started = false;
	this.last_render = new Date();
		
	var VIEW_ANGLE = 45,
		viewField = this.options.width / Math.tan(VIEW_ANGLE * Math.PI/180), // Distance, at which entire drawing area is seen
		ASPECT = this.options.width / this.options.height,
		NEAR = 0.1; // object close then NEAR wont be seen
		 
	this.FAR = viewField+500; // object further then FAR wont be seen; must block zoom before
	
	this.renderer = new THREE.WebGLRenderer({
		clearColor: this.options.canvas.backgroundColor,
	});
	this.renderer.setSize(this.options.width, this.options.height);	
	jQuery(this.options.canvas.canvasId).append(this.renderer.domElement);
	
	this.camera = new THREE.Camera(
		VIEW_ANGLE,
		ASPECT,
		NEAR,
		this.FAR);
	
	this.camera.position.z = viewField;
	
	this.scene = new THREE.Scene();
	
	// our basic geometry
	this.node_geometry = new THREE.Plane(1, 1, 1, 1);
	
	this.node_material = new THREE.MeshShaderMaterial({
		vertexShader: $("#node-vertexShader").text(),
		fragmentShader: $("#node-fragmentShader").text()
	});
	
	this.edge_material = new THREE.MeshShaderMaterial({
		vertexShader: $("#edge-vertexShader").text(),
		fragmentShader: $("#edge-fragmentShader").text()
	});
		
	// Events
	this.events.mouse = {};
	this.events.mouse.position = new THREE.Vector2();
	
	// For dragging around canvas
	$(this.renderer.domElement).mousedown(function(ev){
		that.events.mouse.down = true;
		that.events.mouse.position.set(ev.pageX, ev.pageY);
	});
	$(this.renderer.domElement).bind("mouseup mouseleave", function(ev){
		that.events.mouse.down = false;
	});
	
	$(this.renderer.domElement).mousemove(function(ev){
		if (that.events.mouse.down){			
			var difX = (-1)*(ev.pageX - that.events.mouse.position.x);
			var difY = (ev.pageY - that.events.mouse.position.y);
			
			that.camera.translateX(difX);
			that.camera.translateY(difY);
		}
		
		// that.events.mouse.x = ev.pageX;
		// that.events.mouse.y = ev.pageY;
		
		that.events.mouse.position.set(ev.pageX, ev.pageY);
	});
	
	// Zooming
	// Middle of canvas vector
	this.options.r0 = new THREE.Vector2(
		$(this.renderer.domElement).offset().left+this.options.width/2,
		$(this.renderer.domElement).offset().top+this.options.height/2);

	$(this.renderer.domElement).bind("mousewheel DOMMouseScroll",
		function(ev){						
			var difZ;
			
			if (ev.DOMMouseScroll) difZ = ev.detail; // Firefox
			else difZ = ev.wheelDelta;

			console.log(difZ);
			var r = new THREE.Vector2();
			r.sub(that.events.mouse.position, that.options.r0);
			
			// Move to mouse cursor - still needs some work		
			console.log(that.camera.position.z - difZ);
			if ((that.camera.position.z - difZ) < that.FAR && (that.camera.position.z - difZ) > 100) {
				that.camera.translateX((difZ / that.camera.position.z)*r.x);
				that.camera.translateY(-(difZ / that.camera.position.z)*r.y);
				that.camera.position.z = that.camera.position.z - difZ;
			}
	});
	
	this.pointLight = new THREE.PointLight(0xFFFFFF);
	this.pointLight.position.set(0, 0, 0);
	
	this.scene.addLight(this.pointLight);
}

GraphGL.prototype.hexColorToRGB = function(hex) {
	R = hex >> 16;
	G = (hex >> 8) & 0x000000FF;
	B = hex & 0x000000FF;
	
	return new THREE.Vector3(R/255, G/255, B/255);
}

function Graph() {}
Graph.prototype.nodes = {};
Graph.prototype.edges = {};

Graph.prototype.node = function(data) {
	// need to be data, not just for label!
	
	if (data.color !== undefined) {
		colorVector = this.hexColorToRGB(data.color);
	} else {
		colorVector = this.hexColorToRGB(this.options.nodes.backgroundColor);
	}
	
	this.node_material.uniforms = {
		color: {
			type: 'v3',
			value: colorVector
		}
	};
	var node = new THREE.Mesh(this.node_geometry, this.node_material);
	
	// node.position.x = 0;
	// node.position.y = 0;
	// should be returned by engine?
	node.scale = new THREE.Vector3(
		this.options.nodes.scale, 
		this.options.nodes.scale, 
		this.options.nodes.scale
	);
	
	this.scene.addChild(node);
	// node.data = {};
	node.data = data;
	
	// console.log("returning node: ", node);
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
	
	return line; 
}

Graph.prototype.arcEdge = function(source, target) {	
	var edge = new THREE.Mesh(this.node_geometry, this.edge_material);
	
	edge.scale = new THREE.Vector3(10, 10, 10);
	
	edge.data = {
		source: source,
		target: target
	};
	
	this.scene.addChild(edge);
	
	return edge; 
}

GraphGL.prototype.render = function() {
	var new_render = new Date();
	
	// 100ms is interval between calculations - should be specified in options/with algorithms?
	var dt = (new_render - this.last_render)/100; // miliseconds
	for (var nindex in this.graph.nodes) {
		var node = this.graph.nodes[nindex];
		// node.position.addSelf()
		node.position.x += (node.data.x - node.position.x)*dt
		node.position.y += (node.data.y - node.position.y)*dt   
	}
	
	var e = this.graph.edges;
	for (var eindex in e) {
		var src = e[eindex].data.source;
		var trg = e[eindex].data.target;
		
		var nsrc = this.graph.nodes[src];
		var ntrg = this.graph.nodes[trg];
		
		ethis = e[eindex]; // current edge
		
		var dif = new THREE.Vector3().sub(nsrc.position, ntrg.position); 
		
		var w = ntrg.position.distanceTo(nsrc.position);
		var h = Math.max(dif.y, w);  // ? dif.y : w/5;
		
		ethis.position = new THREE.Vector3().add(nsrc.position, ntrg.position).divideScalar(2);
		
		ethis.rotation = new THREE.Vector3(0, 0, Math.atan(dif.y/dif.x));
		ethis.scale = new THREE.Vector3(w, h, 1);
		
		ethis.materials[0].uniforms = {
			radiusbox: {
				type: "v2",
				value: new THREE.Vector2(w, h)
			},
			pstart: {
				type: "v2",
				value: new THREE.Vector2(nsrc.position.x, nsrc.position.y)
			},
			pend: {
				type: "v2",
				value: new THREE.Vector2(ntrg.position.x, ntrg.position.y)
			},
			canvasDimensions: {
				type: "v2",
				value: new THREE.Vector2(this.options.width, this.options.height)
			}
		};
		
		
		// For line
		// this.graph.edges[eindex].geometry.vertices[0].position = this.graph.nodes[src].position;				
		// this.graph.edges[eindex].geometry.vertices[1].position = this.graph.nodes[trg].position;
		
		// ethis.geometry.__dirtyVertices = true;
	}
	
	
	this.renderer.render(this.scene, this.camera);
	this.last_render = new_render;
}

GraphGL.prototype.start = function(dataUrl, importType) {
	// Load data and initialize when ready - overload if you have something else then JSON
	jQuery.getJSON(dataUrl, function(data) {
		
	});
}

GraphGL.prototype.initialize = function() {
	var that = this;
	
	// this.graph = importer.call(this, data);
	// console.log("load called");
	if (import_type == "json") {
		// console.log("type json");
		this.import_worker = new Worker("../../import-json.js");
		this.import_worker.postMessage(data);
		
		this.import_worker.onmessage = function(msg) {
			console.log("import worker: ", msg.data);
			var data = msg.data;
			
			// var graph = new Graph();
			
			for(var n in data.nodes) {
				// console.log(n, data.nodes[n]);
				that.graph.nodes[n] = that.graph.node.call(that, {
					id: n,
					label: data.nodes[n]
				});
				
			}
			// console.log(that.graph.nodes, that.graph);
			
			for(var e in data.edges) {
				var edge = data.edges[e];
				that.graph.edges[e] = that.graph.arcEdge.call(that, edge.source, edge.target);
			}
			// that.graph = graph;
			
			that.layout_worker.postMessage(function() {
				console.log(that.graph);
				// return that.options.layoutSend.call(that);
			}());
		}
		
		this.import_worker.onerror = function(event) {
			console.log("event.message: ", event.message);
			// event.preventDefault();
		}
	}
	
	// this.import_worker = new Worker(this.options.importer);
	// this.import_worker.postMessage(this.options.import_data);
	
	// this.import_worker.onmessage = function(msg) {
	// 	console.log("from import worker: ", msg.data);
	// };
	
	this.layout_worker = new Worker(this.options.layout);
	// this.layout_worker.postMessage(function() {
	// 		return that.options.layoutSend.call(that);
	// 	}());

	this.layout_worker.onmessage = function(msg) {
		that.options.layoutUpdate.call(that, msg.data);
		
		if (!that.rendering_started) {
			that.rendering_started = true;
			that.animate();
		}
	};
	
	this.layout_worker.onerror = function(event) {
	    console.log(event.message + " (" + event.filename + ":" + event.lineno + ")");
	};
	
	return this;
}


// GraphGL.prototype.anim = function() {
// 	// that = this;
// 	// this.options.canvas.canvasId
// 	
// 	// Uncaught Error: TYPE_MISMATCH_ERR: DOM Exception 17 - suspected problem with namespace
// 	animate = this.anim;
// 	requestAnimFrame(animate);
// 	this.render();
// }