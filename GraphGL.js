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
		},
		edges: {
			type: "line"
		},
		layoutUpdate: function(data) {
			// console.log("Layout update: ", data);

			var mx = this.options.width - 100;
			var my = this.options.height - 100;
			
			// console.log(data);
			var boundingBox = data.boundingBox;
			var x, y;
			
			var i = data._keys.length;
			while(i--) {
				var key = data._keys[i];
				var node = data._data[key];
				
				x = node.nodeData.x / (boundingBox.topRight.x - boundingBox.bottomLeft.x) * mx;
				y = node.nodeData.y / (boundingBox.topRight.y - boundingBox.bottomLeft.y) * my;
				
				// this.graph.nodes[key].data.x = x;
				// this.graph.nodes[key].data.y = y;
				this.graph.nodes[key].position.x = x;
				this.graph.nodes[key].position.y = y;
				
				if(this.firstFrame) {
					var scale = Math.max(5, 30*node.degree/data.maxDegree);
					this.graph.nodes[key].scale = new THREE.Vector3(scale, scale, scale);
				}
			}
			this.firstFrame = false;
		}
	}
		
	// merge defaults and specified options options
	for (var np in options) {
		this.options[np] = options[np];
	}
		
	this.graph = new Graph();
	this.layoutWorker;
	
	this.events = {};
	
	this.renderingStarted = false;
	this.firstFrame = true;
	
	this.last_render = new Date();
	this.iterTime;
		
	var VIEW_ANGLE = 45,
		viewField = this.options.width / Math.tan(VIEW_ANGLE * Math.PI/180), // Distance, at which entire drawing area is seen
		ASPECT = this.options.width / this.options.height,
		NEAR = 0.1; // object close then NEAR wont be seen
		 
	this.FAR = viewField+500; // object further then FAR wont be seen; must block zoom before
	
	this.renderer = new THREE.WebGLRenderer({
		clearColor: this.options.canvas.backgroundColor,
		antialias: true
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
	
	// Basic geometry
	this.node_geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
	
	this.node_material = new THREE.MeshShaderMaterial({
		vertexShader: $("#node-vertexShader").text(),
		fragmentShader: $("#node-fragmentShader").text()
	});
	
	this.edge_material = new THREE.MeshShaderMaterial({
		vertexShader: $("#edge-vertexShader").text(),
		fragmentShader: $("#edge-fragmentShader").text()
	});
	
	// Master geometries	
	this.Edges = new THREE.Line(new THREE.Geometry(), new THREE.LineBasicMaterial( { color: 0xff0000, opacity: 0.2, linewidth: 1} ), THREE.LinePieces);
	this.Edges.edges = [];
		
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
	node.data = data;
	
	return node;
};

Graph.prototype.lineEdge = function(source, target) {
	// var lineMat = new THREE.LineBasicMaterial( { color: 0xff0000, opacity: 0.2, linewidth: 1} );
	
	// var lineGeo = new THREE.Geometry();
	this.Edges.geometry.vertices.push(new THREE.Vertex());
	this.Edges.geometry.vertices.push(new THREE.Vertex());
	
	this.Edges.edges.push({source: source, target: target});

	// var edge = new THREE.Line(lineGeo, lineMat);
	// this.scene.addObject( edge );
	
	// edge.data = {
	// 		source: source,
	// 		target: target
	// 	};
	// 	
	// return ; 
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
	// var dt = (new_render - this.last_render)/this.iterTime; // miliseconds
	console.log("iter: ", this.iterTime, "frame: ", new_render - this.last_render);
	
	
	// for (var nindex in this.graph.nodes) {
	// 		var node = this.graph.nodes[nindex];
	// 		// node.position.addSelf()
	// 		// node.position.x += (node.data.x - node.position.x)*dt
	// 		// node.position.y += (node.data.y - node.position.y)*dt
	// 		node.position.x = node.data.x;
	// 		node.position.y = node.data.y;
	// 		
	// 		// console.log("position: ", node.position.x, node.position.y);
	// 	}
	
	// var e = this.graph.edges;
	// for (var eindex in e) {
	// 		var src = e[eindex].data.source;
	// 		var trg = e[eindex].data.target;
	// 		
	// 		var nsrc = this.graph.nodes[src];
	// 		var ntrg = this.graph.nodes[trg];
	// 		
	// 		ethis = e[eindex]; // current edge
	// 		
	// 		var dif = new THREE.Vector3().sub(nsrc.position, ntrg.position); 
	// 		
	// 		var w = ntrg.position.distanceTo(nsrc.position);
	// 		var h = Math.max(dif.y, w);  // ? dif.y : w/5;
	// 		
	// 		ethis.position = new THREE.Vector3().add(nsrc.position, ntrg.position).divideScalar(2);
	// 		
	// 		ethis.rotation = new THREE.Vector3(0, 0, Math.atan(dif.y/dif.x));
	// 		ethis.scale = new THREE.Vector3(w, h, 1);
	// 		
	// 		ethis.materials[0].uniforms = {
	// 			radiusbox: {
	// 				type: "v2",
	// 				value: new THREE.Vector2(w, h)
	// 			},
	// 			pstart: {
	// 				type: "v2",
	// 				value: new THREE.Vector2(nsrc.position.x, nsrc.position.y)
	// 			},
	// 			pend: {
	// 				type: "v2",
	// 				value: new THREE.Vector2(ntrg.position.x, ntrg.position.y)
	// 			},
	// 			canvasDimensions: {
	// 				type: "v2",
	// 				value: new THREE.Vector2(this.options.width, this.options.height)
	// 			}
	// 		};
	// }
	
	var edges = this.Edges.edges;
	var i = edges.length;
	while (i--) {
		var src = edges[i].source;
		var trg = edges[i].target;
		
		var nsrc = this.graph.nodes[src];
		var ntrg = this.graph.nodes[trg];
		
		var isrc = i*2;
		var itrg = i*2+1;
		
		this.Edges.geometry.vertices[isrc].position = nsrc.position;
		this.Edges.geometry.vertices[itrg].position = ntrg.position;
			
		this.Edges.geometry.__dirtyVertices = true;
	}
	
	
	this.renderer.render(this.scene, this.camera);
	this.last_render = new_render;
}

GraphGL.prototype.start = function(dataUrl) {
	// Load data and initialize when ready - overload if you have something else then JSON
	var that = this;
	console.log(dataUrl);
	jQuery.ajax({
		url: dataUrl,
		type: "GET",
		dataType: "json",
		success: function(data) {
			console.log("data init");
			that.graphData = data;
			that.graph = new Graph();
			// console.log(data);
			for(var n in data.nodes) {
				that.graph.nodes[n] = that.graph.node.call(that, {
					id: n,
					label: data.nodes[n]
				});
			}
			
			if (that.options.edges.type == "arc") {
				for(var e in data.edges) {
					var edge = data.edges[e];
					that.graph.edges[e] = that.graph.arcEdge.call(that, edge.source, edge.target);
				}
			} else if (that.options.edges.type == "line") {
				for(var e in data.edges) {
					var edge = data.edges[e];
					that.graph.lineEdge.call(that, edge.source, edge.target);
				}
				
				that.scene.addObject(that.Edges);
			}
			
			that.initialize();
		},
		error: function(jqXHR, textStatus, errorThrown) {
			if (console && console.log)
				console.log("Error: ", jqXHR, textStatus, errorThrown);
		}
	});
	
	return this;
}

GraphGL.prototype.initialize = function() {
	// After initial data has been loaded and models built, we can start calculating layout and rendering
	console.log("initialize");
	
	var that = this;
	
	// VALID, but for the time being lets do it in the main thread
	this.layoutWorker = new Worker(this.options.layout);
		// this.layoutWorker.postMessage(function() {
		// 		return that.options.layoutSend.call(that);
		// }());
	this.layoutWorker.postMessage(this.graphData);
	
	this.layoutWorker.onmessage = function(msg) {
		// console.log("Returned data:", msg.data);
		if (msg.data.type == "log")
			return;
		
		that.options.layoutUpdate.call(that, msg.data);
		that.iterTime = msg.data.iterTime;
		// console.log(msg.data.boundingBox.bottomLeft.x, msg.data.boundingBox.bottomLeft.y, msg.data.boundingBox.topRight.x, msg.data.boundingBox.topRight.y);
		
		if (!that.renderingStarted) {
			that.renderingStarted = true;
			that.animate();
		}
	};
		
	this.layoutWorker.onerror = function(event) {
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