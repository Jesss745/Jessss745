const carousels = {
  carousel1: { currentIndex: 0 },
  carousel2: { currentIndex: 0 },
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
      vl.color().fieldN("Genre").title("Game Genre") // Match colors for genres
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
    .width(450)
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
    .width(400)
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
      vl.color().fieldO('Title').legend(null),
      vl.opacity().value(0.3)
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
    .title("Honkai's Star Rail Generated the Most Revenue in 2024")
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
      vl.color().value('lightgray').if(click, vl.color().fieldN('Genre').title('Movie Genres')),
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
    .width(450)
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
      vl.x().count('Title').title('Breakdown of Game Genre'),
      vl.y().fieldN('Genre').title('Game Genre'),
      vl.color().value('lightgray').if(click, vl.color().fieldN('Genre'))
    )
    .width(400)
    .height(400)
    .toSpec();

  const combinedVis4 = vl.vconcat(scatterData, vl.hconcat(genreBreakdown, reviewsChart)).toSpec();

  vegaEmbed("#vis4", combinedVis4).then((result) => {
    view = result.vis4;
    view.run();
  });
  dropdown1.addEventListener('change', updateChart);
  dropdown2.addEventListener('change', updateChart);
  
  //Vis 6
  const firstVer = vl.markPoint({ color: '#E45756CC' })
    .data(firstPart)
    .encode(
      vl.x().fieldQ('Drop_Rates').aggregate("average").title("DropRates"),
    )

  const secondVer = vl.markPoint({ color: '#0E4C92' })
    .data(secondPart)
    .encode(
      vl.x().fieldQ('Drop_Rates').aggregate("average").title("DropRates"),
    )

  const text1 = vl.markText({ color: '#E45756CC', align: 'left', dx: 10 })
    .data(firstPart)
    .encode(
      vl.x().mean('Drop_Rates'),
      vl.text().mean('Drop_Rates').format('0.2f'),
    )

  const text2 = vl.markText({ color: '#0E4C92', align: 'left', dx: 10 })
    .data(secondPart)
    .encode(
      vl.x().mean('Drop_Rates'),
      vl.text().mean('Drop_Rates').format('0.2f'),
    )

  const additionalText = vl.markText({ color: '#E45756CC', align: 'center', dy: -20, dx: 370, fontSize: 14 })
    .data([{ text: '2012 - 2017' }])
    .encode(
      vl.text().fieldN('text')
    );

  const additionalText2 = vl.markText({ color: '#0E4C92', align: 'center', dy: 20, dx: 320, fontSize: 14 })
    .data([{ text: '2018 - 2024' }])
    .encode(
      vl.text().fieldN('text')
    );

  const combinedVis6 = vl.layer(firstVer, secondVer, text1, text2, additionalText, additionalText2)
    .title("Average drop rates for gacha games is higher back in 2012 - 2017")
    .width("container")
    .height(100)
    .toSpec();

  vegaEmbed("#vis6", combinedVis6).then((result) => {
    view = result.vis6;
    view.run();
  });


  //vis 5
const uniqueGame = [...new Set(GachaData.map(game => game.Title))];
uniqueGame.sort();

const dropdownGame = document.getElementById('dropdownMenu');
uniqueGame.forEach(title => {
  const option = document.createElement('option');
  option.value = title;
  option.textContent = title;
  dropdownGame.appendChild(option);
});

function renderCharts(selectedTitle) {
  const filteredData = GachaData.filter(game => game.Title === selectedTitle);

  // Global Revenue Chart
  const GlobalRev = vl.markBar()
    .data(filteredData)
    .title(`Sales by Month (Global) for ${selectedTitle}`)
    .encode(
      vl.x().fieldO('Month')
        .title("Month")
        .sort(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'])
        .axis({ labelAngle: 0 }),
      vl.y().fieldQ('Global_Rev')
        .title("Total units sold in millions")
        .aggregate('sum'),
      vl.tooltip(['Month', 'Global_Rev']),
      vl.color().value('grey')
    )
    .width("container")
    .height(300);

  // JP Revenue Chart
  const jpRev = vl.markBar()
    .data(filteredData)
    .title(`Sales by Month (Japan) for ${selectedTitle}`)
    .encode(
      vl.x().fieldO('Month')
        .title("Month")
        .sort(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'])
        .axis({ labelAngle: 0 }),
      vl.y().fieldQ('JP_Rev')
        .title("Total units sold in millions")
        .aggregate('sum'),
      vl.tooltip(['Month', 'JP_Rev']),
      vl.color().value('grey')
    )
    .width("container")
    .height(300);

  // CN Revenue Chart
  const cnRev = vl.markBar()
    .data(filteredData)
    .title(`Sales by Month (China) for ${selectedTitle}`)
    .encode(
      vl.x().fieldO('Month')
        .title("Month")
        .sort(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'])
        .axis({ labelAngle: 0 }),
      vl.y().fieldQ('CN_Rev')
        .title("Total units sold in millions")
        .aggregate('sum'),
      vl.tooltip(['Month', 'CN_Rev']),
      vl.color().value('grey')
    )
    .width("container")
    .height(300);

  const combinedVisRegion = vl.vconcat(GlobalRev, jpRev, cnRev)
    .title(`Sales Breakdown for ${selectedTitle}`)
    .spacing(20)
    .toSpec();

  vegaEmbed("#vis5", combinedVisRegion, { renderer: 'svg', actions: false })
    .then(result => {
      const view = result.view;
      view.run();
    })
    .catch(console.error);
}

dropdownGame.addEventListener('change', (event) => {
  const selectedTitle = event.target.value;
  renderCharts(selectedTitle);
});

if (uniqueGame.length > 0) {
  renderCharts(uniqueGame[0]); 
}

}
render();


document.addEventListener("DOMContentLoaded", () => {
  const gachaSection = document.querySelector(".gacha_games");
  const gachaSection2 = document.querySelector(".what_gacha");
  const gachaSection3 = document.querySelector(".lootbox");

  const observerOptions = {
    root: null,
    threshold: 0.2,
  };

  const observerCallback = (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        entry.target.classList.remove("hidden");

        observer.unobserve(entry.target);
      }
    });
  };

  const observer = new IntersectionObserver(observerCallback, observerOptions);
  // Observe both sections separately
  observer.observe(gachaSection);
  observer.observe(gachaSection2);
  observer.observe(gachaSection3);

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
      "title": "Market Size (USD Million)",
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
      "mark": "text",
      "encoding": {
        "x": {
          "field": "year",
          "type": "ordinal",
          "title": "Year",
        },
        "y": {
          "field": "market_size",
          "type": "quantitative",
          "title": "Market Size (USD Million)",
        },
        "text": {
          "field": "market_size",
          "type": "quantitative",
          "format": ".1f"
        },
        "color": {
          "value": "black"
        },
        "align": {
          "value": "center"
        },
        "baseline": {
          "value": "bottom"
        },
        "fontSize": {
          "value": 12
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
          "title": "Year",
        },
        "y": {
          "field": "market_size",
          "type": "quantitative",
          "title": "Market Size (USD Million)",
        },
        "color": {
          "value": "black"
        }
      }
    }
  ]
};

vegaEmbed('#gachaMarketTrend', spec);