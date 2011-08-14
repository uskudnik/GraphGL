/* Quick & dirty debug helpers */
function console() {};
console.log = function(msg) {
	var log = {
		log: msg,
		type: "log"
	};
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
function Vector(args) {
	this.x = args.x;
	this.y = args.y;
	this.size = args.size;
	this.fixed = args.fixed;
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
function ForceFactory() {}
ForceFactory.RepulsionForce = function(adjustBySize, coefficient) {
	this.coefficient = coefficient;
	
	if (adjustBySize) {
		return new this.RepulsionForce.linRepulsion_antiCollision(coefficient);
	} else {
		return new this.RepulsionForce.linRepulsion(coefficient);
	}
}

ForceFactory.RepulsionForce.linRepulsion = function(coefficient) {
	this.coefficient = coefficient;
}

ForceFactory.RepulsionForce.linRepulsion_antiCollision = function(coefficient) {
	this.coefficient = coefficient;
}

ForceFactory.RepulsionForce.linRepulsion.apply = function(entity1, entity2) {
	if (entity2 instanceof Node) {
		this.RepulsionForce.linRepulsion.apply_node(entity1, entity2);
	} else if (entity2 instanceof Region) {
		this.RepulsionForce.linRepulsion.apply_region(entity1, entity2);
	} else if (entity2 instanceof Number) {
		this.RepulsionForce.linRepulsion.apply_gravity(entity1, entity2);
	}
}

ForceFactory.RepulsionForce.linRepulsion.apply_node = function(node1, node2) {
	var n1Data = node1.nodeData;
	var n1Layout = node1.layoutData;
	var n2Data = node2.nodeData2;
	var n2Layout = node2.layoutData;
	
	var xDist = n1Data.x - n2Data.x;
	var yDist = n1Data.y - n2Data.y;
	var distance = Math.Sqrt(xDist*xDist + yDist*yDist);
	
	if (distance > 0) {
		// factor = force / distance
		var factor = this.coefficient * (n1Layout.mass * n2Layout.mass) / (distance * distance); 
		n1Layout.dx += xDist * factor;
		n1Layout.dy += yDist * factor;
		
		n2Layout.dx -= xDist * factor;
		n2Layout.dy -= yDist * factor;
	}
};

ForceFactory.RepulsionForce.linRepulsion.apply_region = function(node, region) {
	var nData = node.nodeData;
	var nLayout = node.layoutData;
	
	var xDist = nData.x - region.massCenterX;
	var yDist = nData.y - region.massCenterY;
	var distance = Math.sqrt(xDist * xDist + yDist * yDist);
	
	if (distance > 0) {
		var factor = this.coefficient * nLayout.mass * region.mass / (distance * distance);
		
		nLayout.dx += xDist * factor;
		nLayout.dy += yDist * factor;
	}
}

ForceFactory.RepulsionForce.linRepulsion.apply_gravity = function(node, g) {
	var nData = node.nodeData;
	var nLayout = node.layoutData;
	
	var xDist = nData.x;
	var yDist = nData.y;
	var distance = Math.sqrt(xDist*xDist + yDist*yDist);
	
	if (distance > 0) {
		var factor = this.coefficient * nLayout.mass * g / distance;
		
		nLayout.dx -= xDist * factor;
		nLayout.dy -= yDist * factor;
	}
}

ForceFactory.RepulsionForce.linRepulsion_antiCollision.apply = function(entity1, entity2) {
	if (entity2 instanceof Node) {
		this.RepulsionForce.linRepulsion_antiCollision.apply_node(entity1, entity2);
	} else if (entity2 instanceof Region) {
		this.RepulsionForce.linRepulsion_antiCollision.apply_region(entity1, entity2);
	} else if (entity2 instanceof Number) {
		this.RepulsionForce.linRepulsion_antiCollision.apply_gravity(entity1, entity2);
	}
}

ForceFactory.RepulsionForce.linRepulsion_antiCollision.apply_node = function(node1, node2) {
	var n1Data = node1.nodeData;
	var n1Layout = node1.layoutData;
	var n2Data = node2.nodeData2;
	var n2Layout = node2.layoutData;
	
	var xDist = n1Data.x - n2Data.x;
	var yDist = n1Data.y - n2Data.y;
	var distance = Math.Sqrt(xDist*xDist + yDist*yDist);
	
	if (distance > 0) {
		// factor = force / distance
		var factor = this.coefficient * (n1Layout.mass * n2Layout.mass) / (distance * distance); 
		n1Layout.dx += xDist * factor;
		n1Layout.dy += yDist * factor;
		
		n2Layout.dx -= xDist * factor;
		n2Layout.dy -= yDist * factor;
	} else if (distance < 0) {
		var factor = 100 * this.coefficient * (n1Layout.mass * n2Layout.mass); 
		n1Layout.dx += xDist * factor;
		n1Layout.dy += yDist * factor;
		
		n2Layout.dx -= xDist * factor;
		n2Layout.dy -= yDist * factor;
	}
}

ForceFactory.RepulsionForce.linRepulsion_antiCollision.apply_region = function(node, region) {
	var nData = node.nodeData;
	var nLayout = node.layoutData;

	var xDist = nData.x - region.massCenterX;
	var yDist = nData.y - region.massCenterY;
	var distance = Math.sqrt(xDist * xDist + yDist * yDist);

	if (distance > 0) {
		var factor = this.coefficient * nLayout.mass * region.mass / (distance * distance);

		nLayout.dx += xDist * factor;
		nLayout.dy += yDist * factor;
	} else if (distance < 0) {
		var factor = -this.coefficient * nLayout.mass * region.mass / distance;
		
		nLayout.dx += xDist * factor;
		nLayout.dy += yDist * factor;
	}
}

ForceFactory.RepulsionForce.linRepulsion_antiCollision.apply_gravity = function(node, g) {
	var nData = node.nodeData;
	var nLayout = node.layoutData;
	
	var xDist = nData.x;
	var yDist = nData.y;
	var distance = Math.sqrt(xDist*xDist + yDist*yDist);
	
	if (distance > 0) {
		var factor = this.coefficient * nLayout.mass * g / distance;
		
		nLayout.dx -= xDist * factor;
		nLayout.dy -= yDist * factor;
	}
}

ForceFactory.AttractionForce = function(logAttraction, distributedAttraction, adjustBySize, coefficient) {
	if (adjustBySize) {
		if (logAttraction) {
			if (distributedAttraction) {
				this.AttractionForce.logAttraction_degreeDistributed_antiCollision(coefficient);
			} else {
				this.AttractionForce.logAttraction_antiCollision(coefficient);
			}
		} else {
			if (distributedAttraction) {
                this.AttractionForce.linAttraction_degreeDistributed_antiCollision(coefficient);
            } else {
                this.AttractionForce.linAttraction_antiCollision(coefficient);
            }
		}
	} else 	{
		if (logAttraction) {
			if (distributedAttraction) {
				this.AttractionForce.logAttraction_degreeDistributed(coefficient);
			} else {
				this.AttractionForce.logAttraction(coefficient);
			}
		} else {
			if (distributedAttraction) {	
				this.AttractionForce.linAttraction_massDistributed(coefficient);
			} else {
				this.AttractionForce.linAttraction(coefficient);
			}
		}
	}
}

ForceFactory.AttractionForce.linAttraction = function(coefficient) {
	this.coefficient = coefficient;
} 


ForceFactory.AttractionForce.linAttraction.apply = function(node1, node2, e) {
	// e is edge weight
	var n1Data = node1.nodeData;
	var n1Layout = node1.layoutData;
	var n2Data = node2.nodeData2;
	var n2Layout = node2.layoutData;
	
	var xDist = n1Data.x - n2Data.x;
	var yDist = n1Data.y - n2Data.y;
	
	var factor = -this.coefficient * e;
	n1Layout.dx += xDist * factor;
	n1Layout.dy += yDist * factor;
	
	n2Layout.dx -= xDist * factor;
	n2Layout.dy -= yDist * factor;
}

ForceFactory.AttractionForce.linAttraction_massDistributed = function(coefficient) {
	this.coefficient = coefficient;
}

ForceFactory.AttractionForce.linAttraction_massDistributed.apply = function(node1, node2, e) {
	var n1Data = node1.nodeData;
	var n1Layout = node1.layoutData;
	var n2Data = node2.nodeData2;
	var n2Layout = node2.layoutData;
	
	var xDist = n1Data.x - n2Data.x;
	var yDist = n1Data.y - n2Data.y;
	
	var factor = -this.coefficient * e / n1Layout.mass;
	
	n1Layout.dx += xDist * factor;
	n1Layout.dy += yDist * factor;
	
	n2Layout.dx -= xDist * factor;
	n2Layout.dy -= yDist * factor;
}

ForceFactory.AttractionForce.logAttraction = function(coefficient) {
	this.coefficient = coefficient;
}

ForceFactory.AttractionForce.logAttraction.apply = function(node1, node2, e) {
	var n1Data = node1.nodeData;
	var n1Layout = node1.layoutData;
	var n2Data = node2.nodeData2;
	var n2Layout = node2.layoutData;
	
	var xDist = n1Data.x - n2Data.x;
	var yDist = n1Data.y - n2Data.y;
	var distance = Math.sqrt(xDist*xDist + yDist*yDist);
	
	if (distance > 0) {
		var factor = -this.coefficient * e * Math.log(1 + distance) / distance;

		n1Layout.dx += xDist * factor;
		n1Layout.dy += yDist * factor;

		n2Layout.dx -= xDist * factor;
		n2Layout.dy -= yDist * factor;
	}
}

ForceFactory.AttractionForce.logAttraction_degreeDistributed = function(coefficient) {
	this.coefficient = coefficient;
}

ForceFactory.AttractionForce.logAttraction_degreeDistributed.apply = function(node1, node2, e) {
	var n1Data = node1.nodeData;
	var n1Layout = node1.layoutData;
	var n2Data = node2.nodeData2;
	var n2Layout = node2.layoutData;
	
	var xDist = n1Data.x - n2Data.x;
	var yDist = n1Data.y - n2Data.y;
	var distance = Math.sqrt(xDist*xDist + yDist*yDist);
	
	if (distance > 0) {
		var factor = -this.coefficient * e * Math.log(1 + distance) / (distance * n1Layout.mass);

		n1Layout.dx += xDist * factor;
		n1Layout.dy += yDist * factor;

		n2Layout.dx -= xDist * factor;
		n2Layout.dy -= yDist * factor;
	}
}

ForceFactory.AttractionForce.linAttraction_antiCollision = function(coefficient) {
	this.coefficient = coefficient;
}

// TODO: check attribute size!
ForceFactory.AttractionForce.linAttraction_antiCollision.apply = function(node1, node2, e) {
	var n1Data = node1.nodeData;
	var n1Layout = node1.layoutData;
	var n2Data = node2.nodeData2;
	var n2Layout = node2.layoutData;
	
	var xDist = n1Data.x - n2Data.x;
	var yDist = n1Data.y - n2Data.y;
	var distance = Math.sqrt(xDist*xDist + yDist*yDist) - n1Data.size - n2Data.size;
	
	if (distance > 0) {
		var factor = -this.coefficient * e;

		n1Layout.dx += xDist * factor;
		n1Layout.dy += yDist * factor;

		n2Layout.dx -= xDist * factor;
		n2Layout.dy -= yDist * factor;
	}
}

ForceFactory.AttractionForce.linAttraction_degreeDistributed_antiCollision = function(coefficient) {
	this.coefficient = coefficient;
}

ForceFactory.AttractionForce.linAttraction_degreeDistributed_antiCollision.apply = function(node1, node2) {
	var n1Data = node1.nodeData;
	var n1Layout = node1.layoutData;
	var n2Data = node2.nodeData2;
	var n2Layout = node2.layoutData;
	
	var xDist = n1Data.x - n2Data.x;
	var yDist = n1Data.y - n2Data.y;
	var distance = Math.sqrt(xDist*xDist + yDist*yDist) - n1Data.size - n2Data.size;
	
	if (distance > 0) {
		var factor = -this.coefficient * e / n1Layout.mass;

		n1Layout.dx += xDist * factor;
		n1Layout.dy += yDist * factor;

		n2Layout.dx -= xDist * factor;
		n2Layout.dy -= yDist * factor;
	}
}

ForceFactory.AttractionForce.logAttraction_antiCollision = function(coefficient) {
	this.coefficient = coefficient;
}

ForceFactory.AttractionForce.logAttraction_antiCollision.apply = function(node1, node2, e) {
	var n1Data = node1.nodeData;
	var n1Layout = node1.layoutData;
	var n2Data = node2.nodeData2;
	var n2Layout = node2.layoutData;
	
	var xDist = n1Data.x - n2Data.x;
	var yDist = n1Data.y - n2Data.y;
	var distance = Math.sqrt(xDist*xDist + yDist*yDist) - n1Data.size - n2Data.size;
	
	if (distance > 0) {
		var factor = -this.coefficient * e * Math.log(1 + distance) / distance;

		n1Layout.dx += xDist * factor;
		n1Layout.dy += yDist * factor;

		n2Layout.dx -= xDist * factor;
		n2Layout.dy -= yDist * factor;
	}
}

ForceFactory.AttractionForce.logAttraction_degreeDistributed_antiCollision = function(coefficient) {
	this.coefficient = coefficient;
}

ForceFactory.AttractionForce.logAttraction_degreeDistributed_antiCollision.apply = function(node1, node2, e) {
	var n1Data = node1.nodeData;
	var n1Layout = node1.layoutData;
	var n2Data = node2.nodeData2;
	var n2Layout = node2.layoutData;
	
	var xDist = n1Data.x - n2Data.x;
	var yDist = n1Data.y - n2Data.y;
	var distance = Math.sqrt(xDist*xDist + yDist*yDist) - n1Data.size - n2Data.size;
	
	if (distance > 0) {
		var factor = -this.coefficient * e * Math.log(1 + distance) / (distance * n1Layout.mass);

		n1Layout.dx += xDist * factor;
		n1Layout.dy += yDist * factor;

		n2Layout.dx -= xDist * factor;
		n2Layout.dy -= yDist * factor;
	}
}

function Region(nodes) {
	// console.log("new region: ");
	// console.log(nodes);
	var that = this;
	
	this.mass = 0;
	this.massCenterX;
	this.massCenterY;
	this.size = 0;
	this.subregions = [];

	this.nodes = nodes;
	
	// this.updateMassAndGeometry();

	if (this.nodes.length > 0) {
		// this.mass = 0;
		var massSumX = 0;
		var massSumY = 0;
	
		var i = this.nodes.length;
		while(i--){
			var node = this.nodes[i];
			var nData = node.nodeData;
			var nLayout = node.layoutData;
			
			this.mass += nLayout.mass;
			massSumX += nData.x * nLayout.mass;
			massSumY += nData.y * nLayout.mass;
		};
		
		this.massCenterX = massSumX / this.mass;
		this.massCenterY = massSumY / this.mass;
		
		// var size = 0;
		var i = this.nodes.length;
		while(i--){
			var node = this.nodes[i];
			var nData = node.nodeData;
			var distance = Math.sqrt((nData.x - this.massCenterX) * (nData.x - this.massCenterX) + (nData.y - this.massCenterY) * (nData.y - this.massCenterY));
			this.size = Math.max(this.size, 2 * distance);
		};
	}
}

Region.prototype.updateMassAndGeometry = function() {
	// console.log(this.nodes);
	if (this.nodes.length > 0) {
		var mass = 0;
		var massSumX = 0;
		var massSumY = 0;
	
		var i = this.nodes.length;
		while(i--){
			var node = this.nodes[i];
			var nData = node.nodeData;
			var nLayout = node.layoutData;
			
			this.mass += nLayout.mass;
			massSumX += nData.x * nLayout.mass;
			massSumY += nData.y * nLayout.mass;
		};
		
		this.massCenterX = massSumX / mass;
		this.massCenterY = massSumY / mass;
		
		// var size = 0;
		var i = this.nodes.length;
		while(i--){
			var node = this.nodes[i];
			var nData = node.nodeData;
			var distance = Math.sqrt((nData.x - this.massCenterX) * (nData.x - this.massCenterX) + (nData.y - this.massCenterY) * (nData.y - this.massCenterY));
			this.size = Math.max(this.size, 2 * distance);
		};
	}
}

Region.prototype.buildSubRegions = function() {
	if (this.nodes.length > 0) {
		var leftNodes = [];
		var rightNodes = [];
		
		// console.log(this.nodes);
		
		var i = this.nodes.length;
		while(i--){
			// var nData = this.nodes[i].nodeData;
			var node = this.nodes[i];
			// console.log(nData);
			var nodesColumn = (node.nodeData.x < this.massCenterX) ? (leftNodes) : (rightNodes);
			nodesColumn.push(node);
		};
		
		// console.log(leftNodes);
		// console.log(rightNodes);
		
		var topleftNodes = [];
		var bottomleftNodes = [];
		
		var i = leftNodes.length;
		while(i--) {
			var node = leftNodes[i];
			var nodesLine = (node.nodeData.y < this.massCenterX) ? topleftNodes : bottomleftNodes;
			nodesLine.push(node);
		}
		
		var bottomrightNodes = [];
		var toprightNodes = [];
		
		var i = rightNodes.length;
		while(i--) {
			var node = rightNodes[i];
			var nodesLine = (node.nodeData.y < this.massCenterY) ? toprightNodes : bottomrightNodes;
			nodesLine.push(node);
		}
		
		if (topleftNodes.length > 0) {
			if (topleftNodes.length < this.nodes.length) {
				var subregion = new Region(topleftNodes);
				this.subregions.push(subregion);
			} else {
				var i = topleftNodes.length;
				while(i--) {
					var subregion = new Region([topleftNodes[i]]);
					this.subregions.push(subregion);
				}
			}
		}
		
		if (bottomleftNodes.length > 0) {
			if (bottomleftNodes.length < this.nodes.length) {
				var subregion = new Region(bottomleftNodes);
				this.subregions.push(subregion);
	        } else {
				var i = bottomleftNodes.length;
				while(i--) {
					var subregion = new Region([bottomleftNodes[i]]);
					this.subregions.push(subregion);
				}
			}
		}
		
		if (bottomrightNodes.length > 0) {
			if (bottomrightNodes.length < this.nodes.length) {
				var subregion = new Region(bottomrightNodes);
				this.subregions.push(subregion);
			} else {
				var i = bottomrightNodes.length;
				while(i--) {
					var subregion = new Region([bottomrightNodes[i]]);
					this.subregions.push(subregion);
				}
			}
		}
		
		if (toprightNodes.length > 0) {
			if (toprightNodes.length < this.nodes.length) {
				var subregion = new Region(toprightNodes);
				this.subregions.push(subregion);
			} else {
				var i = toprightNodes.length;
				while(i--) {
					var subregion = new Region([toprightNodes]);
					this.subregions.push(subregion);
				}
			}
		}
		
		var i = this.subregions.length;
		while(i--) {
			this.subregions[i].buildSubRegions();
		}
		// console.log(this.subregions);
	}
}

function ForceAtlas2(graphData) {
	// this.inertia = 0.1;
	// this.repulsionStrength = 200;
	// this.attractionStrength = 10;
	// this.maxDisplacement = 10;
	// this.freezeBalance = true;
	// this.freezeStrength = 80;
	// this.freezeInertia = 0.2;
	// this.gravity = 30;
	// this.speed = 1;
	// this.cooling = 1;
	// this.outboundAttractionDistribution = false;
	// this.adjustSizes = false;
	// this.timeInterval;
	// this.nbThreads = 2; // number of cores
	this.edgeWeightInfluence;
	this.jitterTolerance;
	this.scalingRatio;
	this.gravity;
	this.speed = 1.0;
	this.outboundAttractionDistribution = true;
	this.adjustSizes = true;
	this.barnesHutOptimize = false; // is it even possible? stack trace issues!
	this.barnesHutTheta;
	this.linLogMode = false;
	
	this.rootRegion;
	
	this.outboundAttCompensation = 1;
	
	// console.log(graphData);
	
	this.nodes = graphData.nodes;
	this.edges = graphData.edges;
	
	// Calculate node degree and add those edges to node for faster access
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
		var layoutData = node.layoutData;
		layoutData.mass = 1 + node.degree;
		layoutData.old_dx = 0;
		layoutData.old_dy = 0;
		
		layoutData.dx = 0;
		layoutData.dy = 0;
		
		if (node.degree > that.nodes.maxDegree) {
			that.nodes.maxDegree = node.degree;
		}
	});
	// console.log(this.nodes);
};

/* Iteration loop */
ForceAtlas2.prototype.iter = function() {
	this.timeInterval = 100;
	var that = this;
	
	this.nodes.forEach(function(key, node){
		var layoutData = node.layoutData;
		layoutData.old_dx = layoutData.dx;
		layoutData.old_dy = layoutData.dy;
		
		layoutData.dx = 0;
		layoutData.dy = 0;
	});
	
	if (this.barnesHutOptimize) {
		var nodes = [];
		this.nodes.forEach(function(key, node){
			nodes.push(node);
		});
		var rootRegion = new Region(nodes);
		rootRegion.buildSubRegions();
	}
	
	if (this.outboundAttractionDistribution) {
		this.outboundAttCompensation = 0;
		this.nodes.forEach(function(key, node){
			this.outboundAttCompensation += node.mass;
		});
		
		this.outboundAttCompensation /= this.nodes._keys.length;
	}
	
	// Repulsion
	
	
	// postMessage(graph.nodes);
}

function Graph() {}

var graph = new Graph();
graph.nodes = new SortedTable();
graph.edges = [];

function Node(args) {
	this.id = args.id;
	this.data = args.data;
	this.edges = [];
	this.degree = 0;
	this.nodeData = args.nodeData;
	this.layoutData = {
		dx: 0,
		dy: 0,
		old_dx: 0,
		old_dy: 0,
		mass: 1
	}
};

onmessage = function(msg) {
	// Initialize internal graph and start doin' magik
	
	var nodes = msg.data.nodes;
	var edges = msg.data.edges;
	
	// nodeData: new Vector(parseInt(n, 10)/10000, parseInt(n, 10)/5000, false),
	for(var n in nodes) {
		// console.log(this.graphData.nodes);
		// var node = {
		// 	id: n,
		// 	data: nodes[n],
		// 	edges: [],
		// 	degree: 0,
		// 	nodeData: new Vector(Math.random(), Math.random(), false),
		// 	layoutData: {
		// 		dx: 0,
		// 		dy: 0,
		// 		old_dx: 0,
		// 		old_dy: 0,
		// 		mass: 1
		// 	}
		// };
		var node = new Node({
			id:n,
			data: nodes[n],
			nodeData: new Vector({
				x: Math.random(), 
				y: Math.random(), 
				size: 10,
				fixed: false
				}),
			layoutData: {
				dx: 0,
				dy: 0,
				old_dx: 0,
				old_dy: 0,
				mass: 1
			}
		});
		graph.nodes.put(n, node);
	}
	
	var i = edges.length;
	while(i--) {
		var e = edges[i];
		e.weight = 1;
		graph.edges.push(e);
	}
	
	var fa2 = new ForceAtlas2(graph);
	fa2.iter();
	close();
}