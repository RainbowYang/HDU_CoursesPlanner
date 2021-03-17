class CourseSeries {
  courses = []

  constructor (infos) {
    infos.split(/\s+/).forEach(info => this.setInfo(info))
  }

  setInfo (info) {
    let [key, value] = info.split('：')
    switch (key) {
      case '课程名称':
        this.title = value
        break
      case '学分':
        this.credit = Number(value)
        break
      case '开班数':
        this.count = Number(value)
    }
  }

  addMajorCourse (info) {
    this.courses.push(new MajorCourse(info))
  }
}

class MajorCourse {
  constructor (info) {
    [
      this.上课班号,
      this.教师姓名,
      this.开课学院,
      this.周学时,
      this.考核,
      this.上课时间,
      this.上课地点,
      this.校区,
      this.备注,
      this.授课方式,
      this.是否短学期,
      this.容量,
      this.教材名称,
      this.本专业已选人数,
      this.所有已选人数,
      this.选择情况,
    ] = info
  }

  get teacher () {
    return this.教师姓名
  }

  get time () {
    return this.上课时间
  }

  get capacity () {
    return this.容量
  }

  get selected () {
    return this.所有已选人数
  }

  get selectable () {
    return this.selected < this.capacity
  }
}

class ElectiveCourse {
  constructor (info) {
    [
      this.选课,
      this.预订教材,
      this.课程名称,
      this.课程代码,
      this.教师姓名,
      this.上课时间,
      this.上课地点,
      this.学分,
      this.周学时,
      this.起始结束周,
      this.容量,
      this.余量,
      this.课程归属,
      this.课程性质,
      this.校区代码,
      this.开课学院,
      this.考试时间,
    ] = info
  }

}

exports.CourseSeries = CourseSeries
exports.MajorCourse = MajorCourse
// 上课班号
// 教师姓名
// 教学班/开课学院
// 周学时
// 考核
// 上课时间
// 上课地点
// 校区
// 备注
// 授课方式
// 是否短学期
// 容量(人数)
// 教材名称
// 本专业已选人数
// 所有已选人数
// 选择情况

//
//     陈溪源
// 计算机学院（软件学院）
// 2.0-0.0
// 学校组织
// 周五第1,2节{第1-17周}
// 第7教研楼南109
// 下沙
//
//
// 否
// 36
// 无教材
// 36
// 36
//

