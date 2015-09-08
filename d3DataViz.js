var Tally = require('/Schemas/tally.js').tally;

console.log(Tally);

var width = 960,
    height = 500,
    padding = 0.5, // separation between same-color nodes
    clusterPadding = 6, // separation between different-color nodes
    maxRadius = 12;

var n = 200, // total number of nodes
    m = 10; // number of distinct clusters


// need to distinguish color by framework
var color = d3.scale.category10()
    .domain(d3.range(m));

// The largest node for each cluster.
var clusters = new Array(m);

// Need to import data from counter
// d = individual nodes

// first we need to pass the var nodes function to a variable.
// then we will invoke that creator function N times of framework occurences
// each node will have a name property, related to its representative framework
// the representative framework will determine its color given a number 1-10

// loop through the frameworks
// the number of occurences is how many nodes we will make of the same name and color

// Creator function ||||||||
//                  VVVVVVVV
// node needs a framework value to determine its color value
// d3.range runs this function n number of times, adding d/node to an array of nodes
var nodes = d3.range(n).map(function() {
  // determines which cluster/color/framework each node belongs to
  var i = Math.floor(Math.random() * m), // which cluster/color, need to change to framework
      r = 12, // size
      d = {cluster: i, radius: r}; // individual nodes that will be individual bubbles
  if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d;
  return d;
});

// Use the pack layout to initialize node positions.
d3.layout.pack()
    .sort(null)
    .size([width, height])
    .children(function(d) { return d.values; })
    .value(function(d) { return d.radius * d.radius; })
    .nodes({values: d3.nest()
      .key(function(d) { return d.cluster; })
      .entries(nodes)});

var force = d3.layout.force()
    .nodes(nodes)
    .size([width, height])
    .gravity(0.02)
    .charge(1)
    .on("tick", tick)
    .start();

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var node = svg.selectAll("circle")
    .data(nodes)
    .enter().append("circle")
    // Need an if statement where each node gets color based on framwork
    .style("fill", function(d) { return color(d.cluster); })
    .call(force.drag)
    .on("mousedown", function() { d3.event.stopPropagation(); });

node.transition()
    .duration(750)
    .delay(function(d, i) { return i * 5; })
    .attrTween("r", function(d) {
      var i = d3.interpolate(0, d.radius);
      return function(t){ return d.radius = i(t); };
    });

// function giving nodes location attributes
function tick(e) {
  node
      .each(cluster(10 * e.alpha * e.alpha))
      .each(collide(0.5))
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
}

// Move d to be adjacent to the cluster node.
function cluster(alpha) {
  return function(d) {
    var cluster = clusters[d.cluster];
    if (cluster === d) return;
    var x = d.x - cluster.x,
        y = d.y - cluster.y,
        l = Math.sqrt(x * x + y * y),
        r = d.radius + cluster.radius;
    if (l != r) {
      l = (l - r) / l * alpha;
      d.x -= x *= l;
      d.y -= y *= l;
      cluster.x += x;
      cluster.y += y;
    }
  };
}

// Resolves collisions between d and all other circles.
function collide(alpha) {
  var quadtree = d3.geom.quadtree(nodes);
  return function(d) {
    var r = d.radius + maxRadius + Math.max(padding, clusterPadding),
        nx1 = d.x - r,
        nx2 = d.x + r,
        ny1 = d.y - r,
        ny2 = d.y + r;
    quadtree.visit(function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== d)) {
        var x = d.x - quad.point.x,
            y = d.y - quad.point.y,
            l = Math.sqrt(x * x + y * y),
            r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? padding : clusterPadding);
        if (l < r) {
          l = (l - r) / l * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    });
  };
}