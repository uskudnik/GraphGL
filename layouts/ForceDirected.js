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
function Vector(x, y) {
	this.x = x;
	this.y = y;
}

Vector.prototype.addSelf = function(v) {
	this.x += v.x;
	this.y += v.y;
}

Vector.prototype.add = function(v) {
	return new Vector(this.x + v.x,	this.y + v.y);
}

Vector.prototype.multiplySelf = function(n) {
	this.x *= n;
	this.y *= n;
}

Vector.prototype.divideSelf = function(n) {
	this.x = this.x / n || 0;
	this.y = this.y / n || 0;
}

Vector.prototype.substractSelf = function(v) {
	this.x -= v.x;
	this.y -= v.y;
}

Vector.prototype.substract = function(v) {
	return new Vector(this.x - v.x, this.y - v.y);
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

function Graph() {}

var graph = new Graph();
// graph.nodes = new SortedTable();
graph.nodes = {};
graph.edges = [];

function ForceDirected(graphData) {
	
}

ForceDirected.prototype.iter = function() {
	var that = this;
	// console.log(graph);
	
	var v, u, e;
	
	// Repulsive forces
	for (var nid in graph.nodes) {
		v = graph.nodes[nid];
		v.disp = new Vector(0, 0);
		
		for(var mid in graph.nodes) {
			u = graph.nodes[mid];
			if (nid != mid) {
				var delta = v.pos.substract(u.pos);
				var dnorm = delta.getNorm();
				delta.multiplySelf( fr(dnorm));
				delta.divideSelf( dnorm );
				v.disp.addSelf(delta)
			}
		}
	}
	
	for (var eid in graph.edges) {
		e = graph.edges[eid];
		var delta = e.v.pos.substract( e.u.pos );
		var dnorm = delta.getNorm();
		delta.multiplySelf( fa(dnorm));
		delta.divideSelf( dnorm);
		
		e.v.disp.substractSelf( delta );
		e.u.disp.addSelf( delta );
	}
	
	for(var nid in graph.nodes) {
		v = graph.nodes[nid];
		var vd = new Vector(v.disp.x, v.disp.y);
		vd.divideSelf( vd.getNorm() );
		
		// vd.x = Math.min(v.disp.x, t);
		// vd.y = Math.min(v.disp.y, t);
		// console.log( vd );
		
		v.pos.addSelf( vd );
		// console.log(v.pos);
		v.pos.x = Math.min( options.width, Math.max( -options.width, v.pos.x ) )
		v.pos.y = Math.min( options.height, Math.max( -options.height, v.pos.y ) )
		// console.log(v.pos);
		
	}
	t = t / iiteration;
	
	// console.log(t);
	if (iiteration % 10 == 0) {
		updateGraphGL()
	}
}

var area, k, t, iiteration = 1, options;

function fa(x) {return Math.pow(x, 2) / k; };
function fr(x) {return Math.pow(k, 2) / x; };

function updateGraphGL() {
	outdata = {}
	outdata.nodes = {}
	var bbmaxx=0, bbmaxy=0, bbminx=0, bbminy=0; 
	for(var nid in graph.nodes) {
		node = graph.nodes[nid];
		outdata.nodes[nid] = {
			x: node.pos.x,
			y: node.pos.y
		};
		bbmaxx = Math.max(bbmaxx, node.pos.x);
		bbmaxy = Math.max(bbmaxy, node.pos.y);
		
		bbminx = Math.min(bbminx, node.pos.x);
		bbminy = Math.min(bbminy, node.pos.y);
	}
	outdata.boundingBox = {
		maxx: bbmaxx,
		maxy: bbmaxy,
		minx: bbminx,
		miny: bbminy
	}
	// console.log(outnodes);
	postMessage(outdata)
}

onmessage = function(msg) {
	// Initialize internal graph and start doin' magik
	var nodes = msg.data.nodes;
	var edges = msg.data.edges;
	options = msg.data.algorithmOptions;
	
	console.log('startdata');
	console.log(nodes);
	
	// nodeData: new Vector(parseInt(n, 10)/10000, parseInt(n, 10)/5000, false),
	nodeslen = 0;
	for(var n in nodes) {
		// console.log(this.graphData.nodes);
		var node = {
			id: n,
			pos: new Vector(Math.random(), Math.random()),
			disp: new Vector(0, 0),
		};
		graph.nodes[n] = node;
		nodeslen += 1;
	}
	
	area = options.width * options.height;
	k = Math.sqrt(area / nodeslen);
	t = options.width / 10;

	graph.edges = edges;
	for (var eid in graph.edges) {
		e = graph.edges[eid];
		e.v = graph.nodes[e.source];
		e.u = graph.nodes[e.target];	
	}
	
	var fd = new ForceDirected(graph);
	var i = 2000;
	while(i--) {
		fd.iter();
		iiteration += 1;
	};
	console.log("finished iterating");
	close();
}