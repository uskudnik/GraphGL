/* Quick & dirty debug helpers */
function console() {};
console.log = function(msg) {
	var log = {
		log: msg,
		type: "log"
	}
	postMessage(log);
};

console.nodes = function(graph) {
	graph.nodes.forEach(function(key, node){
		console.log(node.layoutData);
	});
}

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

function ParallelForceAtlas(graphData) {
	// not parallel quite yet...
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
	
	this.nodes.maxDegree = 0;	
	var that = this;
	
	this.nodes.forEach(function(key, node){
		// console.log("data: ", key, value);
		node.layoutData.old_dx = node.layoutData.dx;
		node.layoutData.old_dy = node.layoutData.dy;
		
		node.layoutData.dx *= that.inertia;
		node.layoutData.dy *= that.inertia;
		
		if (node.degree > that.nodes.maxDegree) {
			that.nodes.maxDegree = node.degree;
		}
	});
};

/* Iteration loop */
ParallelForceAtlas.prototype.iter = function() {
	this.timeInterval = 100;
	var that = this;
	
	var start = Date.now();
	
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
			node.layoutData.dx *= that.speed * 10;
			node.layoutData.dy *= that.speed * 10;
		});
	} else {
		that.nodes.forEach(function(key, node){
			node.layoutData.dx *= that.speed;
			node.layoutData.dy *= that.speed;
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
				ratio = Math.min((d / (d * (1 + layData.freeze))), that.maxDisplacement / d);
			} else {
				ratio = Math.min(1, that.maxDisplacement / d);
			}
			
			layData.dx *= ratio / that.cooling;
			layData.dy *= ratio / that.cooling;
			nData.x = nData.x + layData.dx;
			nData.y = nData.y + layData.dy;
		}
	});
	
	// Calculate bounding box
	var maxbl = {x: 0, y: 0}; // bottom left
	var maxtr = {x: 0, y: 0}; // top right
	that.nodes.forEach(function(key, node){
		if (node.nodeData.x < maxbl.x) {
			maxbl.x = node.nodeData.x;
		} else if (node.nodeData.x > maxtr.x) {
			maxtr.x = node.nodeData.x;
		}
		
		if (node.nodeData.y < maxbl.y) {
			maxbl.y = node.nodeData.y;
		} else if (node.nodeData.y > maxtr.y) {
			maxtr.y = node.nodeData.y;
		}
	});
	
	graph.nodes.boundingBox = {
		bottomLeft: maxbl,
		topRight: maxtr
	};
	
	// console.log(this.nodes);
	var endall = Date.now();
	
	graph.nodes.iterTime = (endall-start);
	// console.log("ParallelForceAtlas execution time per iteration: "+(endall-start)/1000);
	
	postMessage(graph.nodes);
}

function Graph() {}

var graph = new Graph();
graph.nodes = new SortedTable();
graph.edges = [];


onmessage = function(msg) {
	// Initialize internal graph and start doin' magik
	
	var nodes = msg.data.nodes;
	var edges = msg.data.edges;
	
	// nodeData: new Vector(parseInt(n, 10)/10000, parseInt(n, 10)/5000, false),
	for(var n in nodes) {
		var node = {
			id: n,
			data: nodes[n],
			edges: [],
			degree: 0,
			nodeData: new Vector(Math.random(), Math.random(), false),
			layoutData: {
				dx: Math.random(),
				dy: Math.random(),
				old_dx: Math.random(),
				old_dy: Math.random(),
				freeze: 0
			}
		};
		graph.nodes.put(n, node);
	}
	
	var i = edges.length;
	while(i--) {
		var e = edges[i];
		e.weight = 1;
		graph.edges.push(e);
	}
	
	var pfa = new ParallelForceAtlas(graph);
	var i = 10000;
	while(i--) {
		pfa.iter();
	};
	close();
}