async function render() {
  // load data
  const GachaData = await d3.csv("../data/GachaGames.csv");
  const filterSet = ['Honkai: Star Rail', 'Naruto Mobile and', 'Monster Strike',
    'Genshin Impact', 'Love and Deepspace', 'Fate/Grand Order', 'Dragon Ball Z Dokkan Battle',
    'Arknights', 'Zenless Zone Zero', 'Uma Musume: Pretty Derby', 'AFK Journey'

  ];
  const top10Games = GachaData.filter((item) => filterSet.includes(item.Title));

  const click = vl.selectPoint().encodings('color');
  const brush = vl.selectInterval().encodings('x').resolve('union');
  const brush2 = vl.selectInterval();

  // Visualization 1
  // Bar Chart
  const allSales = vl.markBar()
    .data(GachaData)
    .transform(
      vl.filter(click),
      vl.filter(brush)
    )
    .title("Global Sales of Gacha Games in 2024")
    .params(brush2)
    .encode(
      vl.x().fieldQ("Overal_Rev").aggregate("sum").title("Sales by million(s)"),
      vl.y().fieldN("Title").sort("x").title(null),
      vl.tooltip(["Overal_Rev"]).aggregate("sum"),
      vl.color().value('lightgray').if(click, vl.color().fieldN('Genre')),
    )
    .width("container")
    .height(550)
    .toSpec();

  // Pie Chart
  const yearOut = vl.markBar()
    .data(GachaData)
    .transform(
      vl.filter(click),
      vl.filter(brush2),
      vl.aggregate()
        .groupby('Year_Released', 'Title'),
    )
    .title('Years game released')
    .params(brush)
    .encode(
      vl.y().fieldN('Year_Released').aggregate('count').title("Year Released"),
      vl.x().fieldN('Year_Released').axis({ labelAngle: 0 }),
    )
    .width(300)
    .height(300)
    .toSpec();

  const genreCount = vl.markArc({ tooltip: { "content": "encoding" }, clip: true })
    .data(GachaData)
    .transform(
      vl.filter(brush),
      vl.filter(brush2),
      vl.aggregate()
        .groupby('Genre', 'Title')
    )
    .title("Genre Breakdown")
    .params(click)
    .encode(
      vl.theta().fieldQ('Genre').aggregate('count').count('Title'),
      vl.color().value('lightgray').if(click, vl.color().fieldN('Genre')),
    )
    .width(300)
    .height(300)
    .toSpec();

  const combinedSpec = vl.vconcat(allSales, vl.hconcat(genreCount, yearOut)).toSpec();

  vegaEmbed("#vis1", combinedSpec).then((result) => {
    const view = result.vis1;
    view.run();
  });

  //Vis 2 - Top 10 best selling game by months
  const selection = vl.selectPoint();
  const vis2Spec = vl
    .markLine()
    .data(top10Games)
    .title("Sales by Month")
    .params(selection)
    .encode(
      vl.x().fieldO('Month')
        .title("Month")
        .sort(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'])
        .axis({ labelAngle: 0 }), // Ensure horizontal orientation of labels
      vl.y().fieldQ('Overal_Rev').title("Total unit sold in million").aggregate('sum'),
      vl.tooltip(['Title', 'Genre']),
      vl.color().if(selection, vl.fieldN('Title'))
        .value('grey')
        .scale({ scheme: 'category20' }),
      vl.opacity().if(selection, vl.value(0.8)).value(0.1)
    )
    .width("container")
    .height(400)
    .toSpec();

  vegaEmbed("#vis2", vis2Spec).then((result) => {
    const view = result.vis2;
    view.run();
  });

  //Vis 3 - Compare
  const uniqueTitles = [...new Set(GachaData.map(game => game.Title))];
  uniqueTitles.sort();
  const dropdown1 = document.getElementById('dropdown1');
  const dropdown2 = document.getElementById('dropdown2');

  uniqueTitles.forEach(title => {
    const option1 = document.createElement('option');
    option1.value = title;
    option1.textContent = title;
    dropdown1.appendChild(option1);

    const option2 = document.createElement('option');
    option2.value = title;
    option2.textContent = title;
    dropdown2.appendChild(option2);
  });

  // Function to update the chart based on selected titles
  function updateChart() {
    const title1 = dropdown1.value;
    const title2 = dropdown2.value;

    if (!title1 || !title2) {
      return; // No selection or invalid selections
    }

    // Filter data for selected titles
    const gameschecked = GachaData.filter(game => game.Title === title1 || game.Title === title2);

    // Vega-Lite Spec
    const selection = vl.selectPoint();
    const comparedData = vl
      .markLine()
      .data(gameschecked)
      .title("Sales by Month")
      .params(selection)
      .encode(
        vl.x().fieldO('Month')
          .title("Month")
          .sort(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'])
          .axis({ labelAngle: 0 }),
        vl.y().fieldQ('Overal_Rev').title("Total unit sold in million").aggregate('sum'),
        vl.tooltip(['Title', 'Genre']),
        vl.color().if(selection, vl.fieldN('Title'))
          .value('grey')
          .scale({ scheme: 'category20' }),
        vl.opacity().if(selection, vl.value(0.8)).value(0.1)
      )
      .width("container")
      .height(400)
      .toSpec();

    vegaEmbed("#vis3", comparedData).then((result) => {
      const view = result.comparedData;
      view.run();
    });
  }
  dropdown1.addEventListener('change', updateChart);
  dropdown2.addEventListener('change', updateChart);
}
render();