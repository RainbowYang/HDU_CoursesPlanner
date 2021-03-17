require('chromedriver')
const webdriver = require('selenium-webdriver')
const until = webdriver.until
const By = webdriver.By
const fs = require('fs')
const { id, password } = require('./config.json')

const Crawler = require('crawler')
list = [];

(async function () {
  try {
    return require('./data.json')
  } catch (e) {

    const driver = new webdriver.Builder().forBrowser('chrome').build()

    await driver.get('https://i.hdu.edu.cn/')

    await driver.findElement(By.id('un')).sendKeys(id)
    await driver.findElement(By.id('pd')).sendKeys(password)

    await driver.findElement(By.id('index_login_btn')).click()
    await driver.wait(until.titleIs('智慧杭电'))
    await driver.get('http://elearning.hdu.edu.cn/sso/hdu')
    await driver.wait(until.titleIs('杭州电子科技大学泛雅'))
    await driver.get('http://i.mooc.chaoxing.com/space/index.shtml')
    await driver.wait(until.titleIs('杭州电子科技大学泛雅'))

    let data = {
      src: await driver.findElement(By.id('frame_content')).getAttribute('src'),
      cookie: (await driver.manage().getCookies()).map(
        cookie => `${cookie.name}=${cookie.value};`).join(' '),
    }
    await driver.quit()
    fs.writeFile('data.json', JSON.stringify(data), () => { })
    return data
    //await driver.switchTo().frame(await driver.findElement(By.id('frame_content')));
    //console.log(await driver.getCurrentUrl())
    //console.log(await driver.findElements(By.className('zmy_pic')));
  }
})().then((data) => {
  console.log('已获得登陆信息')

  var c = new Crawler({
    rateLimit: 100,
    // This will be called for each crawled page
    callback: function (error, res, done) {
      if (error) {
        console.log(error)
      } else {
        let $ = res.$
        // $ is Cheerio by default
        //a lean implementation of core jQuery designed specifically for the server
        //console.log($("title").text());
        //console.log(res.body);
      }
      done()
    },
  })

  // Queue just one URL, with default callback
  c.queue({
    uri: data.src,
    headers: {
      'Cookie': data.cookie,
    },
    callback: (e, r, d) => {
      let $ = r.$
      if (e) {
        console.log(e)
      } else {
        let course = $('#zkaikeshenqing').find('.zmy_pic')
        course.each((i, e) => {
          //console.log(e.attribs.href);
          c.queue({
            uri: e.attribs.href,
            headers: {
              'Cookie': data.cookie,
            },
            callback: decodeWorkUrl,
          })
        })
      }
      d()
    },
  })

  function decodeWorkUrl (e, r, d) {
    let $ = r.$
    if (e) {
      console.log(e)
    } else {
      let url = 'https://mooc1-2.chaoxing.com' +
        $('.navshow').find('a')[5].attribs.data
      //console.log(url);
      c.queue({
        uri: url,
        headers: {
          'Cookie': data.cookie,
        },
        callback: decodeWorkPage,
      })
    }
    d()
  }

  function decodeWorkPage (e, r, d) {
    let $ = r.$
    if (e) {
      console.log(e)
    } else {
      //console.log("--------------------------------");
      //console.log($('h1').find('span')[0].attribs.title);
      let course_name = $('h1').find('span')[0].attribs.title
      $('.ulDiv').find('.titTxt').each((i, e) => {
        let name = $(e).find('a')[0].attribs.title
        let state = $($(e).find('strong')[0]).text().trim()
        if (state === '待做') {
          //console.log(name);
          //console.log(state);
          let data = {}
          data.course_name = course_name
          data.name = name
          data.state = state
          $(e).find('.pt5').each((i, e) => {
            if (i < 2) {
              let time = $(e).text().trim()
              if (time.indexOf('截止时间') !== -1) {
                time = time.substr('开始时间：'.length, '2019-12-05 20:48'.length)
                data.time = time
                data.val = Date.parse(time) - Date.now()
              }
            }

          })
          //console.log(data);
          list.push(data)
        }
      })
      //exo();
    }
    d()
  }

  c.on('drain', function () {
    // For example, release a connection to database.
    ddls = []

    list.sort(function (a, b) {
      return a.val > b.val ? -1 : 1
    }).forEach((a) => {
      text = `${a.course_name}-${a.name}-${a.state}
截止日期:${a.time}
剩余时长:${(a.val / 1000 / 3600 / 24) | 0}天 ${a.val / 1000 / 3600 % 24 | 0}小时
`
      ddls.push(text.split('\n'))
      console.log(text)
    })

    fs.writeFile('ddl.json', JSON.stringify(ddls), () => {
    })
  })
})
