var REPORT = [
  {
    code: 'work_time',
    name: 'Рабочее\nвремя',
    manual: false
  },
  {
    code: 'written_time',
    name: '% Списанного\nвремени',
    manual: false
  },
  {
    code: 'created_tasks',
    name: 'Задач\nзаведено',
    manual: false
  },
  {
    code: 'created_critical_tasks',
    name: 'Критических и\nПросроченых',
    manual: false
  },
  {
    code: 'created_tasks_paid_separately',
    name: 'Оплачивается\nотдельно',
    manual: false
  },
  {
    code: 'with_feedback_tasks',
    name: 'Оценено\n(отзвонено)',
    manual: false
  },
  {
    code: 'without_feedback_tasks',
    name: 'Без обратной\nсвязи\n(отзвонено)',
    manual: false
  },
  {
    code: 'operator_rating_avg',
    name: 'Ср. Оценка\nоператора',
    manual: false
  },
  {
    code: 'done_tasks',
    name: 'Решенные\nоператором/\nОценено',
    manual: false
  },
 {
   code: 'overdue_tasks',
   name: 'Просроченных/\nОценено',
   manual: false
 },
  {
    code: 'unsubscribed',
    name: 'Неотписано/\nОценено',
    manual: false
  },
 {
   code: 'claims',
   name: 'Претензий/\nОтработано',
   manual: false
 },
 {
   code: 'forgotten',
   name: 'Забыто',
   manual: true
 },
 {
   code: 'contacts_saved',
   name: 'Сохранено\nконтактов ЦА',
   manual: true
 },
  {
    code: 'delays',
    name: 'Опозданий\n(мин)',
    manual: true
  },
  {
    code: 'overtime_spent',
    name: 'Переработок\n(мин)',
    manual: true
  },
  {
    code: 'lies',
    name: 'Вранья',
    manual: true
  },
  {
    code: 'points_written_off',
    name: 'Баллов\nсписано по\nпретензиям',
    manual: true
  }
];

function processReports() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var rowI = 2;
  var columnI = 2;
  var doneIssues = [];
  var totalReports = [];
  OPTIONS.performers = OPTIONS.performers.map(function(user, userIndex) {
    user.reports = {};

    REPORT.forEach(function(report, reportIndex) {
      if (!report.manual) {
        var reportValue = getUserReport(report.code, user, userIndex);
        user.reports[report] = reportValue;
        if ((Array.isArray(reportValue))) {
          if (totalReports[reportIndex] === undefined) totalReports[reportIndex] = [];
          var listUrl = '';
          if ((Array.isArray(reportValue[0]))) {
            if (totalReports[reportIndex][0] === undefined) totalReports[reportIndex][0] = [];
            if (totalReports[reportIndex][1] === undefined) totalReports[reportIndex][1] = [];
            totalReports[reportIndex][0] = totalReports[reportIndex][0].concat(reportValue[0]);
            totalReports[reportIndex][1] = totalReports[reportIndex][1].concat(reportValue[1]);
            reportValue[0].forEach(function(task) {
              listUrl += 'http://redmine.zolotoykod.ru/issues/' + task.id + '\n';
            });
            sheet.getRange(rowI, columnI++).setValue(reportValue[0].length + ' / '+ reportValue[1].length).setNote(listUrl);
          } else {
            totalReports[reportIndex] = totalReports[reportIndex].concat(reportValue);
            reportValue.forEach(function(task) {
              listUrl += 'http://redmine.zolotoykod.ru/issues/' + task.id + '\n';
            });
            sheet.getRange(rowI, columnI++).setValue(reportValue.length).setNote(listUrl);
          }
        } else {
          if (totalReports[reportIndex] === undefined) totalReports[reportIndex] = 0;
          totalReports[reportIndex] += reportValue;
          if (report.code === 'work_time' && reportValue === 0) sheet.hideRows(rowI);
          sheet.getRange(rowI, columnI++).setValue(reportValue);
        }
      } else {
        if (parseInt(OPTIONS.performersWorkHours[userIndex], 10) === 0) sheet.getRange(rowI, columnI).setValue(0);
        ss.setNamedRange('manualRange' + rowI + columnI, sheet.getRange(sheet.getRange(rowI, columnI++).getA1Notation()));
      }
    });

    columnI = 2;
    rowI++;
    return user;
  });

  rowI += 2;

  totalReports.forEach(function(value, i) {
    if (i === 0) return ++columnI;

    if ((Array.isArray(value))) {
      var listUrl = '';
      if ((Array.isArray(value[0]))) {
        if (i === 9 && value[0].length > 1) {
          value[0] = filterUniqueArray(value[0]);
          if (value[1].length > 1) value[1] = filterUniqueArray(value[1]);
        }
        value[0].forEach(function(task) {
          listUrl += 'http://redmine.zolotoykod.ru/issues/' + task.id + '\n';
        });
        if (value[0].length === 0) sheet.hideColumns(columnI);
        sheet.getRange(rowI, columnI++).setValue(value[0].length + ' / ' + value[1].length).setNote(listUrl);
      } else {
        value.forEach(function(task) {
          listUrl += 'http://redmine.zolotoykod.ru/issues/' + task.id + '\n';
        });
        if (value.length === 0) sheet.hideColumns(columnI);
        sheet.getRange(rowI, columnI++).setValue(value.length).setNote(listUrl);
      }
    } else {
      if (value === 0) sheet.hideColumns(columnI);
      if (i === 5) return ++columnI;
      sheet.getRange(rowI, columnI++).setValue(Math.floor(value / OPTIONS.performers.length));
    }
  });

  columnI += 2;
  var colTotalDelays = sheet.getRange(rowI, columnI).getA1Notation().substr(0, 1);
  sheet.getRange(rowI, columnI++).setFormula('=SUM('+ colTotalDelays + '2:' + colTotalDelays + (rowI - 1) + ')');

  var colTotalOverTime = sheet.getRange(rowI, columnI).getA1Notation().substr(0, 1);
  sheet.getRange(rowI, columnI++).setFormula('=SUM('+ colTotalOverTime + '2:' + colTotalOverTime + (rowI - 1) + ')');
}

function getUserReport(report, user, userIndex) {
  switch (report) {
    case 'work_time':
      return getWorkTime(userIndex);
      break;

    case 'written_time':
      return getWrittenTime(user, userIndex);
      break;

    case 'created_tasks':
      return getСreatedTasks(user);
      break;

    case 'created_critical_tasks':
      return getСreatedCriticalTasks(user);
      break;

    case 'created_tasks_paid_separately':
      return getСreatedTasksPaidSeparately(user);
      break;

    case 'with_feedback_tasks':
      return getWithFeedbackTasks(user);
      break;

    case 'without_feedback_tasks':
      return getWithoutFeedbackTasks(user);
      break;

    case 'operator_rating_avg':
      return getOperatorRatingAverage(user);
      break;

    case 'done_tasks':
      return getDoneTasks(user);
      break;

    case 'overdue_tasks':
      return getOverdueTasks(user);
      break;

    case 'unsubscribed':
      return getUnsubscribed(user);
      break;

    case 'claims':
      return getClaims(user);
      break;
  }
}

function getWorkTime(i) {
  return OPTIONS.performersWorkHours[i];
}

function getWrittenTime(user, i) {
  var res = APIRequest('time_entries', {query: [
    {key: 'user_id', value: user.id},
    {key: 'spent_on', value: formatDate(OPTIONS.currentDate)}
  ]});

  var timeEntries = res.time_entries.reduce(function(a, c) {
    return a + c.hours;
  }, 0);

  if (!OPTIONS.performersWorkHours[i]) return 0;
  return Math.floor(100 / parseInt(OPTIONS.performersWorkHours[i], 10) * timeEntries);
}

function getСreatedTasks(user) {
  var res = APIRequest('issues', {query: [
    {key: 'tracker_id', value: '!5'},
    {key: 'author_id', value: user.id},
    {key: 'status_id', value: '*'},
    {key: 'created_on', value: formatDate(OPTIONS.currentDate)}
  ]});
  return res.issues;
}

function getСreatedCriticalTasks(user) {
  var res = APIRequest('issues', {query: [
    {key: 'tracker_id', value: '!5'},
    {key: 'author_id', value: user.id},
    {key: 'status_id', value: 'open'},
    {key: 'priority_id', value: '5'},
    {key: 'due_date', value: '<=' + formatDate(OPTIONS.currentDate)}
    // {key: 'created_on', value: formatDate(OPTIONS.currentDate)}
  ]});

  return res.issues;
}

function getСreatedTasksPaidSeparately(user) {
  var res = APIRequest('issues', {query: [
    {key: 'tracker_id', value: '!5'},
    {key: 'author_id', value: user.id},
    {key: 'status_id', value: '*'},
    {key: 'created_on', value: formatDate(OPTIONS.currentDate)},
    {key: 'cf_24', value: 'Единовременная услуга (К оплате)'}
  ]});

  return res.issues;
}

function getWithFeedbackTasks(user) {
  var res = APIRequest('issues', {query: [
    {key: 'tracker_id', value: '!5'},
    {key: 'status_id', value: 'closed'},
    {key: 'closed_on', value: formatDate(OPTIONS.currentDate)},
    {key: 'cf_14', value: '*'},
    {key: 'cf_34', value: '*'},
    {key: 'cf_7', value: '*'}
  ]});

  return res.issues.filter(function(item) {
    var userControl = item.custom_fields.find(function(i) {return i.id === 14});
    var isWithFeedback = item.custom_fields.find(function(i) {return i.id === 34});
    var rate = item.custom_fields.find(function(i) {return i.id === 7});
    if (userControl && isWithFeedback && rate)
      return (parseInt(userControl.value, 10) === user.id && isWithFeedback.value === '1' && rate.value !== '');
  });
}

function getWithoutFeedbackTasks(user) {
  var res = APIRequest('issues', {query: [
    {key: 'tracker_id', value: '!5'},
    {key: 'status_id', value: 'closed'},
    {key: 'closed_on', value: formatDate(OPTIONS.currentDate)},
    {key: 'cf_14', value: '*'},
    {key: 'cf_35', value: '*'}
  ]});

  return res.issues.filter(function(item) {
    var userControl = item.custom_fields.find(function(i) {return i.id === 14});
    var isWithoutFeedback = item.custom_fields.find(function(i) {return i.id === 35});
    if (userControl && isWithoutFeedback)
      return (parseInt(userControl.value, 10) === user.id && isWithoutFeedback.value === '1');
  });
}

function getOperatorRatingAverage(user) {
  var res = APIRequest('issues', {query: [
    {key: 'tracker_id', value: '!5'},
    {key: 'author_id', value: user.id},
    {key: 'status_id', value: '*'},
    {key: 'created_on', value: formatDate(OPTIONS.currentDate)},
    {key: 'cf_27', value: '*'}
  ]});

  var sum = res.issues.reduce(function(a, c) {
    return a + parseInt(c.custom_fields.find(function(i) {return i.id === 27}).value, 10);
  }, 0);
  return res.issues.length ? sum / res.issues.length : 0;
}

function getDoneTasks(user) {
  var res = APIRequest('issues', {query: [
    {key: 'tracker_id', value: '!5'},
    {key: 'assigned_to_id', value: user.id},
    {key: 'status_id', value: '*'},
    {key: 'created_on', value: '<=' + formatDate(OPTIONS.currentDate)},
    {key: 'updated_on', value: '>=' + formatDate(OPTIONS.currentDate)}
  ]});

  var filteredIssues = res.issues.filter(function(task) {
    var resDetail = APIRequestById('issues', task.id, {query: [
      {key: 'include', value: 'journals'}
    ]});

    for (var j = 0; j < resDetail.issue.journals.length; j++) {
      var journal = resDetail.issue.journals[j];
      var journalCreateDate = journal.created_on.split('T').shift();
      if (journalCreateDate === formatDate(OPTIONS.currentDate)) {
        for (var d = 0; d < journal.details.length; d++) {
          var detail = journal.details[d];
          if (detail.name === 'status_id' && detail.new_value === '3') return true;
        }
      }
    }
  });

  doneIssues = filteredIssues;

  var filteredIssuesWithRate = filteredIssues.filter(function(item) {
    var rate = item.custom_fields.find(function(i) {return i.id === 7});
    if (rate && rate.value !== '') return true;
  });
  return [filteredIssues, filteredIssuesWithRate];
}

function getOverdueTasks(user) {
  var overdueTasks = doneIssues.filter(function(item) {
    if (item.due_date && (Date.parse(item.due_date) + 1000 * 60 * 60 * 24) <= OPTIONS.currentDate.getTime())
      return true;
  });

  var overdueTasksWithRate = overdueTasks.filter(function(item) {
    var rate = item.custom_fields.find(function(i) {return i.id === 7});
    if (rate && rate.value !== '') return true;
  });

  return [overdueTasks, overdueTasksWithRate];
}

function getUnsubscribed(user) {
  var unsubscribed = doneIssues.filter(function(item) {
    var result = item.custom_fields.find(function(i) {return i.id === 1});
    if (result && result.value === '') return true;
  });

  var unsubscribedWithRate = unsubscribed.filter(function(item) {
    var rate = item.custom_fields.find(function(i) {return i.id === 7});
    if (rate && rate.value !== '') return true;
  });

  return [unsubscribed, unsubscribedWithRate];
}

function getClaims(user) {
  var res = APIRequest('issues', {query: [
    {key: 'tracker_id', value: 5},
    {key: 'status_id', value: '*'},
    {key: 'created_on', value: formatDate(OPTIONS.currentDate)}
  ]});

  var allClaims = res.issues.filter(function(item) {
    var responsibles = item.custom_fields.find(function(i) {return i.id === 40}).value;
    for (var i = 0; i < responsibles.length; i++) {
      if (parseInt(responsibles[i], 10) === user.id) return true;
    }
  });

  var closedClaims = allClaims.filter(function(item) {
    return item.status.id === 5;
  });

  return [allClaims, closedClaims];
}
