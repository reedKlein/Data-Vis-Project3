var selected_filters = [];
var charts = [];
var first_char_bar=0;
var last_char_bar=20;
var char_domain_size = 0;

d3.csv('data/game-of-thrones-cleaned-houses.csv')
  .then(data => {

    // filter out characters that don't have at least 45 lines
    char_lines = d3.rollup(data, v=> v.length, d => d.Speaker);
    relevant_data = Array.from(char_lines)
        .filter(d => d[1] >= 45 && d[0] !== "" && d[0] !== "Nan")
        .map(d=> d[0]);
    
    master_data = data.filter(d => relevant_data.includes(d.Speaker));
 

    master_data.forEach(d => {
      d.text = d.Text
      d.speaker = d.Speaker
      d.modifier = d.Modifier
      if(d.modifier) d.modifier = d.modifier.slice(0, -1);
      d.episode = d.Episode
      d.season = d.Season
    });

     
    character_lines_barchart = new Barchart({ parentElement: '#char_lines_chart'}, 
                                     format_barchart(master_data, "speaker"), 
                                     "speaker"); // d3 rollup length of values from sy_snum
    charts.push(character_lines_barchart)                                

    episode_lines_barchart = new Barchart({ parentElement: '#episode_lines_chart'}, 
                                     format_barchart(master_data, "episode"), 
                                     "episode"); // d3 rollup length of values from sy_snum
    charts.push(episode_lines_barchart)                                  


    season_lines_barchart = new Barchart({ parentElement: '#season_lines_chart'}, 
                                     format_barchart(master_data, "season"), 
                                     "season"); // d3 rollup length of values from sy_snum
    charts.push(season_lines_barchart)

    house_lines_barchart = new Barchart({ parentElement: '#house_lines_chart'}, 
                                        format_barchart(master_data, "major_house"), 
                                        "major_house"); // d3 rollup length of values from sy_snum
    charts.push(house_lines_barchart)

    charts.forEach( chart => {
        chart.updateVis();
    });                                 
});


// Create an object from rolled up data and assign it to templated "x" and "y" fields
function format_barchart(data, field){
    data_rollup = d3.rollup(data, v => v.length, d => d[field])
    let myObjStruct = Object.assign(Array.from(data_rollup).map(([k, v]) => ({"x": k, "y" : v})));

    if (field === "speaker") {
        myObjStruct.sort((a, b) => b.y - a.y);
        char_domain_size = myObjStruct.length;

        if(selected_filters.find(f => f.field === "speaker")){first_char_bar = 0; last_char_bar = 20} 

        retData = myObjStruct.slice(first_char_bar, last_char_bar);
        // let remainingData_lower = myObjStruct.slice(0, first_char_bar).reduce((partialSum, a) => partialSum + a.y, 0);
        // let remainingData_upper = myObjStruct.slice(last_char_bar, myObjStruct.length).reduce((partialSum, a) => partialSum + a.y, 0);
        // let remainingData = remainingData_lower + remainingData_upper;
        // if(remainingData > 0){ retData.push({ x: "other", y: remainingData })}
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

// update table and charts with filtered data
function update_charts(filtered_data){
    charts.forEach(chart => {
        if(chart.type === "requested_datetime"){
            chart.data = format_barchart(filtered_data, chart.type);
            chart.updateVis();
        }
        else if(chart.type === "updateTime"){
          chart.data = filtered_data
          chart.updateVis();
        }
        else{
          chart.data = format_barchart(filtered_data, chart.type)
          chart.updateVis();
        }
    });
  }

  d3.select('#char_prev').on('click', d => {
    first_char_bar = Math.max(0, first_char_bar - 20)
    last_char_bar = Math.max(20, last_char_bar - 20)
    filtered_data = filtering();
    character_lines_barchart.data = format_barchart(filtered_data, "speaker")
    character_lines_barchart.updateVis();
  });

  d3.select('#char_next').on('click', d => {
    first_char_bar = Math.min(char_domain_size-20, first_char_bar + 20)
    last_char_bar = Math.min(char_domain_size, last_char_bar + 20)
    filtered_data = filtering();
    character_lines_barchart.data = format_barchart(filtered_data, "speaker")
    character_lines_barchart.updateVis();
  });

function filtering(){
    filtered_data = master_data;
    selected_filters.forEach( filter => {
        if(filter.field === "speaker" || filter.field === "episode" || filter.field === "season" || filter.field === "major_house"){
            filtered_data = filtered_data.filter(x => {return x[filter.field] == filter.d['x']});
        }
        else if(filter.field == 'updateTime'){
          filtered_data = filtered_data.filter(x => {return x[filter.field] >= filter.d['d0'] && x[filter.field] <= filter.d['d1']});
        }
        else if(filter.field == 'requested_datetime'){
          filtered_data = filtered_data.filter(x => {return new Date(x[filter.field]) >= filter.d['d0'] && new Date(x[filter.field]) < filter.d['d1']});
        }
        else if(filter.field === "areaSelect"){
          filtered_data = filtered_data.filter(x => {return x['longitude'] < filter.d['d0Lon'] && x['longitude'] > filter.d['d1Lon'] && x['latitude'] > filter.d['d0Lat'] && x['latitude'] < filter.d['d1Lat']})
        }
    });
    return filtered_data;
  }
  
  // handle filter event
  function handle_filter(data, field){
    update_filter_selection(data, field);
    filtered_data = filtering();
    update_charts(filtered_data)
  }
  
  // update selection for multi select
  function update_filter_selection(d, field){ 
    if(selected_filters.length === 0){ // Check if filter exists
        selected_filters.push({"field": field, "d": d});
    }
    else{ // remove filter
        let index = 0
        let newFilter = true;
        selected_filters.forEach( filter =>{
          if((field === "speaker" && filter.field == "speaker") || 
            (field === "updateTime" && filter.field == "updateTime") || 
            (field === "areaSelect"  && filter.field == "areaSelect")){
            selected_filters.splice(index,1);
          }
          if(filter.field == field && (filter.d['x'] === d['x'] && d['x'] !== undefined)){
              selected_filters.splice(index, 1);
              newFilter = false;       
          }
          index++;
        });
        if(newFilter){
            selected_filters.push({"field": field, "d": d});
        }
    }
  }