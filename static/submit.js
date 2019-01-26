const SERVER = 'http://localhost:3030';

function generateId(prefix) {
  return prefix + '_' + Math.random().toString(36).substr(2, 9);
}

function submit() {
  const questionType = document.getElementById('question-type');

  const typeOptions = questionType.options;
  const typeValue = typeOptions[typeOptions.selectedIndex].value;

  const titleEle = document.getElementById('title');
  const answerEle = document.getElementById('answer');
  const tipEle = document.getElementById('tip');
  const examTypeEle= document.getElementById('examType');
  const titleValue = titleEle.value;
  const answerValue = answerEle.value;
  const tipValue = tipEle.value;
  const examTypeValue = examTypeEle.value;

  $.ajax({
    method: 'post',
    url: `${SERVER}/api/submit`,
    crossDomain: true,
    xhrFields: {
      withCredentials: true
    },
    data: {
      examId: examTypeValue, // 考试类型: 1: 2019绩效管理
      type: typeValue, // 题目类型
      titleId: generateId('title'), // 题目id
      title: titleValue, // 题目
      tip: tipValue, // 选项。用于选择题
      answer: answerValue // 答案
    },
    success: response => {
      console.warn('⚠️ response ️️⚠️', response);
      const {code} = response;
      if (code === 0) {
        // titleEle.value = '(多选) ';
        titleEle.value = '';
        answerEle.value = '';
        tipEle.value = '';
      }
    },
    error: err => {
      console.warn('⚠️ err ️️⚠️', err);
    }
  });
}

function main() {
  const submitBtn = document.getElementById('submit-btn');
  submitBtn.addEventListener('click', () => {
    submit();
  });
}

window.onload = function() {
  main();
}
