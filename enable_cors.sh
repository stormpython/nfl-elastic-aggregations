cat >> /etc/elasticsearch/elasticsearch.yml << EOF
################################# Custom ##################################
http.cors.allow-origin: "/.*/"
http.cors.enabled: true
EOF
