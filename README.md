# NFL Elasticsearch Aggregations

This repository contains the files for the [data visualization tutorial](http://www.elasticsearch.org/blog/data-visualization-elasticsearch-aggregations/) using Elasticsearch aggregations (1.4 release) and D3.

Note that starting with Elasticsearch 1.4, Cross Origin Resource Sharing (cors) was determined to be a serious security vulnerability (CVE-2014-6439) which breaks legacy web frontends like the sample index.html code in this demo. To address this, run the "enable_cors.sh" script which appens the necessary commands to elasticsearch.yml running on UNIX. If you are running on a Windows machine, you will need to enter the contents of the script manually into your elasticsearch.yml file.

Additional note:
This demo can be run using the website scripts in this github project, but the script sources link in the original ES documentation(http://www.elasticsearch.org/blog/data-visualization-elasticsearch-aggregations/) no longerserve the correct scripts. Bottom line, clone this project to obtain all necessary and working files. 
