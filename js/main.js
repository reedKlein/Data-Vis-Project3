// referenced https://stackoverflow.com/questions/29194489/how-to-use-d3-layout-cloud-js-to-create-a-word-cloud-with-a-csv-containing-both

function updateWordCloud(characterDict, character) {
  d3.select("#wordcloud").select("svg").remove();
  if (character in characterDict && character != "other") {
    var tempMyWords = characterDict[character]
    // var myWords = [{ "text": "test", "size": 1 }, { "text": "a", "size": 1 }, { "text": "banana", "size": 1 }]
    tempMyWords = tempMyWords.sort((a, b) => a.size - b.size).reverse();
    var myWords = [];
    var count = 150;
    tempMyWords.forEach(word => {
      if (count > 130) {
        word.size = 80
      }
      else if (count > 110) {
        word.size = 70
      }
      else if (count > 90) {
        word.size = 60
      }
      else if (count > 70) {
        word.size = 50
      }
      else if (count > 50) {
        word.size = 40
      }
      else if (count > 30) {
        word.size = 30
      }
      else if (count > 10) {
        word.size = 20
      }
      else {
        word.size = 15
      }
      if (count > 0 ) {
        myWords.push(word);
        count -= 1;
      }
    });
    var fill = d3.scaleOrdinal(d3.schemeCategory10);

    d3.layout.cloud().size([2000, 1080]).words(
      myWords
    )
      .rotate(function () {
        return ~~(Math.random() * 2) * 90;
      })
      .font("Impact")
      .fontSize(function (d) {
        return d.size;
      })
      .on("end", draw)
      .start();

    function draw(words) {
      d3.select("#wordcloud").append("svg")
        .attr("width", 1600)
        .attr("height", 900)
        .append("g")
        .attr("transform", "translate(100,200)")
        .selectAll("text")
        .data(myWords)
        .enter().append("text")
        .style("font-size", function (word) { return word.size + "px"; })
        .style("font-family", "Impact")
        .style("fill", function (word, i) { return fill(i); })
        .attr("text-anchor", "middle")
        .attr("transform", function (word) {
          return "translate(" + [word.x + 700, word.y + 250] + ")rotate(" + word.rotate + ")";
        })
        .text(function (word) { return word.text; });
    }
  }
}

var selected_filters = [];
var charts = [];
var first_char_bar = 0;
var last_char_bar = 20;
var char_domain_size = 0;
var characterDict = { "all": [] };

d3.csv('data/game-of-thrones-cleaned-houses.csv')
  .then(data => {

    // filter out characters that don't have at least 45 lines
    char_lines = d3.rollup(data, v => v.length, d => d.Speaker);
    relevant_data = Array.from(char_lines)
      .filter(d => d[1] >= 45 && d[0] !== "" && d[0] !== "Nan")
      .map(d => d[0]);

    master_data = data.filter(d => relevant_data.includes(d.Speaker));


    master_data.forEach(d => {
      d.text = d.Text
      d.speaker = d.Speaker
      d.modifier = d.Modifier
      if (d.modifier) d.modifier = d.modifier.slice(0, -1);
      d.episode = d.Episode
      d.season = d.Season
    });


    character_lines_barchart = new Barchart({ parentElement: '#char_lines_chart' },
      format_barchart(master_data, "speaker"),
      "speaker"); // d3 rollup length of values from sy_snum
    charts.push(character_lines_barchart)

    episode_lines_barchart = new Barchart({ parentElement: '#episode_lines_chart' },
      format_barchart(master_data, "episode"),
      "episode"); // d3 rollup length of values from sy_snum
    charts.push(episode_lines_barchart)


    season_lines_barchart = new Barchart({ parentElement: '#season_lines_chart' },
      format_barchart(master_data, "season"),
      "season"); // d3 rollup length of values from sy_snum
    charts.push(season_lines_barchart)

    house_lines_barchart = new Barchart({ parentElement: '#house_lines_chart'}, 
                                        format_barchart(master_data, "major_house"), 
                                        "major_house"); // d3 rollup length of values from sy_snum
    charts.push(house_lines_barchart)

    charts.forEach(chart => {
      chart.updateVis();
    });
    var wordBlackList = ["the", "of", "a", "i", "to", "was", "be", "my", "do", "and", "he", "me", "your", "is", "that", "it", "at", "in", "for", "have", "will", "this", "but", "what", "you", "don't", "with", "she", "are", "they", "has", "him", "well", "i'm", "his", "you're", "by", "you've", "as", "or", "there", "did", "too", "we", "so", "that's", "doesn't", "i'd", "l", "i'll", "she's", "their", "when", "there's", "an", "about", "them", "would", "i've", "he's"];
    // var wordBlackList = [];
    master_data.forEach(d => {
      if (!(d.speaker in characterDict)) {
        characterDict[d.speaker] = []
      }
      var tempString = d.Text.substring(1).toLowerCase().replaceAll(".", "").replaceAll(",", "").replaceAll("?", "").replaceAll("!", "").replaceAll(";", "");
      tempString = tempString.split(" ");
      tempString.forEach(word => {
        if (!(word == "") && !(wordBlackList.includes(word)) && word.charAt(0).toLowerCase() != word.charAt(0).toUpperCase()) {
          if (characterDict[d.speaker].find(x => x.text === word) == undefined) {
            characterDict[d.speaker].push({ "text": word, "size": 1 });
          }
          else {
            characterDict[d.speaker].find(x => x.text === word).size += 1;
          }
          // if (characterDict["all"].find(x => x.text === word) == undefined) {
          //   characterDict["all"].push({"text": word, "size": 1 });
          // }
          // else {
          //   characterDict["all"].find(x => x.text === word).size += 1;
          // }
        }
      });
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
function custom_sort(chart) {
  chart.data.sort((a, b) => a.x - b.x);
  return;
}

// update table and charts with filtered data
function update_charts(filtered_data) {
  charts.forEach(chart => {
    if (chart.type === "requested_datetime") {
      chart.data = format_barchart(filtered_data, chart.type);
      chart.updateVis();
    }
    else if (chart.type === "updateTime") {
      chart.data = filtered_data
      chart.updateVis();
    }
    else {
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
  first_char_bar = Math.min(char_domain_size - 20, first_char_bar + 20)
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