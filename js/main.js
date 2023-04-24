// referenced https://stackoverflow.com/questions/29194489/how-to-use-d3-layout-cloud-js-to-create-a-word-cloud-with-a-csv-containing-both
var wordBlackList = ["the", "of", "a", "i", "to", "was", "be", "my", "do", "and", "he", "me", "your", "is", "that", "it", "at", "in", "for", "have", "will", "this", "but", "what", "you", "don't", "with", "she", "are", "they", "has", "him", "well", "i'm", "his", "you're", "by", "you've", "as", "or", "there", "did", "too", "we", "so", "that's", "doesn't", "i'd", "l", "i'll", "she's", "their", "when", "there's", "an", "about", "them", "would", "i've", "he's", "into", "it's", "than", "like", "some", "over", "does", "on", "rape", "got", "does", "after", "am", "oh", "you'll", "off", "sure", "we're", "were", "where", "any", "from", "before", "how", "can", "use"];
function updateWordCloud() {
  d3.select("#wordcloud").select("svg").remove();
    // var myWords = [{ "text": "test", "size": 1 }, { "text": "a", "size": 1 }, { "text": "banana", "size": 1 }]
    wordDict = wordDict.sort((a, b) => a.size - b.size).reverse();
    var myWords = [];
    var count = 150;
    wordDict.forEach(word => {
      word.word_count = word.size;
      if (count > 130) {
        word.size = 69
      }
      else if (count > 110) {
        word.size = 60
      }
      else if (count > 90) {
        word.size = 50
      }
      else if (count > 70) {
        word.size = 40
      }
      else if (count > 50) {
        word.size = 30
      }
      else if (count > 30) {
        word.size = 23
      }
      else if (count > 10) {
        word.size = 19
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
        .attr("width", 1500)
        .attr("height", 820)
        .append("g")
        .attr("transform", "translate(10,160)")
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
        .text(function (word) { return word.text; })
            .style('cursor', 'pointer')
        .on('mouseover', (event,d) => {
            d3.select('#tooltip')
              .style('opacity', 1)
              // Format number with million and thousand separator
              .html(`<div class="tooltip-label">Word: ${d.text} <br> Used: ${d.word_count} time(s)</div>`);
          })
          .on('mousemove', (event) => {
            d3.select('#tooltip')
              .style('left', (event.pageX + 15) + 'px')   
              .style('top', (event.pageY + 15) + 'px')
          })
          .on('mouseleave', () => {
            d3.select('#tooltip').style('opacity', 0)
          })
          .on('click', (event, d) =>{
            document.getElementById("phrase_lookup_input").value = d.text;
            handle_filter(d.text.toString(), "text");
          });
    }
}

var selected_filters = [];
var charts = [];
var first_char_bar = 0;
var last_char_bar = 20;
var char_domain_size = 0;
var wordDict = [];

d3.csv('data/game-of-thrones-cleaned-houses.csv')
  .then(data => {

    // filter out characters that don't have at least 45 lines
    char_lines = d3.rollup(data, v => v.length, d => d.Speaker);
    relevant_data = Array.from(char_lines)
      .filter(d => d[1] >= 45 && d[0] !== "" && d[0] !== "Nan" && d[0] !== "Cut To" && d[0] !== "Int" && d[0] !== "Ext")
      .map(d => d[0]);

    master_data = data.filter(d => relevant_data.includes(d.Speaker));


    master_data.forEach(d => {
      d.text = d.Text
      d.speaker = d.Speaker
      d.modifier = d.Modifier
      if (d.modifier) d.modifier = d.modifier.slice(0, -1);
      d.episode = `s${d.Season.slice(-1)}${d.Episode}`
      d.season = d.Season
    });


    character_lines_barchart = new Barchart({ parentElement: '#char_lines_chart', 
                                              containerWidth: 650, 
                                              containerHeight: 250, 
                                              margin: {top: 10, right: 10, bottom: 100, left: 70},
                                              x_axis_height: 90 },
      format_barchart(master_data, "speaker"),
      "speaker",
      "Character Speaking",
      "Lines of Dialogue"); // d3 rollup length of values from sy_snum
    charts.push(character_lines_barchart)

    episode_lines_barchart = new Barchart({ parentElement: '#episode_lines_chart', containerWidth: 825, containerHeight:220  },
      format_barchart(master_data, "episode"),
      "episode",
      "Episode",
      "Lines of Dialogue"); // d3 rollup length of values from sy_snum
    charts.push(episode_lines_barchart)


    season_lines_barchart = new Barchart({ parentElement: '#season_lines_chart' },
      format_barchart(master_data, "season"),
      "season",
      "Season",
      "Lines of Dialogue"); // d3 rollup length of values from sy_snum
    charts.push(season_lines_barchart)

    house_lines_barchart = new Barchart({ parentElement: '#house_lines_chart'}, 
                                        format_barchart(master_data, "major_house"), 
                                        "major_house",
                                        "House Name",
                                        "Lines of Dialogue"); // d3 rollup length of values from sy_snum
    charts.push(house_lines_barchart)

    charts.forEach(chart => {
      custom_sort(chart);
      chart.updateVis();
    });
    update_wordDict();
    updateWordCloud();

    // var wordBlackList = [];
  });

function update_wordDict(){
    wordDict = [];
    wordcloud_filter_data = filtering();
    wordcloud_filter_data.forEach(d => {
        var tempString = d.text.substring(1).toLowerCase().replaceAll(".", "").replaceAll(",", "").replaceAll("?", "").replaceAll("!", "").replaceAll(";", "");
        tempString = tempString.split(" ");
        tempString.forEach(word => {
          if (!(word == "") && !(wordBlackList.includes(word)) && word.charAt(0).toLowerCase() != word.charAt(0).toUpperCase()) {
            if (wordDict.find(x => x.text === word) == undefined) {
              wordDict.push({ "text": word, "size": 1 });
            }
            else {
              wordDict.find(x => x.text === word).size += 1;
            }
          }
        });
    });
}


// Create an object from rolled up data and assign it to templated "x" and "y" fields
function format_barchart(data, field){
    data_rollup = d3.rollup(data, v => v.length, d => d[field])
    let myObjStruct = Object.assign(Array.from(data_rollup).map(([k, v]) => ({"x": k, "y" : v})));

    if (field === "speaker") {
        myObjStruct.sort((a, b) => b.y - a.y);
        char_domain_size = myObjStruct.length;

        if(selected_filters.find(f => f.field === "speaker") || selected_filters.find(f => f.field === "major_house")){first_char_bar = 0; last_char_bar = 20} 

        retData = myObjStruct.slice(first_char_bar, last_char_bar);
    }
    else { 
        retData = myObjStruct;
    }
    return retData;
}

// Sort per chart
function custom_sort(chart) {
  if(chart.type === 'episode'){
    chart.data.sort((a, b) => {
        seasonA = parseInt(`${a.x.charAt(1)}`);
        seasonB = parseInt(`${b.x.charAt(1)}`);
        if(seasonA < seasonB){return -1}
        else if(seasonA > seasonB){return 1}
        else{
            episodeA = parseInt(`${a.x.split('e')[1].split('-')[0]}`)
            episodeB = parseInt(`${b.x.split('e')[1].split('-')[0]}`)
            if(episodeA < episodeB){return -1}
            else{return 1}
        }
    });

  }
  else if(chart.type==='major_house'){
    chart.data.sort((a, b) => b.y - a.y);
  }
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
      chart.data = format_barchart(filtered_data, chart.type);
      custom_sort(chart);
      chart.updateVis();
    }
  })
  update_wordDict()
  updateWordCloud();
}

d3.select('#char_prev').on('click', d => {
nextBut = document.getElementById('char_next');
  prevBut = document.getElementById('char_prev');
  first_char_bar = Math.max(0, first_char_bar - 20);
  last_char_bar = Math.max(20, last_char_bar - 20);
  if(last_char_bar >= char_domain_size){nextBut.hidden = true;}else{nextBut.hidden = false;}
  if(first_char_bar <= 0){prevBut.hidden = true;}else{prevBut.hidden = false;}
  filtered_data = filtering();
  character_lines_barchart.data = format_barchart(filtered_data, "speaker");
  character_lines_barchart.updateVis();
});

d3.select('#char_next').on('click', d => {
  nextBut = document.getElementById('char_next');
  prevBut = document.getElementById('char_prev');
  first_char_bar = Math.min(char_domain_size - 20, first_char_bar + 20);
  last_char_bar = Math.min(char_domain_size, last_char_bar + 20);
  if(last_char_bar >= char_domain_size){nextBut.hidden = true;}else{nextBut.hidden = false;}
  if(first_char_bar <= 0){prevBut.hidden = true;}else{prevBut.hidden = false;}
  filtered_data = filtering();
  character_lines_barchart.data = format_barchart(filtered_data, "speaker");
  character_lines_barchart.updateVis();
});

d3.select('#phrase_lookup_but').on('click', d => {
    phrase = document.getElementById("phrase_lookup_input").value;
    handle_filter(phrase, "text");
});

d3.select('#clear-filters').on('click', () =>{
    document.getElementById('clear-filters').hidden = true;
    clearSelect();
});

d3.select('#phrase_clear_but').on('click', () =>{
    document.getElementById('phrase_clear_but').hidden = true;
    handle_filter('', "text");
});

function clear_phrase_button(){
    document.getElementById('phrase_clear_but').hidden = true;
    document.getElementById("phrase_lookup_input").value = '';
}

// Clear selection button functionality
function clearSelect(){
    selected_filters = [];
    document.getElementById("phrase_lookup_input").value = '';
    update_charts(master_data);
  }

function filtering(){
    filtered_data = master_data;
    if(selected_filters.length > 0){document.getElementById('clear-filters').hidden = false;} else{document.getElementById('clear-filters').hidden = true;}
    if(selected_filters.find(x=>{return x.field === 'text'})){document.getElementById('phrase_clear_but').hidden = false;}else{clear_phrase_button();}
    selected_filters.forEach( filter => {
        if(filter.field === "speaker" || filter.field === "episode" || filter.field === "season" || filter.field === "major_house"){
            filtered_data = filtered_data.filter(x => {return x[filter.field] == filter.d['x']});
        }
        else if(filter.field == 'text'){
          filtered_data = filtered_data.filter(x => {
                                                text_data = x['text'].toString().toLowerCase();
                                                filter_data = filter.d.toString().toLowerCase();
                                                return (text_data.includes(filter_data))
                                                });
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
    update_charts(filtered_data);
  }
  
  // update selection for multi select
  function update_filter_selection(d, field){ 
    if(selected_filters.length === 0){ // Check if filter exists
        if(!(field == 'text' && d == '')){
            selected_filters.push({"field": field, "d": d});
        }
    }
    else{ // remove filter
        let index = 0
        let newFilter = true;
        selected_filters.forEach( filter =>{
          if(filter.field == field && filter.field === "text"){
            if(d == ''){
                selected_filters.splice(index,1);
                newFilter = false;
            }
            else{
                selected_filters.splice(index,1);
            }
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