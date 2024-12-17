const carousels = {
  carousel1: { currentIndex: 0 },
  carousel2: { currentIndex: 0 },
  carousel3: { currentIndex: 0 },
  carousel4: { currentIndex: 0 },
  carousel5: { currentIndex: 0 },
};

window.moveSlide = function (carouselId, direction) {
  const carousel = carousels[carouselId];
  const track = document.querySelector(`#${carouselId} .carousel-track`);
  const totalItems = document.querySelectorAll(`#${carouselId} .carousel-item`).length;
  const message = document.getElementById(`${carouselId}-message`);

  carousel.currentIndex += direction;

  if (carousel.currentIndex < 0) {
    carousel.currentIndex = totalItems - 1;
  } else if (carousel.currentIndex >= totalItems) {
    carousel.currentIndex = 0;
  }

  const offset = -carousel.currentIndex * 100;
  track.style.transform = `translateX(${offset}%)`;
};

async function render() {
  // load data
  const GachaData = await d3.csv("../data/GachaGames.csv");
  const firstPart = GachaData.filter((item) => { return item.Year_Released <= 2017 })
  const secondPart = GachaData.filter((item) => { return item.Year_Released <= 2024 & item.Year_Released >= 2018 })
  //const GoodSales = GachaData.filter((item) => { return item.Drop_Rates >= 5 })
  const GoodSales = GachaData.filter((item) => { return item.Downloads <= 3 & item.Overal_Rev <= 50 })
  const Honkai = GachaData.filter((item) => { return item.Title === "Honkai: Star Rail" })

  const click = vl.selectPoint()
    .encodings('color')
    .on("click")
    .bind("legend")
    .toggle(true)
  const brush = vl.selectInterval().encodings('x').resolve('union');
  const brush2 = vl.selectInterval();

  const containerElement = document.querySelector('.container');
  const halfContainerWidth = containerElement.offsetWidth / 2.6;
  const vis5ContainerWidth = containerElement.offsetWidth / 1.8;
  const vis52ContainerWidth = containerElement.offsetWidth / 3.8;

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
      vl.color().fieldN("Genre").title("Game Genre").legend(null) // Match colors for genres
    )
    .width("container")
    .height(550)
    .toSpec();

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
    .width(halfContainerWidth)
    .height(400)
    .toSpec();

  const genreCount = vl.markBar({ tooltip: { "content": "encoding" }, clip: true })
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
      vl.x().fieldQ('Genre').aggregate('count').title("Total Games"),
      vl.y().fieldN('Genre').axis({ labelAngle: 0 }).title(""),
      vl.color().value('lightgray').if(click, vl.color().fieldN('Genre')),
    )
    .width(halfContainerWidth)
    .height(400)
    .toSpec();

  const combinedSpec = vl.vconcat(vl.hconcat(genreCount, yearOut), allSales).toSpec();

  vegaEmbed("#vis1", combinedSpec).then((result) => {
    const view = result.vis1;
    view.run();
  });

  //Vis 2
  // Honkai Chart
  const honkaiChart = vl.markLine()
    .data(Honkai)
    .encode(
      vl.x().fieldO('Month')
        .title("Month")
        .sort(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'])
        .axis({ labelAngle: 0 }),
      vl.y().fieldQ('Overal_Rev').title("Total Revenue (Million)").aggregate('sum'),
      vl.tooltip(['Title', 'Genre']),
      vl.color().value('red')
    );

  // Gacha Games Chart
  const allOtherGames = vl.markLine()
    .data(GachaData)
    .encode(
      vl.x().fieldO('Month')
        .title("Month")
        .sort(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'])
        .axis({ labelAngle: 0 }),
      vl.y().fieldQ('Overal_Rev')
        .title("Total Unit Sold in Million")
        .aggregate('sum'),
      //vl.color().fieldO('Title').legend(null),
      vl.color().fieldO('Title')
        .scale({ range: ['#d9d9d9', '#bdbdbd'] }) // Custom shades of gray
        .legend(null),
      vl.opacity().value(0.5)
    )

  // Annotation for March
  const annotation = vl.markText({ align: 'left', dx: -160, dy: -170, fontSize: 16 })
    .data([{ Month: 'March', Overal_Rev: 50 }])
    .encode(
      vl.text().value("Honkai's revenue peaked in March 2024"),
      vl.color().value('red') // Match the line color for emphasis
    );

  const vis2Spec = vl.layer(allOtherGames, honkaiChart, annotation)
    .width("container") // Fixed numeric width
    .height(400)
    .title("Overall, Honkai Generated the Most Revenue in 2024")
    .toSpec();

  vegaEmbed("#vis2", vis2Spec).then((result) => {
    const view = result.view;
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

  dropdown1.value = "Honkai: Star Rail";

  // Function to update the chart based on selected titles
  function updateChart() {
    const title1 = dropdown1.value;
    const title2 = dropdown2.value;

    if (!title1 || !title2) {
      return;
    }
    const gameschecked = GachaData.filter(game => game.Title === title1 || game.Title === title2);

    const selection = vl.selectPoint();
    const vis3Spec = vl
      .markLine()
      .data(gameschecked)
      .title("Sales by Month")
      .params(selection)
      .encode(
        vl.x().fieldO('Month')
          .title("Months")
          .sort(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'])
          .axis({ labelAngle: 0 }),
        vl.y().fieldQ('Overal_Rev').title("Total revenue in million(s)").aggregate('sum'),
        vl.tooltip(['Title', 'Genre']),
        vl.color().if(selection, vl.fieldN('Title'))
          .value('grey')
          .scale({ scheme: 'category20' }),
        vl.opacity().if(selection, vl.value(0.8)).value(0.1)
      )
      .width("container")
      .height(400)
      .toSpec();

    vegaEmbed("#vis3", vis3Spec).then((result) => {
      const view = result.view;
      view.run();
    });
  }

  //Visualization 4
  //Scatterplot
  const scatterData = vl.markCircle({ size: 50 })
    .data(GoodSales)
    .transform(
      vl.filter(click),
      vl.filter(brush)
    )
    .title('Downloads vs Revenue')
    .params(brush2)
    .encode(
      vl.x().fieldQ('Overal_Rev').scale({ domain: [0, 50] }),
      //vl.x().fieldQ('Overal_Rev').scale({domain: [0, 75]}),
      //vl.y().fieldQ('Downloads').scale({domain: [0, 30]}).axis({tickCount: 5}),
      vl.y().fieldQ('Downloads').scale({ domain: [0, 3] }).axis({ tickCount: 5 }),
      vl.size().fieldQ('Drop_Rates').title('Drop Rates by percentage'),
      vl.color().value('lightgray').legend(null).if(click, vl.color().fieldN('Genre').title('Movie Genres')),
      vl.tooltip(['Title', 'Genre', 'Year_Released', 'Month', 'Review', 'Overal_Rev', 'Drop_Rates'])
    )
    .width("container")
    .height(550)
    .toSpec();

  // Reviews chart
  const reviewsChart = vl.markBar()
    .data(GachaData)
    .transform(
      vl.filter(click),
      vl.filter(brush2)
    )
    .title('All Game Review Rates')
    .params(brush)
    .encode(
      // vl.y().fieldN('Year_Released').aggregate('count').title("Year Released"),
      // vl.x().fieldN('Year_Released').axis({ labelAngle: 0 }),
      vl.x().fieldQ('Review').bin({ step: 0.25 }).scale({ domain: [3.5, 5] }),
      vl.y().count().scale({ domain: [0, 200] }),
    )
    .width(halfContainerWidth)
    .height(400)
    .toSpec();

  // Genre count chart
  const genreBreakdown = vl.markBar({ tooltip: { "content": "encoding" }, clip: true })
    .data(GachaData)
    .transform(
      // Aggregate to ensure unique titles are counted only once per genre
      //vl.aggregate().groupby('Genre', 'Title'),
      vl.filter(brush),
      vl.filter(brush2)
    )
    .title('Genre Count')
    .params(click)
    .encode(
      vl.x().count('Title').title('Total games in that Genre'),
      vl.y().fieldN('Genre'),
      vl.color().value('lightgray').legend(null).if(click, vl.color().fieldN('Genre'))
    )
    .width(halfContainerWidth)
    .height(400)
    .toSpec();

  const combinedVis4 = vl.vconcat(scatterData, vl.hconcat(genreBreakdown, reviewsChart)).toSpec();

  vegaEmbed("#vis4", combinedVis4).then((result) => {
    view = result.vis4;
    view.run();
  });
  dropdown1.addEventListener('change', updateChart);
  dropdown2.addEventListener('change', updateChart);

  // Vis 6
  const range1 = vl.layer(
    // Main range line
    vl.markRule({ color: '#E45756CC' })
      .data(firstPart)
      .encode(
        vl.x().fieldQ('Drop_Rates').aggregate('min'),
        vl.x2().fieldQ('Drop_Rates').aggregate('max'),
        vl.y().value(75)
      ),

    vl.markPoint({ color: '#E45756', size: 10 })
      .data(firstPart)
      .encode(
        vl.x().fieldQ('Drop_Rates').aggregate('min'),
        vl.y().value(75)
      ),

    vl.markPoint({ color: '#E45756', size: 10 })
      .data(firstPart)
      .encode(
        vl.x().fieldQ('Drop_Rates').aggregate('max'),
        vl.y().value(75)
      )
  );

  const range2 = vl.layer(

    vl.markRule({ color: '#0E4C92' })
      .data(secondPart)
      .encode(
        vl.x().fieldQ('Drop_Rates').aggregate('min'),
        vl.x2().fieldQ('Drop_Rates').aggregate('max'),
        vl.y().value(30)
      ),

    vl.markPoint({ color: '#0E4C92', size: 10 })
      .data(secondPart)
      .encode(
        vl.x().fieldQ('Drop_Rates').aggregate('min'),
        vl.y().value(30)
      ),

    vl.markPoint({ color: '#0E4C92', size: 10 })
      .data(secondPart)
      .encode(
        vl.x().fieldQ('Drop_Rates').aggregate('max'),
        vl.y().value(30)
      )
  );

  const firstVer = vl.markPoint({ color: '#E45756CC' })
    .data(firstPart)
    .encode(
      vl.x().fieldQ('Drop_Rates').aggregate('mean').title("Drop Rates"),
      vl.y().value(75)
    );

  const secondVer = vl.markPoint({ color: '#0E4C92' })
    .data(secondPart)
    .encode(
      vl.x().fieldQ('Drop_Rates').aggregate('mean').title("Drop Rates"),
      vl.y().value(30)
    );

  const text1 = vl.markText({ color: '#E45756CC', align: 'left' })
    .data(firstPart)
    .encode(
      vl.x().mean('Drop_Rates'),
      vl.text().mean('Drop_Rates').format('0.2f'),
      vl.y().value(65)
    );

  // Text for the mean value of secondPart
  const text2 = vl.markText({ color: '#0E4C92', align: 'left' })
    .data(secondPart)
    .encode(
      vl.x().mean('Drop_Rates'),
      vl.text().mean('Drop_Rates').format('0.2f'),
      vl.y().value(20),

    );

  // Additional labels for the time periods
  const additionalText = vl.markText({ color: '#E45756CC', align: 'center', fontSize: 14 })
    .data([{ text: 'Games Released Between 2012 - 2017' }])
    .encode(
      vl.text().fieldN('text'),
      vl.y().value(65),
      vl.x().value(630)
    );

  const additionalText2 = vl.markText({
    color: '#0E4C92', align: 'center', fontSize: 14
  })
    .data([{ text: 'Games Released Between 2018 - 2024' }])
    .encode(
      vl.text().fieldN('text'),
      vl.y().value(20),
      vl.x().value(510)
    );

  // Combine all layers
  const combinedVis6 = vl.layer(range1, range2, firstVer, secondVer, text1, text2, additionalText, additionalText2
  )
    .title("Average Drop Rates for Gacha Games (2012 - 2024)")
    .width("container")
    .height(100)
    .toSpec();

  // Render the visualization
  vegaEmbed("#vis6", combinedVis6).then((result) => {
    view = result.view;
    view.run();
  });

  //vis 5
  const uniqueGame = [...new Set(GachaData.map(game => game.Title))];
uniqueGame.sort();

const dropdownGame = document.getElementById('dropdownMenu');

// Set "Love and Deepspace" as the initial selected game
let initialTitle = "Love and Deepspace"; 

// If "Love and Deepspace" is not in the data, use the first title as fallback
if (!uniqueGame.includes(initialTitle)) {
  initialTitle = uniqueGame[0]; 
}

// Populate the dropdown menu
uniqueGame.forEach(title => {
  const option = document.createElement('option');
  option.value = title;
  option.textContent = title;
  dropdownGame.appendChild(option);
});

// Set the dropdown's selected value to "Love and Deepspace" or the fallback
dropdownGame.value = initialTitle;

function renderCharts(selectedTitle) {
  const filteredData = GachaData.filter(game => game.Title === selectedTitle);

  const stackedData = filteredData.flatMap(game => [
    { Month: game.Month, Region: 'Global', Revenue: +game.Global_Rev || 0 },
    { Month: game.Month, Region: 'Japan', Revenue: +game.JP_Rev || 0 },
    { Month: game.Month, Region: 'China', Revenue: +game.CN_Rev || 0 }
  ]);

  // Calculate total revenue by region for the selected game
  const totalSalesByRegion = {
    Global: filteredData.reduce((sum, game) => sum + parseInt(game.Global_Rev || 0, 10), 0),
    Japan: filteredData.reduce((sum, game) => sum + parseInt(game.JP_Rev || 0, 10), 0),
    China: filteredData.reduce((sum, game) => sum + parseInt(game.CN_Rev || 0, 10), 0)
  };    

  // Determine the region with the highest total revenue
  const maxRegion = Object.entries(totalSalesByRegion)
    .reduce((max, entry) => (entry[1] > max[1] ? entry : max))[0];

  const regionColors = {
    Global: maxRegion === "Global" ? '#FB4444' : '#cccccc',
    Japan: maxRegion === "Japan" ? '#4C78A8' : '#B4B4B4',
    China: maxRegion === "China" ? '#FBBD44' : '#A4A4A4'
  };

  const stackedChart = vl.markBar()
    .data(stackedData)
    .title(`Revenue Breakdown by Region for ${selectedTitle}`)
    .encode(
      vl.x().fieldO('Month')
        .title("Month")
        .sort(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'])
        .axis({ labelAngle: 0 }),
      vl.y().fieldQ('Revenue')
        .title("Revenue (in millions)")
        .aggregate('sum'),
      vl.color().fieldN('Region')
        .title("Region")
        .scale({
          domain: ['Global', 'Japan', 'China'],
          range: [regionColors.Global, regionColors.Japan, regionColors.China]
        }),
      vl.tooltip(['Month', 'Region', 'Revenue'])
    )
    .width(vis5ContainerWidth)
    .height(500);

  // Calculate counts for the region-max chart
  const regionCounts = { Global: 0, Japan: 0, China: 0 };
  uniqueGame.forEach(title => {
    const gameData = GachaData.filter(game => game.Title === title);
    const totalRevenue = {
      Global: gameData.reduce((sum, game) => sum + parseInt(game.Global_Rev || 0), 0),
      Japan: gameData.reduce((sum, game) => sum + parseInt(game.JP_Rev || 0), 0),
      China: gameData.reduce((sum, game) => sum + parseInt(game.CN_Rev || 0), 0)
    };

    const highestRegion = Object.entries(totalRevenue)
      .reduce((max, entry) => (entry[1] > max[1] ? entry : max))[0];
    regionCounts[highestRegion]++;
  });

  // Prepare data for the region-max bar chart
  const regionMaxRevenueData = [
    { Region: 'Global', Count: regionCounts.Global },
    { Region: 'Japan', Count: regionCounts.Japan },
    { Region: 'China', Count: regionCounts.China }
  ];

  const regionMaxChart = vl.markBar()
    .data(regionMaxRevenueData)
    .title("Which Region Generally Had the Most Revenue")
    .encode(
      vl.y().fieldN('Region').title(""),
      vl.x().fieldQ('Count').title("Count"),
      vl.color().fieldN('Region'),
      vl.tooltip(['Region', 'Count'])
    )
    .width(vis52ContainerWidth)
    .height(200);

  const combinedVis = vl.hconcat(stackedChart, regionMaxChart)
    .spacing(20)
    .toSpec();

  vegaEmbed("#vis5", combinedVis, { renderer: 'svg', actions: false })
    .then(result => {
      const view = result.view;
      view.run();
    })
    .catch(console.error);
}

// Render the initial charts for "Love and Deepspace" or fallback
renderCharts(initialTitle);

// Add event listener for dropdown changes
dropdownGame.addEventListener('change', (event) => {
  const selectedTitle = event.target.value;
  renderCharts(selectedTitle);
});

}
render();


document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll(".observe-section");

  const observerOptions = {
    root: null,
    threshold: 0.1,
  };

  const observerCallback = (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        entry.target.classList.remove("hidden");

        observer.unobserve(entry.target); // Stop observing once it's visible
      }
    });
  };

  const observer = new IntersectionObserver(observerCallback, observerOptions);
  sections.forEach((section) => observer.observe(section));
});

document.addEventListener("DOMContentLoaded", () => {
  const dots = document.querySelectorAll(".dot");
  const sections = document.querySelectorAll(".sectionIntro");

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    section.scrollIntoView({ behavior: "smooth" });
  };

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      const sectionId = `section${index + 1}`;
      scrollToSection(sectionId);
    });
  });

  const updateActiveDot = () => {
    let activeIndex = -1;

    sections.forEach((section, index) => {
      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (
        rect.top <= viewportHeight * 0.5 &&
        rect.bottom >= viewportHeight * 0.5
      ) {
        activeIndex = index;
      }
    });

    if (activeIndex !== -1) {
      dots.forEach((dot, index) => {
        dot.classList.toggle("active", index === activeIndex);
      });
    }
  };

  window.addEventListener("load", updateActiveDot);

  window.addEventListener("scroll", updateActiveDot);
});

const marketData = [
  { year: 2023, market_size: 461.4 },
  { year: 2024, market_size: 461.4 * (1 + 0.088) },
  { year: 2025, market_size: 461.4 * (1 + 0.088) ** 2 },
  { year: 2026, market_size: 461.4 * (1 + 0.088) ** 3 },
  { year: 2027, market_size: 461.4 * (1 + 0.088) ** 4 },
  { year: 2028, market_size: 461.4 * (1 + 0.088) ** 5 },
  { year: 2029, market_size: 461.4 * (1 + 0.088) ** 6 },
  { year: 2030, market_size: 461.4 * (1 + 0.088) ** 7 },
  { year: 2031, market_size: 461.4 * (1 + 0.088) ** 8 },
  { year: 2032, market_size: 461.4 * (1 + 0.088) ** 9 }
];

// Vis for cgpa growth
const spec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": "The Global Gacha Games Market Grows Exponentially (2023-2032)",
  "mark": {
    "type": "area",
    "clip": true
  },
  "encoding": {
    "x": {
      "field": "year",
      "type": "ordinal",
      "title": "Year",
      "axis": {
        "labelAngle": 0
      }
    },
    "y": {
      "field": "market_size",
      "type": "quantitative",
      "title": "Market Size (USD Million)"
    },
    "color": {
      "value": "lightblue"
    }
  },
  "data": {
    "values": marketData
  },
  "width": "container",
  "height": 400,
  "layer": [
    {
      "mark": "area",
      "encoding": {
        "x": {
          "field": "year",
          "type": "ordinal",
          "title": "Year",
          "axis": {
            "labelAngle": 0
          }
        },
        "y": {
          "field": "market_size",
          "type": "quantitative",
          "title": "Market Size (USD Million)"
        },
        "color": {
          "value": "lightblue"
        }
      }
    },
    {
      "mark": {
        "type": "circle",
        "size": 50
      },
      "encoding": {
        "x": {
          "field": "year",
          "type": "ordinal",
          "title": "Year"
        },
        "y": {
          "field": "market_size",
          "type": "quantitative",
          "title": "Market Size (USD Million)"
        },
        "color": {
          "value": "black"
        },
        "tooltip": [
          { "field": "year", "type": "ordinal", "title": "Year" },
          { "field": "market_size", "type": "quantitative", "title": "Market Size (USD Million)", "format": ".1f" }
        ]
      }
    }
  ]
};

vegaEmbed('#gachaMarketTrend', spec);
