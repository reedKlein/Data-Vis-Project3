d3.csv('data/game-of-thrones-cleaned.csv')
  .then(data => {

    char_lines = d3.rollup(data, v=> v.length, d => d.Speaker);
    relevant_data = Array.from(char_lines)
        .filter(d => d[1] >= 45 && d[0] !== "" && d[0] !== "Nan")
        .map(d=> d[0]);
    
    filtered_data = data.filter(d => relevant_data.includes(d.Speaker));
 

    filtered_data.forEach(d => {
      d.text = d.Text
      d.speaker = d.Speaker
      d.modifier = d.Modifier
      if(d.modifier) d.modifier = d.modifier.slice(0, -1);
      d.episode = d.Episode
      d.season = d.Season
    });

     
    character_lines_barchart = new Barchart({ parentElement: '#char_lines_chart'}, 
                                     format_barchart(filtered_data, "speaker"), 
                                     "speaker"); // d3 rollup length of values from sy_snum
    character_lines_barchart.updateVis();

    episode_lines_barchart = new Barchart({ parentElement: '#episode_lines_chart'}, 
                                     format_barchart(filtered_data, "episode"), 
                                     "episode"); // d3 rollup length of values from sy_snum
    episode_lines_barchart.updateVis();

    season_lines_barchart = new Barchart({ parentElement: '#season_lines_chart'}, 
                                     format_barchart(filtered_data, "season"), 
                                     "season"); // d3 rollup length of values from sy_snum
    season_lines_barchart.updateVis();
});


// Create an object from rolled up data and assign it to templated "x" and "y" fields
function format_barchart(data, field){
    data_rollup = d3.rollup(data, v => v.length, d => d[field])
    let myObjStruct = Object.assign(Array.from(data_rollup).map(([k, v]) => ({"x": k, "y" : v})));
    console.log(field, myObjStruct);

    if (field === "speaker") {
        myObjStruct.sort((a, b) => b.y - a.y);
        retData = myObjStruct.slice(0, 20);
        let remainingData = myObjStruct.slice(20, myObjStruct.length).reduce((partialSum, a) => partialSum + a.y, 0)
        if(remainingData > 0){ retData.push({ x: "other", y: remainingData })}
      }
      else {
        retData = myObjStruct;
      }
    return retData;
}

// Sort per chart
function custom_sort(chart){
    chart.data.sort((a,b) => a.x - b.x);
    return;
}