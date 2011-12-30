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
			color: 0xA0FF00,
			borderColor: 0xAFFF00, 
			selectColor: 0xFF0011,
			scale: 20
		},
		edges: {
			type: "line"
		},
		logging: true;
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
	
	this.VIEW_ANGLE = 45;
	var	viewField = this.options.width / Math.tan(this.VIEW_ANGLE * Math.PI/180); // Distance, at which entire drawing area is seen
		ASPECT = this.options.width / this.options.height,
		NEAR = 0.1; // object close then NEAR wont be seen
		 
	this.FAR = viewField+500; // object further then FAR wont be seen; must block zoom before
	
	this.renderer = new THREE.WebGLRenderer({
		clearColor: this.options.canvas.backgroundColor,
		antialias: true,
		enableDepthBufferWrite: true
	});
	this.renderer.sortObjects = false;
	this.renderer.setSize(this.options.width, this.options.height);	
	jQuery(this.options.canvas.canvasId).append(this.renderer.domElement);
	
	this.camera = new THREE.Camera(
		this.VIEW_ANGLE,
		ASPECT,
		NEAR,
		this.FAR);
	
	this.camera.position.z = viewField;
	
	this.scene = new THREE.Scene();
	
	// Basic geometry
	// this.node_geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
	
	// this.node_material = new THREE.MeshShaderMaterial({
	// 	vertexShader: $("#node-vertexShader").text(),
	// 	fragmentShader: $("#node-fragmentShader").text()
	// });
	
	// this.edge_material = new THREE.MeshShaderMaterial({
	// 	vertexShader: $("#edge-vertexShader").text(),
	// 	fragmentShader: $("#edge-fragmentShader").text()
	// });
	
	this.NodeAttributes = {
		aColor: {
			type: "c", 
			value: []
		},
		size: {
			type: "f",
			value: []
		}
	};
	
	// attributes: this.nodeAttributes,
	this.NodeShader = new THREE.MeshShaderMaterial({
		attributes: this.NodeAttributes,
		vertexShader: $("#node-vertexShader").text(),
		fragmentShader: $("#node-fragmentShader").text()
	});
	
	// this.Nodes = new THREE.ParticleSystem(this.NodesGeometry, this.NodeShader);
	// this.Nodes.dynamic = true;
	
	this.NodeSystem;
	this.Nodes = new THREE.Geometry();
	this.Nodes.nodes = {};
	// this.Nodes.nodes = {};
	
	// Master geometries	
	this.Edges = new THREE.Line(new THREE.Geometry(), new THREE.LineBasicMaterial( { color: this.options.nodes.color, opacity: 0.2, linewidth: 1} ), THREE.LinePieces);
	// this.Edges.renderDepth = 0;
	this.Edges.edges = [];
	
	this.connectedEdges = new THREE.Line(new THREE.Geometry(), new THREE.LineBasicMaterial( { color: this.options.selectColor, opacity: 0.8, linewidth: 2} ), THREE.LinePieces);
	// this.connectedEdges.dynamic = true;
	this.connectedEdges.edges = [];
		
	// Events
	this.events.mouse = {};
	this.events.mouse.position = new THREE.Vector3();
	
	this.events.selectedNodes = [];
	// this.events.nodes.selected = false;
	
	// For dragging around canvas
	$(this.renderer.domElement).mousedown(function(ev){
		// console.log("edges: ", that.Edges.materials[0].opacity);
		// that.Edges.materials[0].opacity = 0.8;
		that.events.mouse.down = true;
		that.events.mouse.position.set(ev.pageX, ev.pageY, 0);
		
		
	});
	$(this.renderer.domElement).bind("mouseup mouseleave", function(ev){
		that.events.mouse.down = false;
	});
	
	$(this.renderer.domElement).mousemove(function(ev){
		if (that.events.mouse.down){			
			var difX = (-1)*(ev.pageX - that.events.mouse.position.x)*(that.camera.position.z/viewField);
			var difY = (ev.pageY - that.events.mouse.position.y)*(that.camera.position.z/viewField);
			
			that.camera.translateX(difX);
			that.camera.translateY(difY);
		}
		
		// that.events.mouse.x = ev.pageX;
		// that.events.mouse.y = ev.pageY;
		
		that.events.mouse.position.set(ev.pageX, ev.pageY, 0);
	});
	
	// Zooming
	// Middle of canvas vector
	this.options.r0 = new THREE.Vector3(
		$(this.renderer.domElement).offset().left+this.options.width/2,
		$(this.renderer.domElement).offset().top+this.options.height/2,
		0);

	$(this.renderer.domElement).bind("mousewheel DOMMouseScroll",
		function(ev){						
			var difZ;
			
			if (ev.type == "DOMMouseScroll") difZ = ev.detail; // Firefox
			else difZ = ev.wheelDelta;

			// console.log(difZ);
			var r = new THREE.Vector3();
			r.sub(that.events.mouse.position, that.options.r0);
			
			// Move to mouse cursor - still needs some work		
			// console.log(that.camera.position.z - difZ);
			difZ = difZ *(that.camera.position.z/that.camera.far)*10;
			// r.multiplyScalar((that.camera.position.z/that.camera.far)*20);
			if ((that.camera.position.z - difZ) < that.FAR && (that.camera.position.z - difZ) > 50) {
				that.camera.translateX((difZ / that.camera.position.z)*r.x);
				that.camera.translateY(-(difZ / that.camera.position.z)*r.y);
				that.camera.position.z = that.camera.position.z - difZ;
			}
	});
	
	// Interactivity
	this.projector = new THREE.Projector();
	$(this.renderer.domElement).click(function(ev){
		// First remove old connected edges and reset color of selected node(s)
		that.scene.removeObject(that.connectedEdges);
		var i = that.events.selectedNodes.length;
		while(i--) {
			that.events.selectedNodes[i].materials[0].uniforms.color.value = that.hexColorToRGB(that.options.nodes.color);
		}
		
		that.connectedEdges = new THREE.Line(new THREE.Geometry(), new THREE.LineBasicMaterial( { color: that.options.nodes.selectColor, opacity: 0.8, linewidth: 2} ), THREE.LinePieces);
		that.connectedEdges.edges = [];
		
		//Calculate position of a click		
		clickPosition = new THREE.Vector3(ev.pageX, ev.pageY, that.camera.position.z);
		
		clickPosition.subSelf(that.options.r0);
		// To invert y axis
		clickPosition.multiplySelf({x: 1, y: -1, z: 1});

		var cp = new THREE.Vector3().add(that.camera.position, clickPosition.clone().multiplyScalar(that.camera.position.z/viewField));
		
		// Move to correct plane
		cp.z = 0;
		
		clickPosition.subSelf(that.camera.position);
		
		for(var obji in that.graph.nodes) {
			var node = that.graph.nodes[obji];
			var	distance = node.position.distanceTo(cp);
			
			if (distance < node.boundRadiusScale) {
				console.log("Intersect: ", node);
				that.events.selectedNodes.push(node);
				// console.log("nodepos: ", node.position.x, node.position.y);
				node.materials[0].uniforms.color.value = that.hexColorToRGB(that.options.nodes.selectColor);
				
				var i = that.Edges.edges.length;
				while(i--) {
					var edge = that.Edges.edges[i];
					if (edge.source == node.data.id) {		
						that.connectedEdges.geometry.vertices.push(new THREE.Vector3());
						that.connectedEdges.geometry.vertices.push(new THREE.Vector3());
						that.connectedEdges.edges.push(edge);
					}
				}
				
				that.scene.addObject(that.connectedEdges);
			}			
		}
	});
	
	// Said to be better for performance
	this.pointLight = new THREE.DirectionalLight(0xFFFFFF);	
	this.scene.addLight(this.pointLight);
}

GraphGL.StaticLayout = function() {
	console.log("Static layout");
	
	// console.log(this.graphData);
	// console.log(this.Nodes.notdes);
	var xmin = 0, xmax = 0;
	var ymin = 0, ymax = 0;
	var nodes = this.Nodes.nodes;
	
	var geo = this.NodeSystem.geometry.vertices;
	var vcolor = this.NodeAttributes.aColor.value;
	var vsize = this.NodeAttributes.size.value;
	
	console.log(this.camera);
	var i = 6517;
	for (var n in nodes) {
		var node = nodes[n];
		var data = node.data;
		// console.log(node);
		xmin = Math.min(xmin, data.x);
		xmax = Math.max(xmax, data.x);
		ymin = Math.min(ymin, data.y);
		ymax = Math.max(ymax, data.y);
		node.position = new THREE.Vector3(data.x, data.y, 0);
		
		geo[node.vertice].position = new THREE.Vector3(data.x, data.y, 0);
		vcolor[node.vertice] = new THREE.Color().setRGB(data.r / 255, data.g / 255, data.b / 255);
		// vcolor[node.vertice] = new THREE.Color().setRGB(1.0, 0.0, 0.0);
		vsize[node.vertice] = data.size ? data.size : 3;
	}
	// console.log(vsize);
	// console.log(vcolor);
	var xmax = Math.max(Math.abs(xmin), Math.abs(xmax));
	var ymax = Math.max(Math.abs(ymin), Math.abs(ymax));
	var viewField = Math.max(xmax, ymax) / Math.tan(this.VIEW_ANGLE * Math.PI/180);
	// this.camera.far = viewField + 500;
	console.log(viewField);
	this.FAR = viewField + 500;
	this.camera.far = viewField+500;
	this.camera.updateProjectionMatrix();
	// console.log(viewField);
	// this.camera.position.z = viewField;
	
	var edges = this.Edges.edges;
	var edges_vertices = this.Edges.geometry.vertices;
	var i = edges.length;
	while (i--) {
		var src = edges[i].source;
		var trg = edges[i].target;
		
		var nsrc = this.Nodes.nodes[src];
		var ntrg = this.Nodes.nodes[trg];
		
		var isrc = i*2;
		var itrg = i*2+1;
		
		edges_vertices[isrc].position = nsrc.position;
		edges_vertices[isrc].position.z = -1;
		
		edges_vertices[itrg].position = ntrg.position;
		edges_vertices[itrg].position.z = -1;	
			
		// console.log(nsrc.position, ntrg.position);
		// console.log(this.Edges.geometry.vertices[isrc], this.Edges.geometry.vertices[itrg]);
		// this.renderer.render(this.scene, this.camera);
		// break;
	}
	
	this.NodeSystem.geometry.__dirtyVertices = true;
	this.Edges.geometry.__dirtyVertices = true;
	
	this.NodeAttributes.aColor.needsUpdate = true;
	this.NodeAttributes.size.needsUpdate = true;
	this.animate();
}

GraphGL.DynamicLayout = function() {
	console.log("Dynamic layout ");
	var that = this;
	// VALID, but for the time being lets do it in the main thread
	this.layoutWorker = new Worker(this.options.layout);
		// this.layoutWorker.postMessage(function() {
		// 		return that.options.layoutSend.call(that);
		// }());
	this.layoutWorker.postMessage(this.graphData);
	
	this.layoutWorker.onmessage = function(msg) {
		// console.log("Returned data:", msg.data);
		if (msg.data.type == "log") {
			console.log(msg.data.log);
			return;
		}
		
		GraphGL.DynamicLayout.layoutUpdate.call(that, msg.data);
		that.iterTime = msg.data.iterTime;
		
		if (!that.renderingStarted) {
			that.renderingStarted = true;
			that.animate();
		}
	};
		
	this.layoutWorker.onerror = function(event) {
	    console.log(event.message + " (" + event.filename + ":" + event.lineno + ")");
	};
}

GraphGL.DynamicLayout.layoutUpdate = function(data) {
	// console.log("Layout update: ", data);
	// return;

	var mx = this.options.width - 100;
	var my = this.options.height - 100;
	
	// console.log(data);
	var boundingBox = data.boundingBox;
	var x, y;
	
	var i = data._keys.length;
	// console.log(this.NodeSystem);
	while(i--) {
		var key = data._keys[i];
		var node = data._data[key];
		// console.log(key, node);
		// break;
		x = node.nodeData.x / (boundingBox.topRight.x - boundingBox.bottomLeft.x) * mx;
		y = node.nodeData.y / (boundingBox.topRight.y - boundingBox.bottomLeft.y) * my;
		
		// this.graph.nodes[key].data.x = x;
		// this.graph.nodes[key].data.y = y;

		// original node data
		var onode = this.Nodes.nodes[key];
		// this.Nodes.geometry.vertices[onode.vertice] = new THREE.Vector3(x, y, 0);
		onode.position.x = x;
		onode.position.y = y;
		
		// console.log(onode.position.x, onode.position.y);
		// console.log(this.NodeSystem.geometry.vertices[onode.vertice]);
		this.NodeSystem.geometry.vertices[onode.vertice].position = new THREE.Vector3(x, y, 0);
		// this.Nodes.nodes[key].position.z = 1;
		// if(this.firstFrame) {
		// 	var scale = Math.max(5, 20*node.degree/data.maxDegree);
		// 	// this.graph.nodes[key].scale = new THREE.Vector3(scale, scale, scale);
		// }
	}
	this.NodeSystem.geometry.__dirtyVertices = true;

	// console.log(this.NodeSystem);
	this.firstFrame = false;
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
		colorVector = this.hexColorToRGB(this.options.nodes.color);
	}
	
	// this.node_material.uniforms = {
	// 	color: {
	// 		type: 'v3',
	// 		value: colorVector
	// 	}
	// };
	// console.log(this.nodeAttributes);
	// this.nodeAttributes.nodeColor.value.push(colorVector);
	// 
	// var node = new THREE.Mesh(
	// 	this.node_geometry, 
	// 	new THREE.MeshShaderMaterial({
	// 		uniforms: {
	// 			color: {
	// 				type: "v3",
	// 				value: colorVector
	// 			} 
	// 		},
	// 		vertexShader: $("#node-vertexShader").text(),
	// 		fragmentShader: $("#node-fragmentShader").text()
	// }));
	// var data = data.data;
	var d = data.data;
	this.Nodes.vertices.push(new THREE.Vertex(new THREE.Vector3()));
	this.Nodes.nodes[data.id] = {
		data: d,
		position: new THREE.Vector3(),
		vertice: this.Nodes.vertices.length - 1
	};
	
	// console.log(this.Nodes.nodes[data.id]);
		
	return this.Nodes.nodes[data.id];
	
	// node.renderDepth = 1;
	// node.dynamic = true;
	
	// node.position.x = 0;
	// node.position.y = 0;
	// should be returned by engine?
	// node.scale = new THREE.Vector3(
	// 	this.options.nodes.scale, 
	// 	this.options.nodes.scale, 
	// 	this.options.nodes.scale
	// );
	
	// node.matrixAutoUpdate = false;
	// this.scene.addChild(node);
	// node.data = data;
	
	// return node;
	
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
	// console.log("iter: ", this.iterTime, "frame: ", new_render - this.last_render);
	
	
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
	
	
	// var edges = this.connectedEdges.edges;
	// var i = edges.length;
	// while(i--) {
	// 	var src = edges[i].source;
	// 	var trg = edges[i].target;
	// 	
	// 	var nsrc = this.graph.nodes[src];
	// 	var ntrg = this.graph.nodes[trg];
	// 	
	// 	// console.log(nsrc, ntrg);
	// 	var isrc = i*2;
	// 	var itrg = i*2+1;
	// 	
	// 	this.connectedEdges.geometry.vertices[isrc].position = nsrc.position;
	// 	this.connectedEdges.geometry.vertices[itrg].position = ntrg.position;
	// 		
	// 	this.connectedEdges.geometry.__dirtyVertices = true;
	// 	
	// }
	
	// console.log(this.connectedEdges);
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
			// TODO: maybe data a bit more general?
			for(var n in data.nodes) {
				that.graph.nodes[n] = that.graph.node.call(that, {
					id: n,
					data: data.nodes[n]
				});
			}
			
			// console.log(that.Nodes);
			that.NodeSystem = new THREE.ParticleSystem(that.Nodes, that.NodeShader);
			that.NodeSystem.dynamic = true;
			
			that.scene.addObject(that.NodeSystem);
			
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

GraphGL.prototype.stop = function() {
	this.layoutWorker.terminate();
}

GraphGL.prototype.initialize = function() {
	// After initial data has been loaded and models built, we can start calculating layout and rendering
	console.log("initialize");
		
	this.options.layoutType.call(this);
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