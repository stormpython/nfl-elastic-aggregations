/**
 *
 * Created by shelbysturgis on 1/23/14.
 */

define(['scripts/d3.v3', 'scripts/elasticsearch'], function (d3, elasticsearch) {

    "use strict";
    var client = new elasticsearch.Client();

    client.search({
        index: 'nfl',
        size: 200,
        body: {
            // Begin query.
            query: {
                // Boolean query for matching and excluding items.
                bool: {
                    must: { match: { "description": "TOUCHDOWN" }},
                    must_not: { match: { "qtr": 5 }}
                }
            },
            // Aggregate on the results
            aggs: {
                touchdowns: {
                    terms: {
                        field: "qtr",
                        order: { "_term" : "asc" }
                    }
                }
            }
            // End query.
        }
    }).then(function (resp) {
            console.log(resp);

            // D3 code goes here.
            var touchdowns = resp.aggregations.touchdowns.buckets,
                total = resp.hits.total;

            // d3 donut chart
            var width = 600,
                height = 300,
                radius = Math.min(width, height) / 2;

            // var color = d3.scale.category10();
            var color = ['#ff7f0e', '#d62728', '#2ca02c', '#1f77b4'];

            var arc = d3.svg.arc()
                .outerRadius(radius - 60)
                .innerRadius(120);

            var pie = d3.layout.pie()
                .sort(null)
                .value(function (d) { return 100 * (d.doc_count/total); });

            var svg = d3.select("#donut-chart").append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + width/1.4 + "," + height/2 + ")");

            var g = svg.selectAll(".arc")
                .data(pie(touchdowns))
                .enter()
                .append("g")
                .attr("class", "arc");

            g.append("path")
                .attr("d", arc)
                .style("fill", function (d) { 
                    // return color(d.data.key); 
                    return color[d.data.key-1]; 
                });

            g.append("text")
                .attr("transform", function (d) { return "translate(" + arc.centroid(d) + ")"; })
                .attr("dy", ".35em")
                .style("text-anchor", "middle")
                .style("fill", "white")
                .text(function (d) { return d.data.key; });
    });

    client.search({
        index: 'nfl',
        size: 5,
        body: {
            query: {
                bool: {
                    must: { match: { "description": "TOUCHDOWN"}},
                    must_not: [
                        { match: { "description": "intercepted"}},
                        { match: { "description": "incomplete"}},
                        { match: { "description": "FUMBLES"}},
                        { match: { "description": "NULLIFIED"}}
                    ]
                }
            },
            aggs: {
                teams: {
                    terms: {
                        field: "off",
                        exclude: "",
                        size: 5
                    },
                    aggs: {
                        players: {
                            terms: {
                                field: "description",
                                include: "([a-z]?[.][a-z]+)",
                                size: 200
                            },
                            aggs: {
                                qtrs: {
                                    terms: {
                                        field: "qtr",
                                        order: { "_term": "asc" }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }).then(function (resp) {
        console.log(resp)

        // D3 code goes here.
        var root = createChildNodes(resp);

        // d3 dendrogram
        var width = 600,
            height = 2000;

        // var color = d3.scale.category10();
        var color = ['#ff7f0e', '#d62728', '#2ca02c', '#1f77b4'];

        var cluster = d3.layout.cluster()
            .size([height, width - 200]);

        var diagonal = d3.svg.diagonal()
            .projection(function(d) { return [d.y, d.x]; });

        var svg = d3.select("#dendrogram").append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(120,0)");

        var nodes = cluster.nodes(root),
            links = cluster.links(nodes);

        var link = svg.selectAll(".link")
            .data(links)
            .enter().append("path")
            .attr("class", "link")
            .attr("d", diagonal);

        var node = svg.selectAll(".node")
            .data(nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })

        node.append("circle")
            .attr("r", 4.5)
            .style("fill", function (d) { 
                var col = "#ffffff";
                if (+d.key > 0) {
                    col = color[d.key-1];
                }
                return col; 
            })
            .style("stroke", function (d) { 
                var col = "#4682B4";
                if (+d.key > 0) {
                    col = color[d.key-1];
                }
                return col; 
            });


        node.append("text")
            .attr("dx", function(d) { return d.children ? -8 : 8; })
            .attr("dy", 3)
            .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
            .text(function(d) { return d.children? d.key.toUpperCase() : d.key + ": " + d.doc_count; });

        d3.select(self.frameElement).style("height", height + "px");

        function createChildNodes(dataObj) {
            var root = {};
	        root.key = "NFL";
	        root.children = dataObj.aggregations.teams.buckets;
            root.children.forEach(function (d) { d.children = d.players.buckets; });
            root.children.forEach(function (d) { d.children.forEach(function (d) { d.children = d.qtrs.buckets; }) });
            return root;
        }
    });

    client.search({
        index: 'nfl',
        size: 5,
        body: {
            query: {
                bool: {
                    must: { match: { "description": "TOUCHDOWN"}},
                    must_not: [
                        { match: { "description": "intercepted"}},
                        { match: { "description": "incomplete"}},
                        { match: { "description": "FUMBLES"}},
                        { match: { "description": "NULLIFIED"}}
                    ]
                }
            },
            aggs: {
                teams: {
                    terms: {
                        field: "off",
                        exclude: "",
                        size: 5
                    },
                    aggs: {
                        players: {
                            terms: {
                                field: "description",
                                include: "([a-z]?[.][a-z]+)",
                                size: 200
                            },
                            aggs: {
                                qtrs: {
                                    terms: {
                                        field: "qtr",
                                        order: { "_term": "asc" }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }).then(function (resp) {
        "use strict";

        function createChildNodes(dataObj) {
            var root = {};
            root.key = "NFL";
            root.children = dataObj.aggregations.teams.buckets;
            root.children.forEach(function (d) { d.children = d.players.buckets; });
            root.children.forEach(function (d) { d.children.forEach(function (d) { d.children = d.qtrs.buckets; }) });
            return root;
        }

        var root = createChildNodes(resp);

        var width = 960,
            height = 700,
            radius = Math.min(width, height) / 2,
            color = d3.scale.category20c();

        var x = d3.scale.linear()
            .range([0, 2 * Math.PI]);

        var y = d3.scale.sqrt()
            .range([0, radius]);

        var svg = d3.select("#sunburst").append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            //.attr("transform", "translate(" + width / 2 + "," + height * .52 + ")");
            .attr("transform", "translate(" + width / 2 + "," + (height / 2 + 10) + ")");

        var partition = d3.layout.partition()
            //.sort(null)
            //.size([2 * Math.PI, radius * radius])
            .value(function(d) { return d.doc_count; });

        var arc = d3.svg.arc()
            .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
            .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
            .innerRadius(function(d) { return Math.max(0, y(d.y)); })
            .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });
            /*
            .startAngle(function(d) { return d.x; })
            .endAngle(function(d) { return d.x + d.dx; })
            .innerRadius(function(d) { return Math.sqrt(d.y); })
            .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });
            */

        var path = svg.selectAll("path")
            .data(partition.nodes(root))
            .enter().append("path")
            //.attr("display", function(d) { return d.depth ? null : "none"; }) // hide inner ring
            .attr("d", arc)
            //.style("stroke", "#fff")
            .style("fill", function(d) { return color((d.children ? d : d.parent).key); })
            .on("click", click);
            //.style("fill-rule", "evenodd")
            //.each(stash);

        d3.select(self.frameElement).style("height", height + "px");

        function click(d) {
            path.transition()
                .duration(750)
                .attrTween("d", arcTween(d));
        }

        // Interpolate the scales!
        function arcTween(d) {
            var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
                yd = d3.interpolate(y.domain(), [d.y, 1]),
                yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
            return function(d, i) {
                return i
                    ? function(t) { return arc(d); }
                    : function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
            };
        }
});
});
