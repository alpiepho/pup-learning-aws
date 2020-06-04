require("dotenv").config();
base = require('./base');
fs = require('fs');

PUP_URL_BASE="https://www.aws.training";

// in ms
PAGE_WAIT = 1000;
PAGE_WAIT_COMPLETED = 3000;
PAGE_WAIT_DETAILS = 3000;
PAGE_WAIT_DETAILS_RETRY = 20000;

const SAMPLE_FILE = "./artifacts/sample.json";


const sampleData = require(SAMPLE_FILE);


const process_course_details = async (page, options, href) => {
  console.log("process_course_details: " + href);
  var newdata = {};
  newdata['description'] = "";
  newdata['duration'] = "";
  newdata['level'] = "";
  newdata['prereqsuisites'] = "";

  await base.browser_get_filtered(page, href, PAGE_WAIT_DETAILS);

  newdata = await page.evaluate(() => {
    let result = {};
    // parse: courses
    result['description'] = "";
    result['duration'] = "";
    result['level'] = "";
    result['prereqsuisites'] = [];
    result['type'] = "";

    //#app-root > div.page > div.css-70bgut > div.css-16a6yr3 > div.css-t6x1i7 > header > div > div:nth-child(1) > span > span
    temp = document.querySelectorAll('div [data-testid="LoDetailsLoDescriptionText"] div p');
    if (temp.length) {
      result['description'] = temp[0].innerText;
    }

    temp = document.querySelectorAll('span:nth-child(2)');
    if (temp.length) {
      result['type'] = temp[0].innerText;
      result['level'] = temp[1].innerText;
      result['duration'] = temp[3].innerText;
    }

    temp = document.querySelectorAll('div [data-testid="LoDetailsLoDescriptionText"] a');
    for (index = 0; index < temp.length; index++) {
      entry = {}
      entry['title'] = temp[index].innerText;
      entry['href'] = temp[index].href;
      result['prereqsuisites'].push(entry);
    }
    return result;
  });

  //console.log("process_course_details done");
  //console.log(newdata)
  return [newdata['description'], newdata['level'], newdata['duration'], newdata['prereqsuisites'], newdata['type']];
};

const process_completed = async (browser, options, data) => {
  //console.log("process_completed");
  var newdata;

  if (options.useSampleData) {
    newdata = sampleData;
  } else {
    const page = await base.browser_get(
      browser,
      PUP_URL_BASE,
      PAGE_WAIT_COMPLETED
    );

    newdata = {};
    newdata['completed-courses'] = []

    // manually parse transcript.html (from Chrome inspect copy-outer-html after logging in, AWS is detecting puppeteer automnation and blocking login)
    var contentHtml = fs.readFileSync('./transcript.html', 'utf8');
    console.log(contentHtml.length)
    var index1 = 0;
    var index2 = 0;
    while (index1 != -1 && index1 < contentHtml.length) {
      // ex. <td data-label="Description"><span><a href="/Details/Curriculum?id=33308">Internet of Things (IoT) Microcontrollers Series</a></span></td><td data-label="Registration Date"><span>2 June, 2020</span>
      let entry = {};
      index1 = contentHtml.indexOf('td data-label="Description"><span><a href="', index1);
      if (index1 == -1) break;
      index1 += 'td data-label="Description"><span><a href="'.length;
      index2 = contentHtml.indexOf('">', index1);
      entry['link'] = PUP_URL_BASE + contentHtml.substring(index1, index2);
      index1 = index2;

      index1 += '">'.length;
      index2 = contentHtml.indexOf('</a></span></td>', index1);
      entry['title'] = contentHtml.substring(index1, index2);
      index1 = index2;

      index1 = contentHtml.indexOf('td data-label="Registration Date"><span>', index1);
      if (index1 == -1) break;
      index1 += 'td data-label="Registration Date"><span>'.length;
      index2 = contentHtml.indexOf('</span>', index1);
      entry['registration-date'] = contentHtml.substring(index1, index2);
      index1 = index2;

      newdata['completed-courses'].push(entry);
    }

    if (options.saveSampleData) {
      fs.writeFileSync(SAMPLE_FILE, JSON.stringify(newdata, null, 2));
    }

    if (options.gatherDetails) {
      var filteredPage = await base.browser_prep_filtered(browser);
      for (i=0; i<newdata['completed-courses'].length; i++) {
        if (!newdata['completed-courses'][i]['details']) {
          console.log(i);
          [temp1, temp2, temp3, temp4, temp5] = await process_course_details(filteredPage, options, newdata['completed-courses'][i]['link']);
          newdata['completed-courses'][i]['description']    = temp1;
          newdata['completed-courses'][i]['level']          = temp2;
          newdata['completed-courses'][i]['duration']       = temp3;
          newdata['completed-courses'][i]['prereqsuisites'] = temp4;
          newdata['completed-courses'][i]['type']           = temp5;
        }
      }
    }

    if (options.saveSampleData) {
      fs.writeFileSync(SAMPLE_FILE, JSON.stringify(newdata, null, 2));
    }
  }

   data['completed-courses'] = newdata['completed-courses'];
  //console.log("process_completed done");
};



exports.process_course_details = process_course_details;
exports.process_completed = process_completed;
