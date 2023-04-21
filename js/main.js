d3.csv('data/game-of-thrones-cleaned.csv')
  .then(data => {
    data.forEach(d => {
      d.text = d.Text
      d.speaker = d.Speaker.split('(')[0].trim();
      d.modifier = d.Speaker.split('(')[1];
      if(d.modifier) d.modifier = d.modifier.slice(0, -1);
      d.episode = d.Episode
      d.season = d.Season
    });
    console.log(data)

     
    character_lines_barchart = new Barchart({ parentElement: '#char_lines_chart'}, 
                                     format_barchart(data, "speaker"), 
                                     "speaker"); // d3 rollup length of values from sy_snum
    character_lines_barchart.updateVis();

    episode_lines_barchart = new Barchart({ parentElement: '#episode_lines_chart'}, 
                                     format_barchart(data, "episode"), 
                                     "episode"); // d3 rollup length of values from sy_snum
    episode_lines_barchart.updateVis();

    season_lines_barchart = new Barchart({ parentElement: '#season_lines_chart'}, 
                                     format_barchart(data, "season"), 
                                     "season"); // d3 rollup length of values from sy_snum
    season_lines_barchart.updateVis();
});


// Create an object from rolled up data and assign it to templated "x" and "y" fields
function format_barchart(data, field){
    data_rollup = d3.rollup(data, v => v.length, d => d[field])
    let myObjStruct = Object.assign(Array.from(data_rollup).map(([k, v]) => ({"x": k, "y" : v})));
    console.log(field, myObjStruct)
    return myObjStruct;
}

// Sort per chart
function custom_sort(chart){
    chart.data.sort((a,b) => a.x - b.x);
    return;
}