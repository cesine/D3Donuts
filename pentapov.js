
/*
Values will show up as slices in the circles. 
*/
var dataset = [
    {name: "Not", values: {0: 1, 1: 2, 2: 1, 3: 1 }},
    {name: "Native", values: {0: 1, 1: 5, 2: 0, 3: 0}},
    {name: "Pre", values: {0: 1, 1: 11, 2: 0, 3: 0}}
];
//number of values in the rings, needs to be the same number as the values in the rows
var valencies = [
    {val: 0, name: 'Incorrect'},
    {val: 1, name: 'Correct'},
    {val: 2, name: 'P'},
    {val: 3, name: 'Q'}

];
// numbers and colors, needs to be larger than the rows in the dataset
var rings = [
    {ring: 0, color: 'Blues'}, 
    {ring: 1, color: 'Greens'}, 
    {ring: 2, color: 'Reds'}
];

var sizes = {
    small: {inner: 0.6, outer: 0.95, xoffset: 0, x_legoffset: 215, y_legoffset: 286},
    large: {inner: 0.6, outer: 0.85, xoffset: 0, x_legoffset: 645, y_legoffset: 15, gap_factor: 0.85 }
};

var font_size = 15;

var settings = {
    formation: 'logo'
};

// Layout & Page controls //////////////////////////////////////////////////////

// various spacing parameters
var chartW      = 300;
var chartH      = 200;
var radius      = chartW / 8;
var background  = '#FEFEFE';
var foreground  = '#444444';

// main svg for the chart
var chart = d3.select('#chart_container')
  .append('div')
  .append('svg:svg')
    .attr('id', 'chart')
    .attr('width', chartW)
    .attr('height', chartH)
    .attr('fill', background);



// Ring Setup //////////////////////////////////////////////////////////////////

// Set the ring positions
rings.map(function(d,i) {
    rings[i]['x'] = (i + 1) * radius*1.33 + sizes.small.xoffset;
    rings[i]['y'] = ((i % 2)*1.9 + 1) * radius;
})

function get_proportion(group, valence, dataset){
    total = 0;
    for(i in dataset[group].values){
        total = total+dataset[group].values[i];
    }
    count = dataset[group].values[valence];
    return (count / total);
}

function get_arc_start_position(group, valence, dataset){
    offset = 0;
    valencies.map(function(v2){
        if (v2.val < valence){
            offset += get_proportion(group, v2.val, dataset);
        }
    });
    return offset;
}

function get_arc_end_position(group, valence, dataset){
    return get_arc_start_position(group, valence, dataset) + get_proportion(group, valence, dataset);
}

// Animation functions ////////////////////////////////////////////////////////

function get_formation_translation(ring, formation){
    switch(formation){
        case "pentagram":
            legend_group.transition().duration(1000)
                .attr('transform', 'translate(' + sizes.large.x_legoffset + ',' + sizes.large.y_legoffset  + ')')
            //TODO - do clever things with me
            switch(ring) {
                case 4: return 'translate(' + ((3*radius + sizes.large.xoffset) - (Math.cos(Math.PI/10)*2*radius)) + ',' + ((3*radius) - (Math.sin(Math.PI/10)*2*radius)) + ')'; break;
                case 3: return 'translate(' + ((3*radius + sizes.large.xoffset) - (Math.sin(Math.PI/5)*2*radius)) + ',' + ((3*radius) + (Math.cos(Math.PI/5)*2*radius)) + ')'; break;
                case 0: return 'translate(' + (3*radius + sizes.large.xoffset) + ',' + radius + ')'; break;
                case 2: return 'translate(' + ((3*radius + sizes.large.xoffset) + (Math.sin(Math.PI/5)*2*radius)) + ',' + ((3*radius) + (Math.cos(Math.PI/5)*2*radius)) + ')'; break;
                case 1: return 'translate(' + ((3*radius + sizes.large.xoffset) + (Math.cos(Math.PI/10)*2*radius)) + ',' + ((3*radius) - (Math.sin(Math.PI/10)*2*radius)) + ')'; break;
            };
            break;
        case "merged":
            return 'translate(' + (3*radius + sizes.large.xoffset) + ',' + (3*radius) + ')';
            break;
        default: //logo
            return 'translate(' + rings[ring].x + ',' + rings[ring].y + ')';
            break;
    }
}

// reposition circles
function change_formation(new_formation) {
    // move gs
    change_radius(new_formation);
    d3.selectAll('.chord_group').remove();
    return ring_group.transition().duration(1000)
        .attrTween('transform', function(d) { return group_tween(d, new_formation); }).each("end", function(e){
            settings.formation = new_formation;
        });
}

function group_tween(ring, new_formation) {
    var i = d3.interpolate(get_formation_translation(ring, settings.formation), get_formation_translation(ring, new_formation));
    return function(t) { return i(t); }
}

d3.json('data.json', function(json) {

    // make an svg:g for each ring
    ring_group = chart.selectAll('.ring_group')
        .data(d3.range(dataset.length))// Theoretically should be values of each theme
        .enter().append('svg:g')
        .attr('class', 'ring_group')
        .attr('opacity', 1)
        .attr('transform', function(d) { return get_formation_translation(d, settings.formation)} );
    
    // add the title for each ring
    ring_labels = ring_group
      .append('svg:text')
      .text(function(d) { return dataset[d].name; })
      .attr('fill', foreground)
      .attr("font-size", font_size)
            
    // arc generator
    arc = d3.svg.arc()
        .innerRadius(radius*sizes.small.inner)
        .outerRadius(radius*sizes.small.outer)
        .startAngle(function(d) { return get_arc_start_position(d.theme, d.valence, dataset) * 2 * Math.PI; })
        .endAngle(function(d) { return get_arc_end_position(d.theme, d.valence, dataset) * 2 * Math.PI; });

    // add an arc for each response
    arcs = ring_group.selectAll('.arc')
        .data(function(d){
            return d3.range(valencies.length).map(function(i){
                return {theme: d, valence: i};
            });
        })
        .enter().append('svg:path')
        .attr('d', arc)
        .attr('fill', function(d, i) {
            return colorbrewer[rings[d.theme].color][6][1+d.valence]; })
        .attr('fill-opacity', .5)
        .attr('stroke', background)
        .attr('fill-opacity', 1)
        .attr('stroke-width', 2)
        .on('mouseover', function(d) { if (settings.formation == 'merged') draw_chords(d.theme, d.valence)})
        .on('mouseout', function(d) { if (settings.formation == 'merged') d3.select('#chord_group_' + d.theme + '_' + d.valence).remove(); })
        
});
