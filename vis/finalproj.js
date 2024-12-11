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
  const filterSet = ['Honkai: Star Rail', 'Naruto Mobile and', 'Monster Strike',
    'Genshin Impact', 'Love and Deepspace', 'Fate/Grand Order', 'Dragon Ball Z Dokkan Battle',
    'Arknights', 'Zenless Zone Zero', 'Uma Musume: Pretty Derby', 'AFK Journey'

  ];
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

  //const combinedSpec = vl.vconcat(allSales, vl.hconcat(genreCount, yearOut)).toSpec();
  const combinedSpec = vl.vconcat(vl.hconcat(genreCount, yearOut), allSales).toSpec();

  vegaEmbed("#vis1", combinedSpec).then((result) => {
    const view = result.vis1;
    view.run();
  });

  //Vis 2 - Top 10 best selling game by months
  // Honkai Chart
  const honkaiChart = vl.markLine()
    .data(Honkai) // Replace with your actual dataset
    .encode(
      vl.x().fieldO('Month')
        .title("Month")
        .sort(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'])
        .axis({ labelAngle: 0 }), // Horizontal orientation of labels
      vl.y().fieldQ('Overal_Rev').title("Total Revenue (Million)").aggregate('sum'),
      vl.tooltip(['Title', 'Genre']),
      vl.color().value('red')
    );

  // Gacha Games Chart
  const allOtherGames = vl.markLine()
    .data(GachaData) // Replace with your actual dataset
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

  // Combine Charts and Annotations
  const vis2Spec = vl.layer(allOtherGames, honkaiChart, annotation)
    .width("container") // Fixed numeric width
    .height(400)
    .title("Honkai's Star Rail Generated the Most Revenue in 2024")
    .toSpec();

  // Render Visualization
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
      return; // No selection or invalid selections
    }
    // Filter data for selected titles
    const gameschecked = GachaData.filter(game => game.Title === title1 || game.Title === title2);

    const selection = vl.selectPoint();
    const vis3Spec = vl
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

    // Embed the updated chart
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
      // vl.x().fieldQ('rating').bin({step: 0.5}),
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

  // Callback function for the observer
  const observerCallback = (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Reveal the section when it is in view
        entry.target.classList.add("visible");
        entry.target.classList.remove("hidden");

        // Optional: Stop observing once the section is visible
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

  // Add click events to dots
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      const sectionId = `section${index + 1}`;
      scrollToSection(sectionId);
    });
  });

  // Update active dot based on scroll position
  const updateActiveDot = () => {
    let activeIndex = -1;

    sections.forEach((section, index) => {
      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Check if the section is in view (center of viewport)
      if (
        rect.top <= viewportHeight * 0.5 &&
        rect.bottom >= viewportHeight * 0.5
      ) {
        activeIndex = index;
      }
    });

    // If no section is explicitly in view, keep the current active dot
    if (activeIndex !== -1) {
      dots.forEach((dot, index) => {
        dot.classList.toggle("active", index === activeIndex);
      });
    }
  };

  // Initialize active dot on page load
  window.addEventListener("load", updateActiveDot);

  // Update active dot on scroll
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

// Vega-Lite specification for the area chart
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

  // Layer for the area chart and labels with circles
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

// Embed the Vega-Lite visualization into the chart div
vegaEmbed('#gachaMarketTrend', spec);