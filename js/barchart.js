class Barchart {

    /**
     * Class constructor with basic chart configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data, _type, _xAxisLab, _yAxisLab) {
      // Configuration object with defaults
      this.config = {
        parentElement: _config.parentElement,
        logRange: _config.logRange || .5,
        containerWidth: _config.containerWidth || 540,
        containerHeight: _config.containerHeight || 220,
        margin: _config.margin || {top: 10, right: 10, bottom: 62, left: 60},
        logScale: _config.logScale || false,
        tooltipPadding: _config.tooltipPadding || 15,
        x_axis_height: _config.x_axis_height || 60
      }
      this.colorDict = {"Lannister": "#910013", "Stark": "#a8a8a8", 
                        "Targaryen": "#fa0000", "Greyjoy": "#c6af00",
                        "Tyrell":"#72ce00", "Baratheon": "#edc605", "Martell": "#ff9400"}

      this.barColorDict = {
                        "episode": "#edc605", "season": "#a8a8a8", "speaker": "#910013"
      }
      this.data = _data;
      this.type = _type;
      this.xAxisLab = _xAxisLab;
      this.yAxisLab = _yAxisLab;
      this.initVis();
    }
    
    /**
     * Initialize scales/axes and append static elements, such as axis titles
     */
    initVis() {

      let vis = this;
  
      // Calculate inner chart size. Margin specifies the space around the actual chart.
      vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
      vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
  
      // Initialize scales and axes
      // Important: we flip array elements in the y output range to position the rectangles correctly  

      
      vis.xScale = d3.scaleBand()
          .range([0, vis.width])
          .paddingInner(0.2);
  
      vis.xAxis = d3.axisBottom(vis.xScale)
          .tickSize(0, 0)
          .ticks(0)
          .tickFormat(t => {return t=='' ? 'other' : t});
    
  
      // Define size of SVG drawing area
      vis.svg = d3.select(vis.config.parentElement)
          .attr('width', vis.config.containerWidth)
          .attr('height', vis.config.containerHeight)
  
      // SVG Group containing the actual chart; D3 margin convention
      vis.chart = vis.svg.append('g')
          .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
  
      // Append empty x-axis group and move it to the bottom of the chart
      vis.xAxisG = vis.chart.append('g')
          .attr('class', 'axis x-axis')
          .attr('transform', `translate(0,${vis.height})`)
      
      // Append y-axis group 
      vis.yAxisG = vis.chart.append('g')
          .attr('class', 'axis y-axis');
      
        vis.chart.append('text')
        .attr("text-anchor", 'middle')
        .attr('x', vis.width/2)
        .attr('y', vis.height + vis.config.x_axis_height)
        .text(vis.xAxisLab)
        .attr('class', 'x-axis-label');

        vis.chart.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -((vis.height + vis.config.margin.top + vis.config.margin.bottom + 50)/2))
        .attr('y', -49)
        .text(vis.yAxisLab)
        .attr('class', 'y-axis-label');
    
    }
  
    /**
     * Prepare data and scales before we render it
     */
    updateVis() {
      let vis = this;
      
      // Specificy x- and y-accessor functions
      vis.xValue = d => d.x;
      vis.yValue = d => d.y;

      vis.xScale.domain(vis.data.map(vis.xValue));

      // Set variable Y scale for Logarithmic or Linear
      if (vis.config.logScale){
        vis.yScale = d3.scaleLog()
        vis.yScale.domain([vis.config.logRange, d3.max(vis.data, vis.yValue)]);
      }
      else{
        vis.yScale = d3.scaleLinear()
        vis.yScale.domain([0, d3.max(vis.data, vis.yValue)]);
      }

      vis.yScale.range([vis.height, 0]);

      vis.yAxis = d3.axisLeft(vis.yScale)
        .ticks(6)
        .tickSizeOuter(0);

      vis.renderVis();
    }
  
    /**
     * Bind data to visual elements
     */
    renderVis() {
      let vis = this;

      vis.colorScaleHouses = (d) => {
        if(vis.colorDict[d]){
            return vis.colorDict[d];
        }
        return "#FCFEF0";
      }

      vis.colorScaleBars = (d) => {
        if(vis.barColorDict[d]){
            return vis.barColorDict[d];
        }
        return "#FFF190";
      }

      // Format tooltip for barchart types
      vis.tooltipSelect = (type, d) => {
        switch(type){
          case "speaker":
            return `<div class="tooltip-label">Speaker: ${d.x}</div>${d3.format(',')(d.y)} line(s)`;
          case "episode":
            return `<div class="tooltip-label">Episode: ${d.x} </div>${d3.format(',')(d.y)} line(s)`;
          case "season":
            return `<div class="tooltip-label">Season ${d.x}</div>${d3.format(',')(d.y)} line(s)`;
          case "major_house":
            return `<div class="tooltip-label">House: ${d.x}</div>${d3.format(',')(d.y)} line(s)`;
        }
        return `<div class="tooltip-label">${type}<br>${d.x}</div>${d3.format(',')(d.y)}`;
      }

      vis.class = (field, d) => {
        if(selected_filters.find(e => e.field === field && e.d.x === d.x)){
            return "bar selected-bar"
        }
        return 'bar'
      }
  
      // Add rectangles
      vis.bars = vis.chart.selectAll('.bar')
          .data(vis.data, vis.xValue)
        .join('rect');
      
      vis.bars.style('opacity', 0.5)
        .transition().duration(1000)
          .style('opacity', 1)
          .style('fill', d=> {if(vis.type === 'major_house'){
                            return vis.colorScaleHouses(d.x);
                        }else{
                            return vis.colorScaleBars(vis.type);
                        }})
          .attr('class', d => vis.class(vis.type, d))
          .attr('x', d => vis.xScale(vis.xValue(d)))
          .attr('width', vis.xScale.bandwidth())
          .attr('height', d => vis.height - vis.yScale(vis.yValue(d)))
          .attr('y', d => vis.yScale(vis.yValue(d)) - 1)
      
      
      // Tooltip event listeners
      vis.bars
          .on('mouseover', (event,d) => {
            d3.select('#tooltip')
              .style('opacity', 1)
              // Format number with million and thousand separator
              .html(vis.tooltipSelect(vis.type, d));
          })
          .on('mousemove', (event) => {
            d3.select('#tooltip')
              .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
              .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
          })
          .on('mouseleave', () => {
            d3.select('#tooltip').style('opacity', 0);
          })
          .on('click', (event, d) =>{
            if(vis.type == "speaker" && d['x'] == "other"){
                return;
            }
            handle_filter(d, vis.type);
          });


        var tickIndex = 0;
        if(vis.type == 'episode'){
            vis.xAxis
              .tickFormat(t => {
                tickIndex++;
                    if(vis.data.length >= 40){
                        if(tickIndex % 2 == 0){return ''}else{return t.split("-")[0]}
                    }
                    return t.split("-")[0];
              });
        }
        else if(vis.type === 'season'){
            vis.xAxis
              .tickFormat(t => {return `S-${t.split("-")[1]}`});
        }
      // Update axes
      vis.xAxisG
          .transition().duration(1000)
          .call(vis.xAxis)
          .selectAll("text")
          .style("text-anchor", "end")
          .attr("transform", "translate(-5,0)rotate(-35)")
    
  
      vis.yAxisG.call(vis.yAxis);
    }
  }
  
  