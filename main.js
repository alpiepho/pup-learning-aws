fs = require('fs');

base = require('./base');
site = require('./site');

const HTML_FILE = "./public/index.html";
const MD_FILE = "./artifacts/learning-aws-summary.mdx";
const SCREENSHOT_DIR = "./screenshots";

const html1 = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width", initial-scale=1.0"/>
    <meta name="Description" content="LinkedIn Learning Courses Completed">
    <meta name="theme-color" content="#d36060"/>
    <title>
    AWS Training Courses Completed
    </title>
    <link rel="stylesheet" href="./style.css" />
    <link rel="manifest" href="./manifest.json" />
    <link rel="icon"
      type="image/png" 
      href="./favicon.ico" />
  </head>
  <body class="body">
    <main>
    <article class="page">
      <h1  id=\"top\">AWS Training Courses Completed</h1>

      <div class="introduction">
      <p>
      This a summary of all the AWS Training courses I have completed.  These are the
      free online courses.
      </p>
      <p>
      This list is generated from a tool called "pup-learning-aws" that can be found
      <a
        href="https://github.com/alpiepho/pup-learning-aws"
        target="_blank"
        rel="noreferrer"
      >here</a>.  This tool needs to be run manually to parse the AWS Training
      site to gather the list of courses I have taken.
      </p>
      </div>
`;

const html2 = `
    <div id=\"bottom\"></div>
    </article>
  </body>
</html>
`;

const md1 = `---
title: LinkedIn Completed Courses
date: "2020-06-04"
description: "Summary of my AWS Training Completed Courses"
---

This a summary of all the AWS Training courses I have completed.  These are the
free online courses.

A full summary with more details can be found [here](https://alpiepho.github.io/pup-learning-aws/).

#### top

`;

const md2 = `

#### bottom
`;

function build_hours_minutes(data) {
  // Derive timestamps and duration, sort
  // examples
  // "duration": "5 1/2 HOURS",
  // "duration": "2 HOURS",
  // "duration": "100 MINUTES",

  let totalSec = 0;
  data['completed-courses'].forEach(entry => {
    // assume "An Bm" or "Bm"
    let parts = entry['duration'].split(' ');
    if (parts.length == 2) {
      val = parseInt(parts[0]);
      if (parts[1] == "MINUTES")
        totalSec += val*60; 
      if (parts[1] == "HOURS")
        totalSec += val*60*60; 
    }
    if (parts.length == 3) {
      val = parseInt(parts[0]);
      totalSec += val*60*60; 
      totalSec += 30*60; 
    }
    entry['completed-ts'] = Date.parse(entry['registration-date']); // assume registration and completion are close
  });

  let totalMin = Math.floor(totalSec / 60);
  totalH = Math.floor(totalMin / 60); 
  totalM = totalMin - (totalH*60);
  return [totalH, totalM];
}

function build_html(data, totalH, totalM) {
  // generate artifacts from data - html
  let htmlStr = html1;
  htmlStr += "      <br/><p>Totals - Course: " + data['completed-courses'].length + ", Time: " + totalH + "h " + totalM + "m</p><br/>\n\n";
  htmlStr += "      <ul>\n";
  data['completed-courses'].forEach(entry => {
    htmlStr += "            <li>\n";
    temp = "";
    if (entry['type'] ==  "E-LEARNING") temp = "hr_e_learning";
    if (entry['type'] ==  "LEARNING PATH") temp = "hr_learning_path";
    if (entry['type'] ==  "CURRICULUM") temp = "hr_curriculum";
    if (entry['type'] ==  "VIDEO") temp = "hr_video";
    if (entry['type'] ==  "COURSE") temp = "hr_course";
    htmlStr += "              <hr class=\"" + temp + "\">\n";
    htmlStr += "              <ul>\n";
    htmlStr += "                <li>\n";
    htmlStr += "                  <a target=\"_blank\" href=\"" + entry['link'] + "\">\n";
    htmlStr += "                    " + entry['title'] + "\n";
    htmlStr += "                  </a>  ";
    htmlStr += "                </li>\n";
    htmlStr += "                <li class=\"type\">" + entry['type'].toLowerCase() + "</li>\n";
    htmlStr += "                <li class=\"level\">" + entry['level'].toLowerCase() + "</li>\n";
    htmlStr += "                <li class=\"duration\">" + entry['duration'].toLowerCase() + "</li>\n";
    htmlStr += "                <li class=\"completed\"><i>Completed: " + entry['registration-date'] + "</i></li>\n";
    htmlStr += "                <li class=\"description\">" + entry['description'] + "</li>\n";
    htmlStr += "                <li class=\"topbottom\"><a href=\"#top\">top</a> / <a href=\"#bottom\">bottom</a></li>\n";
    htmlStr += "              </ul>\n";
    htmlStr += "            </li>\n";
  });
  htmlStr += "      </ul>";
  htmlStr += html2;
  fs.writeFileSync(HTML_FILE, htmlStr);
}

function build_md(data, totalH, totalM) {
  // generate markdown (.mdx) for blog
  let mdStr = md1;
  mdStr += "Total Completed Courses: " + data['completed-courses'].length + ", Time: " + totalH + "h " + totalM + "m\n";
  mdStr += "<br/>\n";
  mdStr += "<br/>\n";
  mdStr += "<br/>\n";
  mdStr += "\n";
  data['completed-courses'].forEach(entry => {
    mdStr += "\n";
    mdStr += "\n";
    mdStr += "[" + entry['title'] + "](" + entry['link'] + ")\n";
    mdStr += "- Type: " + entry['type'].toLowerCase() + "\n";
    mdStr += "- Level: " + entry['level'].toLowerCase() + "\n";
    mdStr += "- Duration: " + entry['duration'].toLowerCase() + "\n";
    mdStr += "- Completed: " + entry['registration-date'] + "\n";
    mdStr += "- Description: " + entry['description'] + "\n";
    mdStr += "- [top](#top) / [bottom](#bottom)\n";

    mdStr += "<br/>\n";
    mdStr += "<br/>\n";
    mdStr += "<br/>\n";
      mdStr += "\n";
  });
  mdStr += md2;
  fs.writeFileSync(MD_FILE, mdStr);
}

const main = async () => {
  // INTERNAL OPTIONS
  options = { 
    browserType:     "firefox", // "chrome, firefox" // WARNING: hit limit on number of detail pages with firefox
    headless:        false,     // run without windows
    forceFullGather:  true,     // skip test for number of course
    scrollToBottom:   true,     // scroll page to bottom (WARNING: non-visible thumbnails are not loaded until page is scrolled)
    gatherDetails:    true,     // parse the details
    useSampleData:   true,     // skip browser and use sample data file
    saveSampleData:   true,     // save to sample data file
    screenshot:      false,     // take snapshots
    screenshotDir:   SCREENSHOT_DIR
  }
  const browser = await base.browser_init(options);
  if (!options.useSampleData) {
    options.version = await browser.version();
  }
  console.log("options:");
  console.log(options);

  // login, get list of completed courses, logout
  data = {}
  await site.process_completed(browser, options, data);
  await base.browser_close(browser);

  //DEBUG
  // console.log("data:");
  // console.log(JSON.stringify(data, null, space=2));

  if (data['completed-courses'].length > 0) {
    [totalH, totalM] = build_hours_minutes(data);
    data['completed-courses'].sort((a, b) => (a['completed-ts'] < b['completed-ts']) ? 1 : -1) // decending
    build_html(data, totalH, totalM);
    build_md(data, totalH, totalM);
  }

  console.log("done.");
};

main();

  
  
