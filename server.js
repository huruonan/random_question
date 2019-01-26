const Koa = require('koa');
const compression = require('koa-compress');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');
const AV = require('leancloud-storage');

const app = new Koa();
const router = new Router();
const APPID = 'a2wccVAAWXEQO1KQhsvGvESn-gzGzoHsz';
const APPKEY = 'grXEmCi6ffeoNC0nSj8DXMGE';

app.use(bodyParser({ormLimit: '10mb'}));
app.use(compression({threshold: 0}));
AV.init({
  appId: APPID,
  appKey: APPKEY
});

async function getQuestionList(ctx) {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Credentials', true);
  const className = 'randomQuestion';
  const {type, examId} = ctx.query;
  let keys = ['title', 'tip', 'type', 'titleId'];

  if (type === 'text') {
    keys = ['title', 'answer', 'type', 'titleId'];
  }

  const query = new AV.Query(className);
  const list = await query.equalTo('type', type).equalTo('examId', examId).select(keys).find().then(response => {
    const result = [];
    response.forEach(r => {
      result.push(r.attributes);
    });
    return {
      code: 0,
      data: result
    }    
  })
  .catch(err => {
    console.warn('getQuestionList error: ', err.message, err);
    return {
      code: error.code || 500,
      data: {}
    }
  });
  
  if (list.code !== 0) {
    ctx.throw(500);
    return;
  }

  ctx.body = list;
}

async function saveQuestion(ctx) {
  const className = 'randomQuestion';
  const {body} = ctx.request;
  ctx.set('Access-Control-Allow-Origin', 'http://localhost:1234');
  ctx.set('Access-Control-Allow-Credentials', true);
  const {
    type, titleId, title,
    answer, tip, examId
  } = body;

  const RandomQuestion = AV.Object.extend(className);
  const item = new RandomQuestion();

  const save = await item.save({
    examId,
    type,
    titleId,
    title,
    answer,
    tip
  })
    .then((response) => {
      const {id} = response;
      return {
        code: 0,
        data: {
          id
        }
      }
    })
    .catch((error) => {
      console.warn('saveQuestion error: ', error);
      return {
        code: error.code || 500,
        data: {}
      }
    });
  
  if (+save.code !== 0) {
    ctx.throw(500);
    return;
  }

  ctx.body = save;
}

async function saveAnswer(ctx) {
  ctx.set('Access-Control-Allow-Origin', 'http://localhost:1234');
  ctx.set('Access-Control-Allow-Credentials', true);
  const className = 'randomQuestionAnswer';
  const {body} = ctx.request;
  const {
    titleId, examId, type,
    answer, RQid
  } = body;

  const QuestionAnswer = AV.Object.extend(className);
  const item = new QuestionAnswer();

  const save = await item.save({
    RQid,
    examId,
    type,
    titleId,
    answer
  })
    .then((response) => {
      const {id} = response;
      return {
        code: 0,
        data: {
          id
        }
      }
    })
    .catch((error) => {
      console.warn('saveAnswer error: ', error);
      return {
        code: error.code || 500,
        data: {}
      }
    });
  
  if (+save.code !== 0) {
    ctx.throw(500);
    return;
  }

  ctx.body = save;
}

async function checkAnswer(ctx) {
  ctx.set('Access-Control-Allow-Origin', 'http://localhost:1234');
  ctx.set('Access-Control-Allow-Credentials', true);
  const className = 'randomQuestion';
  const {body} = ctx.request;
  const {titleId, answer} = body;

  const query = new AV.Query(className);
  const list = await query.equalTo('titleId', titleId).find().then(response => {
    let result = {};
    response.forEach(r => {
      result = r.attributes;
    });
    const bingo = result.answer === answer;
    return {
      code: 0,
      data: {
        answer: result.answer.trim(),
        bingo
      }
    }    
  })
  .catch(err => {
    console.warn('checkAnswer error: ', err.message, err);
    return {
      code: err.code || 500,
      data: {}
    }
  });
  
  if (list.code !== 0) {
    ctx.throw(500);
    return;
  }

  ctx.body = list;
}

router.get('/api/monitor/ping', async (ctx) => {
  ctx.body = 'ok';
});
router.get('/api/list', getQuestionList);
router.post('/api/submit', saveQuestion);
router.post('/api/save', saveAnswer);
router.post('/api/check', checkAnswer);

router.get('/', (ctx) => {
  ctx.throw(404);
});

app.use(router.routes());

const port = 3030;
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
