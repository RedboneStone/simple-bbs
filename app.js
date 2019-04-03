const express = require('express')
const cookieParser = require('cookie-parser')
const moment = require('moment')
global.moment = moment
const sqlite3 = require('sqlite3').verbose()
const port = 3000
console.log('opening database...')
const db = new sqlite3.Database(__dirname + '/bbs.sqlite3',()=>{
    console.log('database link success')
    console.log('web server opening...')
    app.listen(port,()=>{
        console.log('server listening on ' + port)
    })
})

const app = express()
// const users  = [{
//     id: 42,
//     name: 'damiao',
//     password: '123456',
//     email: '123@qq.com'
// },{
//     id: 43,
//     name: 'miao',
//     password: '123456',
//     email: '123@qq.com'
// },{
//     id: 44,
//     name: 'da',
//     password: '123456',
//     email: '123@qq.com'
// }]
const comment = []
const posts = [{
    id: 1,
    owner: 44,
    title: 'hello',
    content: 'world',
    timestamp : Date.now()
},{
    id: 2,
    owner: 42,
    title: 'lorem',
    content: 'world',
    timestamp : Date.now()
},{
    id: 3,
    owner: 43,
    title: 'NB',
    content: 'world',
    timestamp : Date.now()
}]
app.set('view engine','pug')
app.locals.pretty = true
app.use(express.json())
app.use(express.urlencoded({
    extended:true//开启解析扩展url编码的功能
}))
app.use(cookieParser('secret'))
app.use((req,res,next)=>{
    // if(req.signedCookies.user){
    //     req.user = users.find(it => it.name == req.signedCookies.user)
    // }
    if(req.signedCookies.loginUser){
    db.get('SELECT * FROM users WHERE name = ? ',req.signedCookies.loginUser,(err,user)=>{
        if(err){
            console.log(err)
        } else{
            req.user = user
            next()
        }
    })
    } else{
        next()
    }
})// 在浏览器请求 根目录页面前  查看请求头是否携带 cookie  判断 我们的数据库里是否有cookie的用户



// 根页面
app.get('/',(req,res,next) => {
    res.render('index.pug',{
        user: req.user,
        posts: posts,
        
    })
})



// 帖子的详细信息
app.get('/post/:id',(req,res,next)=>{
    var post = posts.find(it => it.id == req.params.id)

        res.render('post.pug',{
            user: req.user,
            post: post
        })
   
})

//发布帖子route
app.route('/add-thread')
 .get((req,res,next) => {
    res.render('add-thread.pug',{
        user: req.user
    })
 })
 .post((req,res,next) => {
   if(req.user){//用户登录才能发
        var thread = req.body
        var lastThread = posts[posts.length - 1]
        thread.timestamp = Date.now()
        thread.owner = req.user.name
        thread.id = lastThread.id + 1
        posts.push(thread)
        res.redirect('/post/' + thread.id)
   } else {
        res.redirect('/login')
   }    
 })


// 注册route
app.route('/register')
.get((req,res,next)=>{
    res.render('register.pug',{

    })
})
.post((req,res,next) => {
    db.run('INSERT INTO users(name,password) VALUES (?,?)',req.body.name,req.body.password,(err)=>{
        if(err){
            //1. name 在数据库里被设计成  primary key  所以不会重复   
            // 2  表的每一行  都有一个 隐藏的 rowid 会自动增加

            res.render('register_success.pug',{
                status: 'USERNAME_USED'
            })
        }else{
            res.cookie('loginUser',req.body.name,{
                signed: true,

            })
            res.render('register_success.pug',{
                status: 'SUCCESS',
                user: req.body
            })
        }
    })
    // if(users.find(it => it.name == req.body.name ) == null){
    //     req.body.id = users[users.length - 1].id + 1
    //     users.push(req.body)
 
    // } else {
       
    // }
   
})



// 登陆route
app.route('/login')
.get((req,res,next)=>{
    if(req.user){
        res.redirect('/')
    }else {
    res.render('login.pug',{

    })
  }

})
.post((req,res,next) => {
   db.get('SELECT * FROM users WHERE name == ? AND password =?' ,req.body.name,req.body.password,(err,user)=>{
       if(err){
           next(err)
       } else {
           if(user){
            res.cookie('loginUser',user.name,{
                expires: new Date(Date.now()+ 86400000),
                signed: true
            })//设置cookie  
            res.redirect('/')
           }else {
             res.send('用户名或密码错误')       
           }
       }
   })

    // var user = users.find(it => it.name == req.body.name )
    // if(user){
    //     if(user.password == req.body.password){
    //         res.cookie('user',user.name,{
    //             expires: new Date(Date.now()+ 86400000),
    //             signed: true
    //         })//设置cookie  
    //         res.redirect('/')
    //     }else {
    //         res.send('密码错误')
    //     }
    // }
    // else {
    //     res.send('用户名不存在')
    // }
})


//登出
app.get('/logout',(req,res,next) => {
    res.clearCookie('loginUser')
    res.redirect('/')
})


// app.listen(port,()=>{
//     console.log('server listening on',port)
// })//监听在port 端口
