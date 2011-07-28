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

// Fast data structures: http://blog.jcoglan.com/2010/10/18/i-am-a-fast-loop/
Table = function() {
	this._keys = [];
	this._data = {};
};
 
Table.prototype.put = function(key, value) {
	if (!this._data.hasOwnProperty(key)) this._keys.push(key);
	this._data[key] = value;
};
 
Table.prototype.forEach = function(block, context) {
	var keys = this._keys,
		data = this._data,
		i = keys.length,
		key;
 
	while (i--) {
		key = keys[i];
		block.call(context, key, data[key]);
	}
};

SortedTable = function() {
	Table.call(this);
};
SortedTable.prototype = new Table();
 
SortedTable.prototype.put = function(key, value) {
	if (!this._data.hasOwnProperty(key)) {
		var index = this._indexOf(key);
		this._keys.splice(index, 0, key);
	}
	this._data[key] = value;
};

SortedTable.prototype.get = function(key) {
	if (!this._data.hasOwnProperty(key)) return;
	return this._data[key];
}
 
SortedTable.prototype.remove = function(key) {
	if (!this._data.hasOwnProperty(key)) return;
	delete this._data[key];
	var index = this._indexOf(key);
	this._keys.splice(index, 1);
};
 
SortedTable.prototype._indexOf = function(key) {
	var keys = this._keys,
		n = keys.length,
		i = 0,
		d = n;
 
	if (n === 0) return 0;
	if (key < keys[0]) return 0;
	if (key > keys[n-1]) return n;
 
	while (key !== keys[i] && d > 0.5) {
		d = d / 2;
		i += (key > keys[i] ? 1 : -1) * Math.round(d);
		if (key > keys[i-1] && key < keys[i]) d = 0;
	}
	return i;
};


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
	this.layoutWorker;
	
	this.events = {};
	this.renderingStarted = false;
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
				// console.log(n, data.nodes[n]);
		
				that.graph.nodes[n] = that.graph.node.call(that, {
					id: n,
					label: data.nodes[n]
				});
			}
			
			for(var e in data.edges) {
				var edge = data.edges[e];
				that.graph.edges[e] = that.graph.arcEdge.call(that, edge.source, edge.target);
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
	// this.layoutWorker = new Worker(this.options.layout);
	// 	this.layoutWorker.postMessage(function() {
	// 			return that.options.layoutSend.call(that);
	// 	}());
	// 
	// 	this.layoutWorker.onmessage = function(msg) {
	// 		that.options.layoutUpdate.call(that, msg.data);
	// 		
	// 		if (!that.renderingStarted) {
	// 			console.log("got back data");
	// 			that.renderingStarted = true;
	// 			that.animate();
	// 		}
	// 	};
	// 	
	// 	this.layoutWorker.onerror = function(event) {
	// 	    console.log(event.message + " (" + event.filename + ":" + event.lineno + ")");
	// 	};
	
	var hgraph = new HGraph();
	hgraph.nodes = new SortedTable();
	
	// console.log(hgraph);
	for(var n in this.graphData.nodes) {
		// console.log(this.graphData.nodes);
		var node = {
			id: n,
			data: this.graphData.nodes[n],
			edges: [],
			degree: 0,
			nodeData: new Vector(n/10000, n/5000, false),
			layoutData: {
				dx: 0,
				dy: 0,
				old_dx: 0,
				old_dy: 0,
				freeze: 0
			}
		};
		hgraph.nodes.put(n, node);
	}
	
	var i = this.graphData.edges.length;
	hgraph.edges = [];
	while(i--) {
		var e = this.graphData.edges[i];
		e.weight = 1;
		hgraph.edges.push(e);
	}
	
	var pfa = new ParallelForceAtlas(hgraph);
	pfa.iter();
	
	return this;
}

function HGraph() {}
// HGraph.prototype.nodes = new SortedTable();
// HGraph.prototype.edges = [];
// HGraph.prototype.node = {};

function ParallelForceAtlas(graphData) {
	
	this.inertia = 0.1;
	this.repulsionStrength = 200;
	this.attractionStrength = 10;
	this.maxDisplacement = 10;
	this.freezeBalance = true;
	this.freezeStrength = 80;
	this.freezeInertia = 0.2;
	this.gravity = 30;
	this.speed = 1;
	this.cooling = 1;
	this.outboundAttractionDistribution = false;
	this.adjustSizes = false;
	this.timeInterval;
	this.runParallel = true;
	this.nbThreads = 2; // number of cores
	
	// console.log(graphData);
	
	this.nodes = graphData.nodes;
	this.edges = graphData.edges;
	
	var i = this.edges.length;
	while(i--) {
		this.nodes.get(this.edges[i].source).edges.push(this.edges[i].target);
		this.nodes.get(this.edges[i].source).degree += 1;
	}
	
	// undirected graph - need to add +1 for degree for those that aren't pointing back. check data exporter!
	// this.nodes.forEach(function(key, obj) {
	// 	var i = obj.edges.length;
	// 	
	// });
};

/* Vector utilities */
function Vector(x, y, fixed) {
	this.x = x;
	this.y = y;
	this.fixed = fixed;
}

Vector.prototype.add = function(v) {
	this.x += v.x;
	this.y += v.y;
}

Vector.prototype.multiply = function(n) {
	this.x *= n;
	this.y *= n;
}

Vector.prototype.substract = function(v) {
	this.x -= v.x;
	this.y -= v.y;
}

Vector.prototype.getEnergy = function() {
	return Math.pow(this.x, 2) + Math.pow(this.y, 2);
}

Vector.prototype.getNorm = function() {
	return Math.sqrt(this.getEnergy());
}

Vector.prototype.normalize = function() {
	var norm = this.getNorm();
	return Vector(this.x / norm, this.y / n);
}

/* Extend Math */
Math.hypot = function(v1, v2) {
	// Since Javascript is stupid regarding numbers, we implement it (by wikipedia: http://en.wikipedia.org/wiki/Hypot)
	
	var x = v1.x - v2.x;
	var y = v1.y - v2.y;
	if (Math.abs(x) < Math.abs(y)) {
		var ox = x; //old x
		x = y;
		y = ox;
	}
	return Math.abs(x) * Math.sqrt(1 + Math.pow(y/x, 2));
}

/* Force utilities */
function ForceVectorUtils() {}
ForceVectorUtils.distance = function(n1, n2) {
	return Math.hypot(n1.nodeData, n2.nodeData);
}

ForceVectorUtils.repulsion = function(c, dist) {
	return 0.001 * c / dist;
}

ForceVectorUtils.attraction = function(c, dist) {
	return 0.01 * -c * dist;
}

ForceVectorUtils.fcBiRepulsor = function(n1, n2, c) {
	var xDist = n1.nodeData.x - n2.nodeData.x;
	var yDist = n1.nodeData.y - n2.nodeData.y;
	var dist = Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
	
	if (dist > 0) {
		var f = this.repulsion(c, dist);
		
		n1.layoutData.dx += xDist / dist * f;
		n1.layoutData.dy += yDist / dist * f;
		
		n2.layoutData.dx -= xDist / dist * f;
		n2.layoutData.dy -= yDist / dist * f;
	}
}

ForceVectorUtils.fcBiAttractor = function(n1, n2, c) {
	var xDist = n1.nodeData.x - n2.nodeData.x;
	var yDist = n1.nodeData.y - n2.nodeData.y;
	var dist = Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));

	if (dist > 0) {
		f = this.attraction(c, dist);
		
		n1.layoutData.dx += xDist / dist * f;
		n1.layoutData.dy += yDist / dist * f;
		
		n2.layoutData.dx -= xDist / dist * f;
		n2.layoutData.dy -= yDist / dist * f;		
	}
}

/* Iteration loop */
ParallelForceAtlas.prototype.iter = function() {
	this.timeInterval = 100;
	var that = this;
	
	var start = Date.now();
	
	// console.log(this.nodes);
	this.nodes.forEach(function(key, obj){
		// console.log("data: ", key, value);
		obj.layoutData.old_dx = obj.layoutData.dx;
		obj.layoutData.old_dy = obj.layoutData.dy;
		
		obj.layoutData.dx *= this.inertia;
		obj.layoutData.dy *= this.inertia;
	});
	
	// Repulsion
	if (this.adjustSizes) {
		// use fcbirepulsor no collide
	} else {
		// use fcbi repulsor
		that.nodes.forEach(function(key1, node1){
			that.nodes.forEach(function(key2, node2){
				// console.log(key1, key2);
				ForceVectorUtils.fcBiRepulsor(node1, node2, that.repulsionStrength * (1 + node1.degree) * (1 + node2.degree));
			});
		});
	};
	
	// Attraction
	if (this.adjustSizes) {
		// use fcbiattractor no collide
	} else {
		if (this.outboundAttractionDistribution) {
			// bze, default false
		} else {
			var i = this.edges.lenght;
			while(i--) {
				var e = this.edges[i];
				var ns = this.nodes.get(e.source);
				var nt = this.nodes.get(e.target);
				
				var bonus = (ns.nodeData.fixed || ns.nodeData.fixed) ? 100 : 1;
				// TODO: should support time interval!!
				bonus *= e.weight;
				ForceVectorUtils.fcBiAttractor(ns, nt, bonus * this.attractionStrength);
			}
		}
	}
	
	// Gravity
	that.nodes.forEach(function(key, node){
		var nx = node.nodeData.x;
		var ny = node.nodeData.y;
		var d = 0.0001 + Math.sqrt(nx * nx + ny * ny);
		var gf = 0.0001 * that.gravity * d;
		
		node.layoutData.dx -= gf * nx / d;
		node.layoutData.dy -= gf * ny / d;
	});
	
	// Speed
	if (this.freezeBalance) {
		that.nodes.forEach(function(key, node){
			node.dx *= this.speed * 10;
			node.dy *= this.speed * 10;
		});
	} else {
		that.nodes.forEach(function(key, node){
			node.dx *= this.speed;
			node.dy *= this.speed;
		});
	}
	
	// Apply forces
	that.nodes.forEach(function(key, node){
		var nData = node.nodeData;
		var layData = node.layoutData;
		
		if(!nData.fixed) {
			d = 0.0001 + Math.sqrt(layData.dx * layData.dx + layData.dy * layData.dy);
			var ratio;
			
			if(that.freezeBalance) {
				layData.freeze = that.freezeInertia * layData.freeze + (1 - that.freezeInertia) * 0.1 * that.freezeStrength * (Math.sqrt(Math.sqrt((layData.old_dx - layData.dx) * (layData.old_dx - layData.dx) + (layData.old_dy - layData.dy) * (layData.old_dy - layData.dy))));
				ratio = Math.min((d / (d * (1 + layData.freeze))), this.maxDisplacement / d);
			} else {
				ratio = Math.min(1, this.maxDisplacement / d);
			}
			
			layData.dx *= ratio / this.cooling;
			layData.dy *= ratio / this.cooling;
			nData.x = nData.x + layData.dx;
			nData.y = nData.y + layData.dy;
		}
	});

	
	console.log(this.nodes);
	var endall = Date.now();
	
	console.log("ParallelForceAtlas execution time: ", (endall-start)/1000);
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