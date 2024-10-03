const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, 'todoApplication.db')

const app = express()
app.use(express.json())

let db = null
const init = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running on port 3000')
    })
  } catch (e) {
    console.log(e.message)
    process.exit(1)
  }
}

init()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}
const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}
const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}
const hasTodoProperty = requestQuery => {
  return requestQuery.todo !== undefined
}
const format = obj => {
  return {
    id: obj.id,
    todo: obj.todo,
    priority: obj.priority,
    status: obj.status,
  }
}

// API 1
app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''
  const {search_q = '', priority, status} = request.query
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
        SELECT * 
        FROM todo 
        WHERE todo LIKE '%${search_q}%' 
        AND status = '${status}' 
        AND priority = '${priority}';`
      break
    case hasPriorityProperty(request.query):
      getTodosQuery = `
        SELECT * 
        FROM todo 
        WHERE todo LIKE '%${search_q}%' 
        AND priority = '${priority}';`
      break
    case hasStatusProperty(request.query):
      getTodosQuery = `
        SELECT * 
        FROM todo 
        WHERE todo LIKE '%${search_q}%' 
        AND status = '${status}';`
      break
    default:
      getTodosQuery = `
        SELECT * 
        FROM todo 
        WHERE todo LIKE '%${search_q}%';`
  }
  data = await db.all(getTodosQuery)
  response.send(data.map(each => format(each)))
})

// API 2
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getById = `
    SELECT * 
    FROM todo 
    WHERE id = ${todoId};`
  const todo = await db.get(getById)
  response.send(format(todo))
})

// API 3
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const createQry = `
    INSERT INTO todo (id, todo, priority, status) 
    VALUES (${id}, '${todo}', '${priority}', '${status}');`
  await db.run(createQry)
  response.send('Todo Successfully Added')
})

// API 4
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const {todo, priority, status} = request.body
  let updateQry = ''

  switch (true) {
    case hasStatusProperty(request.body):
      updateQry = `
        UPDATE todo 
        SET status = '${status}' 
        WHERE id = ${todoId};`
      await db.run(updateQry)
      response.send('Status Updated')
      break
    case hasPriorityProperty(request.body):
      updateQry = `
        UPDATE todo 
        SET priority = '${priority}' 
        WHERE id = ${todoId};`
      await db.run(updateQry)
      response.send('Priority Updated')
      break
    case hasTodoProperty(request.body):
      updateQry = `
        UPDATE todo 
        SET todo = '${todo}' 
        WHERE id = ${todoId};`
      await db.run(updateQry)
      response.send('Todo Updated')
      break
    default:
      response.send('No valid fields to update')
  }
})

// API 5
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQry = `
    DELETE FROM todo 
    WHERE id = ${todoId};`
  await db.run(deleteQry)
  response.send('Todo Deleted')
})

module.exports = app
