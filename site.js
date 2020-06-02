require("dotenv").config();
base = require('./base');
fs = require('fs');

PUP_URL_BASE="https://www.aws.training";
//PUP_URL_LOGIN="https://www.aws.training/SignIn?returnUrl=%2F"; // //PUP_URL_BASE + "/Account/LogOn?identityProvider=AmazonNA&amp;returnUrl=%2F"
PUP_URL_LOGIN=PUP_URL_BASE + "/Account/LogOn?identityProvider=AmazonNA&amp;returnUrl=%2F"

PUP_URL_COMPLETED=PUP_URL_BASE + "/Account/Transcript/Archived"

// PUP_URL_LOGOUT=PUP_URL_BASE+"/logout";

// in ms
PAGE_WAIT = 1000;
PAGE_WAIT_LOGIN = 2000;
PAGE_WAIT_LOGIN_DONE = 5000;
PAGE_WAIT_COMPLETED = 3000;
PAGE_WAIT_DETAILS = 3000;
PAGE_WAIT_DETAILS_RETRY = 20000;

const SAMPLE_FILE = "./artifacts/sample.json";


const sampleData = require(SAMPLE_FILE);

const process_login = async (browser, options) => {
  if (options.useSampleData) {
    return;
  }
  var waitMs = PAGE_WAIT_LOGIN + base.random_int(100);
  //console.log('process_login')
  const page = await base.browser_get(browser, PUP_URL_LOGIN, (waitMs));
  await base.process_options(browser, options);
  await page.type('#ap_email', process.env.PUP_USERNAME);
  await base.delay(waitMs);
  await page.type('#ap_password', process.env.PUP_PASSWORD);
  await base.delay(waitMs);
  await page.click('#signInSubmit'); // Password page "Sign-in"
  await base.delay(PAGE_WAIT_LOGIN_DONE);
  await base.process_options(browser, options);
  //console.log("process_login done")
};

const process_logout = async (browser, options) => {
  if (options.useSampleData) {
    return;
  }
  // //console.log('process_logout')
  // const page = await base.browser_get(browser, PUP_URL_LOGOUT, PAGE_WAIT);
  // //console.log("process_logout done")
};

// async function auto_scroll(page) {
//   await page.evaluate(async () => {
//     await new Promise((resolve, reject) => {
//       var totalHeight = 0;
//       var distance = 400;
//       var timer = setInterval(() => {
//         var scrollHeight = document.body.scrollHeight;
//         window.scrollBy(0, distance);
//         totalHeight += distance;

//         if (totalHeight >= scrollHeight) {
//           clearInterval(timer);
//           resolve();
//         }
//       }, 1000);
//     });
//   });
// }

// const process_course_details = async (page, options, href) => {
//   console.log("process_course_details: " + href);
//   var newdata = {};
//   newdata['linkedin'] = "";
//   newdata['details'] = "";
  
//   await base.browser_get_filtered(page, href, PAGE_WAIT_DETAILS);

//   newdata = await page.evaluate(() => {
//     let result = {};
//     // parse: courses
//     // TODO:
//     //  - course toc
//     //    - sections
//     //      - title
//     //      - subsections
//     //        - title
//     //        - description
//     //        - durration
//     //  - course exercise files?
//     //  - **could** also grab transcript???
//     // WARNING: with limit on number of detail pages, will need to start with clear sample.json and rebuild saved details if any more details are parsed

//     result['linkedin'] = "";
//     result['details'] = "";
//     a = document.querySelectorAll('a.course-author-entity__meta-action');
//     if (a.length) {
//       result['linkedin'] = a[0].href;
//     }
//     a = document.querySelectorAll('.classroom-layout-panel-layout__main p');
//     if (a.length) {
//       result['details'] = a[0].innerText;
//     }
//     return result;
//   });

//   //console.log("process_course_details done");
//   return [newdata['linkedin'], newdata['details']];
// };

const process_completed = async (browser, options, data) => {
  //console.log("process_completed");
  var newdata;

  if (options.useSampleData) {
    newdata = sampleData;
  } else {
    const page = await base.browser_get(
      browser,
      PUP_URL_COMPLETED,
      PAGE_WAIT_COMPLETED
    );

    // if (options.scrollToBottom) {
    //   await auto_scroll(page);
    // }

    await base.delay(PAGE_WAIT_COMPLETED);
    await base.process_options(browser, options);

    newdata = await page.evaluate(() => {
      let result = {};
      result['completed-courses'] = []
      let card_conts = document.querySelectorAll('table tr td[data-label="Description"]');
      for (i=0; i<card_conts.length; i++) {
        let entry = {};
        entry['description'] = card_conts[i].querySelector('a').innerText;
        entry['href'] = card_conts[i].querySelector('a').href;
        entry['registration-date'] = card_conts[i].parentElement.querySelector('td[data-label="Registration Date"]').innerText;
        entry['status'] = card_conts[i].parentElement.querySelector('td[data-label="Status"]').innerText;
        result['completed-courses'].push(entry);
      }
      return result;
    });

    // if (options.gatherDetails) {
    //   var filteredPage = await base.browser_prep_filtered(browser);
    //   for (i=0; i<newdata['completed-courses'].length; i++) {
    //     if (!newdata['completed-courses'][i]['details']) {
    //       console.log(i);
    //       [temp1, temp2] = await process_course_details(filteredPage, options, newdata['completed-courses'][i]['link']);
    //       newdata['completed-courses'][i]['linkedin'] = temp1;
    //       newdata['completed-courses'][i]['details'] = temp2;
    //       if (!temp2) {
    //         // retry
    //         console.log(i);
    //         await base.delay(PAGE_WAIT_DETAILS_RETRY);
    //         [temp1, temp2] = await process_course_details(filteredPage, options, newdata['completed-courses'][i]['link']);
    //         newdata['completed-courses'][i]['linkedin'] = temp1;
    //         newdata['completed-courses'][i]['details'] = temp2;  
    //           if (!temp2) {
    //             // retry
    //             console.log(i);
    //             await base.delay(PAGE_WAIT_DETAILS_RETRY);
    //             [temp1, temp2] = await process_course_details(filteredPage, options, newdata['completed-courses'][i]['link']);
    //             newdata['completed-courses'][i]['linkedin'] = temp1;
    //             newdata['completed-courses'][i]['details'] = temp2;  
    //           }
    //         }
    //     }
    //   }
    // }

    if (options.saveSampleData) {
      fs.writeFileSync(SAMPLE_FILE, JSON.stringify(newdata, null, 2));
    }
  }

   data['completed-courses'] = newdata['completed-courses'];
  //console.log("process_completed done");
};



exports.process_login = process_login;
exports.process_logout = process_logout;
// exports.process_course_details = process_course_details;
exports.process_completed = process_completed;
