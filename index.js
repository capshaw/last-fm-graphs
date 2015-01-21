/*
 * Warning! For as long as this comment exists at the top of this file, this is
 * just a hacky experiment. I'm just messing around at the moment, so this code
 * is kind of questionable at points. Give it time!
 */

var properties = {
    filename: 'data/two-years-top-25.csv',
    colorRange: [
        "#6363FF", "#6373FF", "#63A3FF", "#63E3FF", "#63FFFB", "#63FFCB",
        "#63FF9B", "#63FF6B", "#7BFF63", "#BBFF63", "#DBFF63", "#FBFF63",
        "#FFD363", "#FFB363", "#FF8363", "#FF7363", "#FF6364"
    ],
    strokeColor: '#333',
    dateFormat: '%Y-%m',
    margin: {
        top: 10,
        right: 20,
        bottom: 40,
        left: 20
    }
};

function switchData(file) {
    properties.filename = file;
    chart(properties);
}

function loadHandler() {
    chart(properties);
}

function chart(propertiesProvided) {

    var datearray = [];

    var properties = {
        colorRange: null,
        filename: null,
        margin: null,
        strokeColor: null,
        dateFormat: null
    };

    // Merge given properties with property defaults.
    for (var key in properties) {
        if (propertiesProvided[key]) {
            properties[key] = propertiesProvided[key];
        } else if (properties[key] === null) {
            console.log('Property "' + key + '"" is required.');
            return false;
        }
    }

    console.log(document.getElementById('chart').width);
    var width = document.body.clientWidth - properties.margin.left - properties.margin.right;
    var height = 600 - properties.margin.top - properties.margin.bottom;
    var width = d3.select('#chart')[0][0].clientWidth - properties.margin.left - properties.margin.right;

    var x = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height-10, 0]);

    var z = d3.scale.ordinal()
        .range(properties.colorRange);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient('bottom')
        .ticks(d3.time.months)

    var yAxis = d3.svg.axis()
        .scale(y);

    var yAxisr = d3.svg.axis()
        .scale(y);

    var stack = d3.layout.stack()
        .offset('silhouette')
        .values(function(d) { return d.values; })
        .x(function(d) { return d.date; })
        .y(function(d) { return d.value; });

    var nest = d3.nest()
        .key(function(d) { return d.key; });

    var area = d3.svg.area()
        .interpolate('basis')
        .x(function(d) { return x(d.date); })
        .y0(function(d) { return y(d.y0); })
        .y1(function(d) { return y(d.y0 + d.y); });

    var svg = d3.select('.chart').text('').append('svg')
        .attr('width', width + properties.margin.left + properties.margin.right)
        .attr('height', height + properties.margin.top + properties.margin.bottom)
      .append('g')
        .attr('transform', 'translate(' + properties.margin.left + ',' + properties.margin.top + ')');

    var tooltip = d3.select('.chart')
        .append('div')
        .attr('class', 'remove')
        .style('position', 'absolute')
        .style('z-index', '20')
        .style('visibility', 'hidden')
        .style('top', '20px');

    var graph = d3.csv(properties.filename, function(data) {

        var dateFormat = d3.time.format(properties.dateFormat);
        data.forEach(function(d) {
            d.date = dateFormat.parse(d.date);
            d.value = +d.value;
        });

        var layers = stack(nest.entries(data));

        x.domain(d3.extent(data, function(d) { return d.date; }));
        y.domain([0, d3.max(data, function(d) { return d.y0 + d.y; })]);

        svg.selectAll('.layer')
          .data(layers)
          .enter().append('path')
          .attr('class', 'layer')
          .attr('d', function(d) { return area(d.values); })
          .style('fill', function(d, i) { return z(i); });

        svg.append('g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(0,' + height + ')')
          .call(xAxis);

        svg.append('g')
          .attr('class', 'y axis')
          .attr('transform', 'translate(' + width + ', 0)')
          .call(yAxis.orient('right'));

        svg.append('g')
          .attr('class', 'y axis')
          .call(yAxis.orient('left'));

        svg.selectAll('.layer')
            .attr('opacity', 1)
            .on('mouseover', function(d, i) {
                svg.selectAll('.layer').transition()
                .attr('opacity', function(d, j) {
                    return j != i ? 0.2 : 1;
                })
            })
        .on('mousemove', function(d, i) {
            mousex = d3.mouse(this);
            mousex = mousex[0];
            var invertedx = x.invert(mousex);
            invertedx = invertedx.getMonth() + invertedx.getDate();
            var selected = (d.values);
            for (var k = 0; k < selected.length; k++) {
                datearray[k] = selected[k].date
                datearray[k] = datearray[k].getMonth() + datearray[k].getDate();
            }

            d3.select(this)
                .classed('hover', true)
                .attr('stroke', properties.strokeColor)
                .attr('stroke-width', '0.5px'),
                tooltip.html('<p>' + d.key + '</p>').style('visibility', 'visible');
        })
        .on('mouseout', function(d, i) {
         svg.selectAll('.layer')
          .transition()
          .attr('opacity', '1');
          d3.select(this)
          .classed('hover', false)
          .attr('stroke-width', '0px'), tooltip.style('visibility', 'hidden');
        })

        var vertical = d3.select('.chart')
            .append('div')
            .attr('class', 'remove')
            .style('position', 'absolute')
            .style('z-index', '19')
            .style('width', '1px')
            .style('height', '548px')
            .style('top', '10px')
            .style('bottom', '30px')
            .style('left', '0px')
            .style('background', '#333');

        d3.select('.chart')
          .on('mousemove', function(){
             mousex = d3.mouse(this);
             mousex = mousex[0] + 5;
             vertical.style('left', mousex + 'px');
             tooltip.style('left', mousex + 'px');
             tooltip.style('text-align', 'left');
             if (mousex + 220 > document.body.clientWidth) {
               tooltip.style('left', mousex - 220 + 'px');
               tooltip.style('text-align', 'right');
             }
          })
          .on('mouseover', function(){
             mousex = d3.mouse(this);
             mousex = mousex[0] + 5;
             vertical.style('left', mousex + 'px');
             tooltip.style('left', mousex + 'px' );
             tooltip.style('text-align', 'left');
             if (mousex + 220 > document.body.clientWidth) {
               tooltip.style('left', mousex - 220 + 'px');
               tooltip.style('text-align', 'right');
             }
           });
    });

    return true;
}