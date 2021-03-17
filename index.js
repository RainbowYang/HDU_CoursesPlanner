const CourseSystem = require('./src/CourseSystem.js')
const { id, password } = require('./config.json')

;(async () => {
  let system = new CourseSystem()
  await system.login({ id, password })
  let res = await system.searchCommonCourse('A0507042')
  // let res = await system.searchElectiveCourse('图画书艺术')
  console.log(res.data)
})()
