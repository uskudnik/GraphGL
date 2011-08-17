import json
import random

nodes = 100000
edges = 200000

letters = "abcdefghijklmnoprstuvzq"

out = {"nodes":{}, "edges":[]}

randomletter = lambda: letters[random.randint(0, len(letters)-1)]

for node in range(nodes):
	out["nodes"][str(node)] = {
		"label": str(node) + randomletter() + randomletter() + randomletter() + randomletter(),
		"x": random.gauss(0, 300),
		"y": random.gauss(0, 300),
		"r": random.randint(0, 256),
		"g": random.randint(0, 256),
		"b": random.randint(0, 256),
		"size": abs(random.gauss(5,3))
	}
	
def gettarget(source):
	target = random.randint(0, nodes-1)
	# return (target != source) ? target : gettarget(source)
	return target if target != source else gettarget(source)

def genedge():
	source = random.randint(0, nodes-1)
	target = gettarget(source)
	return {"source": str(source), "target": str(target)}

for edge in range(edges):
	out["edges"].append(genedge())
	
file("n-"+str(nodes)+"-e-"+str(edges)+"-randomset-color.json", "w").write(json.dumps(out))
