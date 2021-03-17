require('chromedriver')
const { Builder, By, until } = require('selenium-webdriver')

const { CommonCourseData, ElectiveCourseData } = require('./CourseData.js')

const config = require('../config.json')

/**
 * 本类负责操作HDU教务系统
 */
class CourseSystem {

  constructor () {
    this.logged = false
  }

  /**
   * 登录教务系统
   * @param id
   * @param password
   * @returns {Promise<void>}
   */
  async login ({ id, password } = config) {
    this.driver = await new Builder().forBrowser('chrome').build()
    this.windowIndex = 0

    const driver = this.driver
    await driver.get('http://cas.hdu.edu.cn/cas/login?service=http://jxgl.hdu.edu.cn/default.aspx')

    // 输入账号，密码进行登录
    if (await driver.wait(until.titleIs('HDU统一身份认证系统'))) {
      await driver.findElement(By.id('un')).sendKeys(id)
      await driver.findElement(By.id('pd')).sendKeys(password)
      await driver.findElement(By.id('index_login_btn')).click()
    }

    // 成功登录，初始化一些需要用到的URL
    if (await driver.wait(until.titleIs('正方教务管理系统'))) {
      let name = (await this.driver.findElement(By.id('xhxm')).getText()).replace('同学', '')
      this.commonCourseURL = `http://jxgl.hdu.edu.cn/xsxk.aspx?xh=${id}&xm=${name}&gnmkdm=N121101`
      this.electiveCourseURL = `http://jxgl.hdu.edu.cn/xf_xsqxxxk.aspx?xh=${id}&xm=${name}&gnmkdm=N121113`

      this.logged = true
    }
  }

  /**
   * 根据课程代码，从跨专业选课里面查询
   * @param courseCode
   * @returns {Promise<CommonCourseData>}
   */
  async searchCommonCourse (courseCode) {
    await this.gotoCommonCoursePage()

    const driver = this.driver
    await driver.findElement(By.id('Button1')).click() // 点击 跨专业选课

    await this.switchWindowForward()
    await driver.findElement(By.id('cx')).click() // 点击 按条件查询
    await driver.wait(until.elementLocated(By.id('RadioButtonList1_2'))).click() // 点击 课程代码
    await driver.findElement(By.id('TextBox1')).sendKeys(courseCode) // 输入 课程代码
    await driver.findElement(By.id('Button3')).click() // 点击 确定
    await driver.findElement(By.css('a')).click() // 选择第一个查询结果

    await this.switchWindowForward()
    // Label1的具体内容就像 课程名称：离散数学2     学分：2.0     开班数：14
    // let courseInfo = await driver.findElement(By.id('Label1')).getText()
    let table = await driver.findElement(By.id('xjs_table'))
    let data = await this.readTable(table)
    await this.switchWindowBackward()

    await this.switchWindowBackward()
    return new CommonCourseData(data)
  }

  /**
   * 根据课程名字查找通识选修课
   * @param courseName
   * @returns {Promise<ElectiveCourseData>}
   */
  async searchElectiveCourse (courseName) {
    await this.gotoElectiveCoursePage()

    const driver = this.driver

    await driver.findElement(By.id('ddl_kcgs')).findElement(By.xpath('./option[15]')).click() // 选择课程归属为空
    await driver.findElement(By.id('ddl_ywyl')).findElement(By.xpath('./option[3]')).click()  // 选择有无余量为空
    await driver.findElement(By.id('TextBox1')).sendKeys(courseName) // 输入课程名称
    await driver.findElement(By.id('Button2')).click() // 点击确定

    let table = await driver.findElement(By.id('kcmcGrid'))
    let data = await this.readTable(table)

    return new ElectiveCourseData(data)
  }

  /*--------utils--------*/

  async checkLogged () {
    if (!this.logged) {
      throw Error('You need to login first')
    }
  }

  async gotoCommonCoursePage () {
    await this.gotoCoursePage(this.commonCourseURL)
  }

  async gotoElectiveCoursePage () {
    await this.gotoCoursePage(this.electiveCourseURL)
  }

  async gotoCoursePage (URL) {
    await this.checkLogged()

    await this.driver.get(URL)
    //跳过 Object moved
    await this.driver.wait(until.titleIs('Object moved'))
    await this.driver.findElement(By.css('a')).click()
    await this.driver.wait(until.titleIs('现代教学管理信息系统'))
  }

  async switchWindowForward () {
    await this.switchWindowTo(this.windowIndex + 1)
  }

  async switchWindowBackward () {
    await this.switchWindowTo(this.windowIndex - 1)
  }

  async switchWindowTo (windowTargetIndex) {
    await this.checkLogged()

    let handles = await this.driver.getAllWindowHandles()
    if (windowTargetIndex < 0 || windowTargetIndex >= handles.length) {
      throw Error('window index is out of range')
    }

    if (windowTargetIndex > this.windowIndex) {
      // 前进，直接跳转
      this.windowIndex = windowTargetIndex
      await this.driver.switchTo().window(handles[windowTargetIndex])
    } else {
      // 后退，关掉多余的窗口
      while (windowTargetIndex < this.windowIndex) {
        await this.driver.close()
        this.windowIndex--
        await this.driver.switchTo().window(handles[this.windowIndex])
      }
    }
  }

  async readTable (table, needColumns = []) {
    let rows = await table.findElements(By.xpath('./tbody/tr'))

    // 规定空数组为获取全部列
    if (needColumns.length === 0) {
      needColumns = [...(await rows[0].findElements(By.xpath(`./td`))).keys()]
    }

    return await
      Promise.all(rows.map(row =>
        Promise.all(needColumns.map(async col => {
          // col + 1 是因为XPath从1开始数
          let elementPromise = row.findElement(By.xpath(`./td[${col + 1}]`))

          if (await elementPromise.isDisplayed()) {
            return await elementPromise.getText()
              || await elementPromise.findElement(By.css('input')).isSelected()
          } else {
            return null
          }
        }))
      ))
  }

  /*---------------------*/
}

module.exports = CourseSystem
