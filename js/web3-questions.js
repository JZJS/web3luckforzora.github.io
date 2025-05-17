document.addEventListener("DOMContentLoaded", function () {
  const questions = document.querySelectorAll(".question_box");
  const pageBtns = document.querySelectorAll(".page_btn");

  function showQuestion(index) {
    questions.forEach((q, i) => {
      q.classList.toggle("active", i === index);
    });

    // 更新按钮的选中状态
    pageBtns.forEach((btn, i) => {
      btn.classList.toggle("active", i === index);
    });
  }

  // 添加点击事件，点击页码跳转
  pageBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const pageIndex = parseInt(btn.getAttribute("data-page"));
      showQuestion(pageIndex);
    });
  });

  // 初始化显示第一个问题
  showQuestion(0);
});
