const url = 'http://localhost:3030/api';

window.RQType = ''; // 题目类型
window.RQList = []; // 题目列表
window.RQid = 0; // 当前答题流程id
window.RQExamId = 1; // 当前考试id
window.RQCurrent = {}; // 当前题目
window.RQCurrentIndex = 0; // 当前题目索引
window.RQCurrentAn = ''; // 当前答案
window.RQTotalTime = 0; // 当前次总答题次数
window.RQBingoTime = 0; // 当前次总答题正确次数

function generateId() {
  return 'RQ_' + Math.random().toString(36).substr(2, 9);
}

function uniqueChar(str) {
  let _str = str;
  let result = '';
  const length = _str.length;
  for (let x = 0; x < length; x += 1) {

    if (result.indexOf(_str.charAt(x)) === -1) {
      result += _str[x];
    }
  }
  return result;
}

function uniqueArray(value, index, self) { 
  return self.indexOf(value) === index;
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function showToast(opt) {
  opt.showHideTransition = 'plain';
  opt.text = opt.text || '';
  opt.heading = opt.heading || '';

  $.toast({ ...opt });
}

// get question list & store question list in `RQList`
function getList() {
  const type = window.RQType;
  $.ajax({
    url: `${url}/list?type=${type}&examId=${window.RQExamId}`,
    success: response => {
      const { data } = response;
      window.RQList = shuffle(data);

      // hide type buttons
      const typeBtns = $('#type-btn');
      typeBtns.fadeOut();

      if (type === 'select') {
        const selectContent = $('#select-question-content');
        selectContent.delay(450).fadeIn();
      } else if (type === 'text') {
        const textContent = $('#text-question-content');
        textContent.delay(450).fadeIn();
      }

      handleQusetionList();
    },
    error: error => {
      showToast({
        text: error,
        heading: '错误！',
        loader: false,
        icon: 'error'
      });
    }
  });
}

// init or re-render `select` or `text` questions
function handleQusetionList() {
  // get question from list by random
  const list = window.RQList;
  const type = window.RQType;

  if (list.length === 0) {
    if (type === 'select') {
      const rate = (window.RQBingoTime / window.RQTotalTime) * 100;
      if (window.confirm(`当前考试(${window.RQid})答题次数：${window.RQTotalTime}, 正确率: ${rate}%`)) {
        window.location.reload();
        return;
      }
    } else {
      if (window.confirm('简单题回答结束～点击确定刷新页面')) {
        window.location.reload();
        return;
      }
    }
  } 

  window.RQCurrent = list[Math.floor(Math.random() * list.length)];
  window.RQTotalTime++;

  // remove click bind for next button & reset answer
  $('#next-btn').off();
  window.RQCurrentAn = '';

  if (window.RQType === 'select') {
    handleSelectQuestion();
  } else if (window.RQType === 'text') {
    handleTextQuestion();
  }
}

// check answer
function checkAnswer(titleId) {
  $.ajax({
    url: `${url}/check`,
    method: 'post',
    crossDomain: true,
    xhrFields: {
      withCredentials: true
    },
    data: {
      titleId,
      answer: window.RQCurrentAn
    },
    timeout: 2000,
    success: response => {
      const { data } = response;
      const { bingo, answer } = data;

      if (!bingo) {
        showToast({
          heading: '答错了',
          text: '正确答案: ' + answer,
          bgColor: '#fff',
          hideAfter: 7000,
          textColor: '#000',
          loader: true
        });
        setTimeout(() => {
          handleQusetionList();
        }, 7000);
      } else {
        window.RQBingoTime++;
        // remove item from `RQList` which is bingo
        const index = window.RQList.findIndex((r => r.titleId === window.RQCurrent.titleId));
        window.RQList.splice(index, 1);
        handleQusetionList();
      }
    },
    error: err => {
      showToast({
        text: JSON.stringify(err),
        heading: '提交失败！',
        icon: 'error',
        loader: false
      });
    }
  });
}

// reset `select` question content detail
function handleSelectQuestion() {
  const titleEle = $('#detail-title');
  const tipEle = $('#detail-tip');
  const { titleId, title, tip } = window.RQCurrent;

  let tipResult = '';
  const tipItems = tip.split('\n');
  tipItems.forEach((t, index) => {
    const value = t.replace(/([a-zA-Z])(.+)/, '$1');
    tipResult += `<span class="tip-item" data-tip="${titleId}-${index}" data-value="${value}">${t}</span><br />`;
  });

  titleEle.html(`· ${title}`);
  tipEle.html(tipResult);

  // bind click event for tip item each
  const arr = [];
  $('.tip-item').each(function () {
    const self = $(this);

    // self.toggle(() => {
    //   $(this).addClass('active');
    // }, () => {
    //   $(this).removeClass('active');
    // });
    self.click(() => {
      $(this).toggleClass('active');
    });
  });

  // next question
  $('#next-btn').click(() => {
    let answer = '';

    // get active item
    $('.tip-item').each((_, ele) => {
      const el = $(ele);
      if (el.hasClass('active')) {
        const value = el.data('value');
        arr.push(value);
      }
    });
    answer = arr.filter(uniqueArray).sort().join('');
    window.RQCurrentAn = answer;

    if (!window.RQCurrentAn) {
      showToast({
        text: '填个答案什么的',
        heading: '缺了点什么!',
        icon: 'warning',
        loader: false
      });
      return;
    }

    $.ajax({
      url: `${url}/save`,
      method: 'post',
      crossDomain: true,
      xhrFields: {
        withCredentials: true
      },
      data: {
        // TODO: 先默认是1，需加多一步选择考试题库
        examId: 1, // 考试类型: 1: 2019绩效管理
        RQid: window.RQid,
        type: window.RQType, // 题目类型
        titleId: titleId, // 题目id
        answer: window.RQCurrentAn
      },
      success: response => {
        const {code} = response;
        if (code === 0) {
          checkAnswer(titleId);
        }
      },
      timeout: 2000,
      error: err => {
        showToast({
          text: JSON.stringify(err),
          heading: '提交失败！',
          loader: false,
          icon: 'error'
        });
      }
    });
  });
}

// reset `text` question content
function handleTextQuestion() {
  let html = '';
  const {title, answer} = window.RQCurrent;
  const titleArr = title.split('\n');
  const answerArr = answer.split('\n');
  const ele = document.getElementById('text-question-content').children[0];

  titleArr.forEach((t, index) => {
    if (answerArr[index]) {
      html += `<span class="text-answer" data-answer="${t}">________</span>`;
    } else {
      html += t;
    }
  });

  ele.innerHTML = `<div id="detail-title">${html}</div>`;

  $('#text-question-content #next-btn').click(() => {
    // just remove `text` question from list
    const index = window.RQList.findIndex((r => r.titleId === window.RQCurrent.titleId));
    window.RQList.splice(index, 1);
    handleQusetionList();
  });

  $('.text-answer').each(function () {
    const self = $(this);
    self.click(function () {
      const answer = $(this).data('answer');
      $(this).html(`<span class="red">${answer}</span>`);
    });
  });
}

function main() {
  const startBtn = $('#start-btn');
  const typeBtns = $('#type-btn');
  const selectBtn = $('#type-btn-select');
  const textBtn = $('#type-btn-text');

  startBtn.click((e) => {
    window.RQExamId = e.target.dataset.examid;
    startBtn.fadeOut(400);
    typeBtns.delay(450).fadeIn();
  });

  // click select type button
  selectBtn.click(() => {
    window.RQType = 'select';
    getList();
  });

  // click text type button
  textBtn.click(() => {
    window.RQType = 'text';
    getList();
  });
}

window.onload = function () {
  main();

  window.RQid = generateId();
}
