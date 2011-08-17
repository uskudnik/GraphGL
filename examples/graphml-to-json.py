from xml.etree.ElementTree import ElementTree
import json

tree = ElementTree()
tree.parse(file("random.graphml", "r"))

# tree.find("{http://graphml.graphdrawing.org/xmlns}graph/{http://graphml.graphdrawing.org/xmlns}node")

graphml = {
	"graph": "{http://graphml.graphdrawing.org/xmlns}graph",
	"node": "{http://graphml.graphdrawing.org/xmlns}node",
	"edge": "{http://graphml.graphdrawing.org/xmlns}edge",
	"data": "{http://graphml.graphdrawing.org/xmlns}data",
	"label": "{http://graphml.graphdrawing.org/xmlns}data[@key='label']",
	"x": "{http://graphml.graphdrawing.org/xmlns}data[@key='x']",
	"y": "{http://graphml.graphdrawing.org/xmlns}data[@key='y']",
	"size": "{http://graphml.graphdrawing.org/xmlns}data[@key='size']",
	"r": "{http://graphml.graphdrawing.org/xmlns}data[@key='r']",
	"g": "{http://graphml.graphdrawing.org/xmlns}data[@key='g']",
	"b": "{http://graphml.graphdrawing.org/xmlns}data[@key='b']",
	"weight": "{http://graphml.graphdrawing.org/xmlns}data[@key='weight']",
	"edgeid": "{http://graphml.graphdrawing.org/xmlns}data[@key='edgeid']"
}

# print dir(graphml)
graph = tree.find(graphml.get("graph"))
nodes = graph.findall(graphml.get("node"))
edges = graph.findall(graphml.get("edge"))

out = {"nodes":{}, "edges":[]}

print "Nodes: ", len(nodes)
print "Edges: ", len(edges)
for node in nodes[:]:
	# data = node.findall(graphml.get("data"))
	# print node.find().text
	out["nodes"][node.get("id")] = {
		"label": node.find(graphml.get("label")).text,
		"size": float(node.find(graphml.get("size")).text),
		"r": node.find(graphml.get("r")).text,
		"g": node.find(graphml.get("g")).text,
		"b": node.find(graphml.get("b")).text,
		"x": float(node.find(graphml.get("x")).text),
		"y": float(node.find(graphml.get("y")).text)
	}

for edge in edges[:]:
	if edge.find(graphml.get("edgeid")) is not None:
		edgeid = int(edge.find(graphml.get("edgeid")).text)
	else:
		edgeid = None
	out["edges"].append({"source": edge.get("source"),
						 "target": edge.get("target"),
						 "edgeid": edgeid,
						 "weight": float(edge.find(graphml.get("weight")).text)
						})

file("random.json", "w").write(json.dumps(out))