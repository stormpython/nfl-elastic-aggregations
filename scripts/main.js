/**
 *
 * Created by shelbysturgis on 1/23/14.
 */

define(['scripts/d3.v3', 'scripts/elasticsearch'], function (d3, elasticsearch) {

    "use strict";
    var client = new elasticsearch.Client();

    client.search({
        index: 'nfl',
        size: 5,
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
            var touchdowns = resp.aggregations.touchdowns.buckets;

            // d3 donut chart
            var width = 600,
                height = 300,
                radius = Math.min(width, height) / 2;

            var color = ['#ff7f0e', '#d62728', '#2ca02c', '#1f77b4'];

            var arc = d3.svg.arc()
                .outerRadius(radius - 60)
                .innerRadius(120);

            var pie = d3.layout.pie()
                .sort(null)
                .value(function (d) { return d.doc_count; });

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
                .style("fill", function (d, i) {
                    return color[i];
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
        console.log(resp);

        // D3 code goes here.
        var root = createChildNodes(resp);

        // d3 dendrogram
        var width = 600,
            height = 2000;

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
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

        node.append("circle")
            .attr("r", 4.5)
            .style("fill", function (d) {
                return d.children ? "#ffffff" : color[+d.key - 1];
            })
            .style("stroke", function (d) {
                return d.children ? "#4682B4" : color[+d.key - 1];
            });

        node.append("text")
            .attr("dx", function(d) { return d.children ? -8 : 8; })
            .attr("dy", 3)
            .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
            .text(function(d) { return d.children? d.key : d.key + ": " + d.doc_count; });

        d3.select(self.frameElement).style("height", height + "px");

        function createChildNodes(dataObj) {
            var root = {};

            root.key = "NFL";
            root.children = dataObj.aggregations.teams.buckets;
            root.children.forEach(function (d) { d.children = d.players.buckets; });
            root.children.forEach(function (d) {
                d.children.forEach(function (d) {
                    d.children = d.qtrs.buckets;
                });
            });

            return root;
        }
    });
});
